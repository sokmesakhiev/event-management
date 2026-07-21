require "net/http"
require "openssl"
require "base64"
require "json"

# Thin client for the ABA PayWay payment gateway (KHQR).
#
# Docs: https://developer.payway.com.kh
#
# Default credentials/base_url come from config/payway.yml — one section per
# environment, same pattern as config/database.yml. merchant_id / api_key
# still ultimately come from ENV (the yml just reads them via ERB), but
# base_url is now pinned explicitly per environment there, so production can
# never silently fall back to the sandbox URL just because an env var was
# left unset.
module AbaPayway
  class Error < StandardError; end
  class ConfigurationError < Error; end
  class RequestError < Error; end

  class Client
    GENERATE_QR_PATH = "/api/payment-gateway/v1/payments/generate-qr"
    CHECK_TRANSACTION_PATH = "/api/payment-gateway/v1/payments/check-transaction-2"

    def initialize(merchant_id: self.class.config.merchant_id,
                   api_key: self.class.config.api_key,
                   base_url: self.class.config.base_url)
      @merchant_id = merchant_id
      @api_key = api_key
      @base_url = base_url.to_s.chomp("/")
    end

    class << self
      # config/payway.yml, keyed by environment (same pattern as
      # config/database.yml). Re-read on every call rather than cached once
      # at boot, so ENV overrides take effect immediately without a server
      # restart, and so tests can swap credentials per example the same way
      # they always have.
      def config
        Rails.application.config_for(:payway)
      end

      # Builds a client for a registration payment (attendee → organizer) on
      # the given event. Uses the event creator's own PayWay credentials when
      # they've connected one via their profile (Profile#payway_configured?),
      # so the money lands directly in the organizer's PayWay account;
      # otherwise falls back to the platform's default credentials
      # (config/payway.yml).
      #
      # Organizer "pay to publish" charges (EventPlanPayment — organizer →
      # Rally) must never use this; they should always use `Client.new` with
      # no args so proceeds go to Rally's own account.
      def for_event(event)
        profile = event.creator&.profile
        if profile&.payway_configured?
          new(merchant_id: profile.payway_merchant_id, api_key: profile.payway_api_key)
        else
          new
        end
      end
    end

    # Generates a dynamic ABA KHQR code for a purchase.
    #
    # Returns a hash with the parsed PayWay response (qrString, qrImage,
    # abapay_deeplink, app_store, play_store, status).
    def generate_qr(tran_id:, amount_cents:, currency:, lifetime_minutes: 15,
                     first_name: nil, last_name: nil, email: nil, phone: nil,
                     callback_url: nil, qr_image_template: "template3_color")
      ensure_configured!

      req_time = format_time(Time.now.utc)
      amount = format_amount(amount_cents, currency)
      items = nil
      return_deeplink = nil
      custom_fields = nil
      return_params = nil
      payout = nil
      encoded_callback_url = callback_url.present? ? Base64.strict_encode64(callback_url) : nil
      purchase_type = "purchase"
      payment_option = "abapay_khqr"

      hash = sign(
        req_time, @merchant_id, tran_id, amount, items, first_name, last_name, email, phone,
        purchase_type, payment_option, encoded_callback_url, return_deeplink, currency.to_s.upcase,
        custom_fields, return_params, payout, lifetime_minutes, qr_image_template
      )

      body = {
        req_time: req_time,
        merchant_id: @merchant_id,
        tran_id: tran_id,
        amount: amount,
        currency: currency.to_s.upcase,
        payment_option: payment_option,
        purchase_type: purchase_type,
        first_name: first_name,
        last_name: last_name,
        email: email,
        phone: phone,
        items: items,
        callback_url: encoded_callback_url,
        return_deeplink: return_deeplink,
        custom_fields: custom_fields,
        return_params: return_params,
        payout: payout,
        lifetime: lifetime_minutes,
        qr_image_template: qr_image_template,
        hash: hash
      }.compact

      post_json(GENERATE_QR_PATH, body)
    end

    # Looks up the current status of a transaction created in the last 7 days.
    def check_transaction(tran_id:)
      ensure_configured!

      req_time = format_time(Time.now.utc)
      hash = sign(req_time, @merchant_id, tran_id)

      post_json(CHECK_TRANSACTION_PATH, {
        req_time: req_time,
        merchant_id: @merchant_id,
        tran_id: tran_id,
        hash: hash
      })
    end

    private

    def ensure_configured!
      return if @merchant_id.present? && @api_key.present?
      raise ConfigurationError,
        "ABA PayWay merchant_id / api_key are not configured — set ABA_PAYWAY_MERCHANT_ID / " \
        "ABA_PAYWAY_API_KEY (read by config/payway.yml)"
    end

    def format_time(time)
      time.strftime("%Y%m%d%H%M%S")
    end

    # ABA requires whole numbers for KHR and 2-decimal strings for everything else.
    def format_amount(amount_cents, currency)
      if currency.to_s.casecmp("khr").zero?
        (amount_cents / 100.0).round.to_s
      else
        format("%.2f", amount_cents / 100.0)
      end
    end

    # Base64(HMAC-SHA512(concatenated params, api_key))
    def sign(*parts)
      data = parts.map(&:to_s).join
      digest = OpenSSL::HMAC.digest("sha512", @api_key, data)
      Base64.strict_encode64(digest)
    end

    def post_json(path, body)
      uri = URI.join(@base_url, path)

      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == "https"
      http.open_timeout = 10
      http.read_timeout = 15

      request = Net::HTTP::Post.new(uri)
      request["Content-Type"] = "application/json"
      request.body = body.to_json

      response = http.request(request)
      parsed = JSON.parse(response.body, symbolize_names: true)

      unless response.is_a?(Net::HTTPSuccess)
        raise RequestError, "ABA PayWay HTTP #{response.code}: #{parsed.dig(:status, :message) || response.body}"
      end

      parsed
    rescue JSON::ParserError => e
      raise RequestError, "ABA PayWay returned invalid JSON: #{e.message}"
    rescue Timeout::Error, Errno::ECONNREFUSED, SocketError => e
      raise RequestError, "ABA PayWay request failed: #{e.message}"
    end
  end
end
