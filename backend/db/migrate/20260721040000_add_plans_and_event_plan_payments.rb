class AddPlansAndEventPlanPayments < ActiveRecord::Migration[8.1]
  def change
    # Which pricing tier (see Event::PLANS) an event published under.
    # Nil until the organizer pays to publish (or picks the free tier).
    add_column :events, :plan, :string

    # Organizer-side payments: the fee to publish an event under a given
    # plan. Separate from `payments`, which are participant registration
    # fees — different payer, different trigger, same ABA PayWay gateway.
    create_table :event_plan_payments, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :event_id, null: false
      t.uuid :user_id, null: false # the organizer paying
      t.string :plan, null: false
      t.string :provider, null: false, default: "aba_payway"
      t.string :tran_id, null: false
      t.string :status, null: false, default: "pending" # pending | paid | declined | cancelled | expired
      t.integer :amount_cents, null: false
      t.string :currency, null: false, default: "usd"
      t.text :qr_string
      t.text :abapay_deeplink
      t.datetime :expires_at
      t.datetime :paid_at
      t.jsonb :raw_response, default: {}, null: false
      t.timestamps
    end

    add_index :event_plan_payments, :tran_id, unique: true
    add_index :event_plan_payments, :event_id
    add_index :event_plan_payments, [ :event_id, :status ]

    add_foreign_key :event_plan_payments, :events
    add_foreign_key :event_plan_payments, :users
  end
end
