class User < ApplicationRecord
  has_secure_password

  has_one :profile, dependent: :destroy
  has_many :events, foreign_key: :creator_id, dependent: :destroy
  has_many :registrations, dependent: :destroy

  validates :email, presence: true, uniqueness: { case_sensitive: false }, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, if: :password_required?

  before_save { self.email = email.downcase.strip }
  after_create :create_profile!

  private

  def password_required?
    password_digest.nil? || password.present?
  end
end
