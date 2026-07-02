class SurveyQuestion < ApplicationRecord
  TYPES = %w[text single_choice multiple_choice].freeze

  belongs_to :survey
  has_many   :registration_answers, dependent: :destroy

  validates :question_text, presence: true, length: { maximum: 500 }
  validates :question_type, inclusion: { in: TYPES }
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate  :options_present_for_choice_questions

  # Ensure options is always an array
  attribute :options, :jsonb, default: []

  private

  def options_present_for_choice_questions
    return if question_type == "text"
    if options.blank? || options.size < 2
      errors.add(:options, "must have at least 2 options for choice questions")
    end
  end
end
