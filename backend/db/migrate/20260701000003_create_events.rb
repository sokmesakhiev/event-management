class CreateEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :events, id: :uuid, default: "gen_random_uuid()" do |t|
      t.references :creator, null: false, foreign_key: { to_table: :users }, type: :uuid, index: true
      t.string :title, null: false
      t.text :description
      t.string :category, null: false, default: "other"
      t.string :location
      t.datetime :start_at, null: false
      t.datetime :end_at
      t.integer :capacity
      t.integer :price_cents, null: false, default: 0
      t.string :currency, null: false, default: "usd"
      t.boolean :is_published, null: false, default: false
      t.string :brand_color, null: false, default: "#6366f1"
      t.string :banner_url
      t.string :logo_url
      t.timestamps
    end

    add_index :events, :start_at
    add_index :events, :is_published
  end
end
