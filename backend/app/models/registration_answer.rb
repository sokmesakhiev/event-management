class RegistrationAnswer < ApplicationRecord
  belongs_to :registration
  belongs_to :survey_question

  validates :registration_id, uniqueness: { scope: :survey_question_id }
  validate  :answer_present
  validate  :valid_options_selected

  attribute :answer_options, :jsonb, default: []

  private

  def answer_present
    return unless survey_question&.required?
    case survey_question.question_type
    when "text"
      errors.add(:answer_text, "can't be blank") if answer_text.blank?
    when "single_choice", "multiple_choice"
      errors.add(:answer_options, "must select at least one option") if answer_options.blank?
    end
  end

  def valid_options_selected
    return if survey_question.nil?
    return if answer_options.blank?
    return unless %w[single_choice multiple_choice].include?(survey_question.question_type)

    valid_ids = survey_question.options.map { |o| o["id"] }
    invalid = answer_options - valid_ids
    errors.add(:answer_options, "contains invalid option(s): #{invalid.join(", ")}") if invalid.any?

    if survey_question.question_type == "single_choice" && answer_options.size > 1
      errors.add(:answer_options, "can only select one option")
    end
  end
end
