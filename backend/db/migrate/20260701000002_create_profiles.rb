class CreateProfiles < ActiveRecord::Migration[8.1]
  def change
    create_table :profiles, id: :uuid, default: "gen_random_uuid()" do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid, index: { unique: true }
      t.string :display_name
      t.string :avatar_url
      t.timestamps
    end
  end
end
