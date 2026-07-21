# The organizer-side fee to publish an event under a given pricing tier
# (Event::PLANS). Deliberately separate from Payment (which is a
# participant's registration fee) — different payer, different trigger,
# same ABA PayWay gateway underneath.
class EventPlanPayment < ApplicationRecord
  belongs_to :event
  belongs_to :user # the organizer paying

  STATUSES = %w[pending paid declined cancelled expired].freeze

  validates :plan, inclusion: { in: Event::PLANS.keys }
  validates :provider, presence: true
  validates :tran_id, presence: true, uniqueness: true
  validates :status, inclusion: { in: STATUSES }
  validates :amount_cents, numericality: { greater_than_or_equal_to: 0 }
  validates :currency, presence: true

  scope :pending, -> { where(status: "pending") }

  def paid?
    status == "paid"
  end

  def pending?
    status == "pending"
  end

  def expired?
    expires_at.present? && expires_at < Time.current
  end

  # ABA amounts are formatted differently per currency: KHR has no decimal
  # places, everything else (USD) uses 2 decimal places.
  def formatted_amount
    if currency.to_s.casecmp("khr").zero?
      (amount_cents / 100.0).round.to_s
    else
      format("%.2f", amount_cents / 100.0)
    end
  end

  # Publishes the event under this plan. Called once ABA confirms payment
  # (or immediately, for the free tier, which is never actually "pending").
  def mark_paid!(raw_response: {})
    transaction do
      update!(status: "paid", paid_at: Time.current, raw_response: raw_response)
      event.update!(
        plan: plan,
        capacity: Event::PLANS.fetch(plan)[:capacity],
        is_published: true
      )
    end
  end
end
