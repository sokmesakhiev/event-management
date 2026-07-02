class Event < ApplicationRecord
  belongs_to :creator, class_name: "User"
  belongs_to :survey, optional: true
  has_many :registrations, dependent: :destroy
  has_many :event_types, -> { order(position: :asc) }, dependent: :destroy

  accepts_nested_attributes_for :event_types,
    allow_destroy: true,
    reject_if: :all_blank

  has_one_attached :banner_image
  has_one_attached :logo_image

  CATEGORIES = %w[running cycling swimming triathlon hiking other].freeze

  validates :title, presence: true, length: { maximum: 120 }
  validates :category, inclusion: { in: CATEGORIES }
  validates :start_at, presence: true
  validates :price_cents, numericality: { greater_than_or_equal_to: 0 }
  validate :end_after_start

  scope :published, -> { where(is_published: true) }
  scope :upcoming, -> { where("start_at >= ?", Time.current) }

  private

  def end_after_start
    return unless end_at && start_at
    errors.add(:end_at, "must be after start time") if end_at <= start_at
  end
end
