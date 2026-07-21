require "rails_helper"

RSpec.describe AbaPayway::Client, ".for_event" do
  around do |example|
    original = ENV.to_hash
    ENV["ABA_PAYWAY_MERCHANT_ID"] = "platform_merchant"
    ENV["ABA_PAYWAY_API_KEY"] = "platform_key"
    example.run
    ENV.replace(original)
  end

  it "uses the platform credentials when the organizer hasn't connected PayWay" do
    event = create(:event)

    client = described_class.for_event(event)

    expect(client.instance_variable_get(:@merchant_id)).to eq("platform_merchant")
    expect(client.instance_variable_get(:@api_key)).to eq("platform_key")
  end

  it "uses the organizer's own credentials once they've connected PayWay" do
    event = create(:event)
    event.creator.profile.update!(payway_merchant_id: "organizer_merchant", payway_api_key: "organizer_key")

    client = described_class.for_event(event)

    expect(client.instance_variable_get(:@merchant_id)).to eq("organizer_merchant")
    expect(client.instance_variable_get(:@api_key)).to eq("organizer_key")
  end
end

RSpec.describe AbaPayway::Client, ".config" do
  it "reads merchant_id/api_key from ENV and base_url from config/payway.yml for the current environment" do
    original = ENV.to_hash
    ENV["ABA_PAYWAY_MERCHANT_ID"] = "yml_merchant"
    ENV["ABA_PAYWAY_API_KEY"] = "yml_key"

    config = described_class.config

    expect(config.merchant_id).to eq("yml_merchant")
    expect(config.api_key).to eq("yml_key")
    expect(config.base_url).to eq("https://checkout-sandbox.payway.com.kh")
  ensure
    ENV.replace(original)
  end

  it "lets an explicit ABA_PAYWAY_BASE_URL override the environment's default" do
    original = ENV.to_hash
    ENV["ABA_PAYWAY_BASE_URL"] = "https://staging.payway.example"

    expect(described_class.config.base_url).to eq("https://staging.payway.example")
  ensure
    ENV.replace(original)
  end
end
