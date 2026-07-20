class User < ApplicationRecord
  # Rails 8.1's has_secure_password auto-generates a stateless password_reset_token
  # (via generates_token_for) and a class-level find_by_password_reset_token method
  # by default. This app has its own DB-column-backed reset flow below (token +
  # expiry persisted, mailer, controller) — the built-in one is disabled so it
  # doesn't shadow our #password_reset_token attribute reader.
  has_secure_password reset_token: false

  has_one :profile, dependent: :destroy
  has_many :events, foreign_key: :creator_id, dependent: :destroy
  has_many :registrations, dependent: :destroy
  has_many :surveys, foreign_key: :creator_id, dependent: :destroy

  # Tokens are single-use, random, and time-boxed — plain-text storage is fine
  # here (unlike passwords) since they're low-value, short-lived, and unique.
  PASSWORD_RESET_EXPIRY = 2.hours
  EMAIL_VERIFICATION_EXPIRY = 3.days

  validates :email, presence: true, uniqueness: { case_sensitive: false }, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, if: :password_required?

  before_validation { self.email = email.downcase.strip if email.present? }
  after_create :create_profile!
  after_create :generate_email_verification_token!

  def email_verified?
    email_verified_at.present?
  end

  def verify_email!
    update!(email_verified_at: Time.current, email_verification_token: nil, email_verification_sent_at: nil)
  end

  def generate_email_verification_token!
    update!(email_verification_token: SecureRandom.urlsafe_base64(32), email_verification_sent_at: Time.current)
  end

  def generate_password_reset_token!
    update!(password_reset_token: SecureRandom.urlsafe_base64(32), password_reset_sent_at: Time.current)
  end

  def password_reset_token_valid?
    password_reset_token.present? && password_reset_sent_at.present? &&
      password_reset_sent_at > PASSWORD_RESET_EXPIRY.ago
  end

  def reset_password!(new_password)
    update!(password: new_password, password_confirmation: new_password,
            password_reset_token: nil, password_reset_sent_at: nil)
  end

  class << self
    def find_by_valid_password_reset_token(token)
      return nil if token.blank?
      user = find_by(password_reset_token: token)
      return nil unless user
      return nil unless user.password_reset_token_valid?
      user
    end

    def find_by_valid_email_verification_token(token)
      return nil if token.blank?
      user = find_by(email_verification_token: token)
      return nil unless user
      return nil if user.email_verification_sent_at.present? && user.email_verification_sent_at < EMAIL_VERIFICATION_EXPIRY.ago
      user
    end
  end

  private

  def password_required?
    password_digest.nil? || password.present?
  end
end
