class CreateSurveys < ActiveRecord::Migration[8.1]
  def change
    create_table :surveys, id: :uuid, default: "gen_random_uuid()" do |t|
      t.references :creator, null: false, foreign_key: { to_table: :users }, type: :uuid, index: true
      t.string :title, null: false, default: "Registration Survey"
      t.timestamps
    end
  end
end
