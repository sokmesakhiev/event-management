class Registration < ApplicationRecord
  belongs_to :event
  belongs_to :user
  has_many :registration_answers, dependent: :destroy
  has_many :registration_event_types, dependent: :destroy
  has_many :event_types, through: :registration_event_types

  STATUSES = %w[confirmed cancelled].freeze
  PAYMENT_STATUSES = %w[unpaid paid refunded].freeze

  validates :status, inclusion: { in: STATUSES }
  validates :payment_status, inclusion: { in: PAYMENT_STATUSES }
  validates :user_id, uniqueness: { scope: :event_id, message: "already registered for this event" }
  validate :event_not_full, on: :create

  private

  def event_not_full
    return unless event&.capacity
    if event.registrations.count >= event.capacity
      errors.add(:base, "This event is full")
    end
  end
end
