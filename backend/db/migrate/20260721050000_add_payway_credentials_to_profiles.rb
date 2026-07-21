class AddPaywayCredentialsToProfiles < ActiveRecord::Migration[8.1]
  def change
    add_column :profiles, :payway_merchant_id, :string
    # Encrypted via Active Record encryption (Profile#encrypts) — ciphertext is
    # base64 and larger than the plaintext, so this needs to be unbounded text
    # rather than a typical varchar.
    add_column :profiles, :payway_api_key, :text
  end
end
