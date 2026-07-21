class RegistrationEventType < ApplicationRecord
  belongs_to :registration
  belongs_to :event_type

  validates :registration_id, uniqueness: { scope: :event_type_id, message: "already registered for this type" }

  validate :event_type_not_full, on: :create
  validate :event_type_belongs_to_same_event

  private

  def event_type_not_full
    return unless event_type&.full?
    # :event_type_full is a machine-readable code — see
    # RegistrationsController#create.
    errors.add(:base, :event_type_full, message: "#{event_type.name} is full")
  end

  def event_type_belongs_to_same_event
    return unless registration && event_type
    unless event_type.event_id == registration.event_id
      errors.add(:event_type, "does not belong to this event")
    end
  end
end
