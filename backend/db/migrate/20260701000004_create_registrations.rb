class CreateRegistrations < ActiveRecord::Migration[8.1]
  def change
    create_table :registrations, id: :uuid, default: "gen_random_uuid()" do |t|
      t.references :event, null: false, foreign_key: true, type: :uuid
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.string :status, null: false, default: "confirmed"
      t.string :payment_status, null: false, default: "unpaid"
      t.integer :amount_paid_cents, null: false, default: 0
      t.timestamps
    end

    add_index :registrations, [ :event_id, :user_id ], unique: true
  end
end
