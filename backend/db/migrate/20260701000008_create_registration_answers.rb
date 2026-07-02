class CreateRegistrationAnswers < ActiveRecord::Migration[8.1]
  def change
    create_table :registration_answers, id: :uuid, default: "gen_random_uuid()" do |t|
      t.references :registration,     null: false, foreign_key: true, type: :uuid, index: true
      t.references :survey_question,  null: false, foreign_key: true, type: :uuid, index: true
      # Free-text answer
      t.text  :answer_text
      # Selected option ids for single_choice / multiple_choice
      t.jsonb :answer_options, null: false, default: []
      t.timestamps
    end

    add_index :registration_answers, [ :registration_id, :survey_question_id ], unique: true,
              name: "index_reg_answers_on_reg_and_question"
  end
end
