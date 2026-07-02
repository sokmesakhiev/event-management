class CreateSurveyQuestions < ActiveRecord::Migration[8.1]
  def change
    create_table :survey_questions, id: :uuid, default: "gen_random_uuid()" do |t|
      t.references :survey, null: false, foreign_key: true, type: :uuid, index: true
      t.text    :question_text, null: false
      # "text" | "single_choice" | "multiple_choice"
      t.string  :question_type, null: false, default: "text"
      # JSONB array of { id: uuid, label: string } for choice questions
      t.jsonb   :options, null: false, default: []
      t.integer :position, null: false, default: 0
      t.boolean :required, null: false, default: false
      t.timestamps
    end

    add_index :survey_questions, [ :survey_id, :position ]
  end
end
