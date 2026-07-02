class Survey < ApplicationRecord
  belongs_to :creator, class_name: "User"
  has_one    :event, dependent: :nullify   # event.survey_id → nil on survey delete
  has_many   :survey_questions, -> { order(position: :asc) }, dependent: :destroy

  validates :title, presence: true, length: { maximum: 200 }

  accepts_nested_attributes_for :survey_questions,
    allow_destroy: true,
    reject_if: :all_blank
end
