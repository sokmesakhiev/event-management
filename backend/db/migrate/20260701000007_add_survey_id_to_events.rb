class AddSurveyIdToEvents < ActiveRecord::Migration[8.1]
  def change
    add_reference :events, :survey, type: :uuid, foreign_key: true, index: true, null: true
  end
end
