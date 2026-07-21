require "rails_helper"

RSpec.describe Profile, type: :model do
  # ── Associations ─────────────────────────────────────────────────────────────
  describe "associations" do
    it { is_expected.to belong_to(:user) }
  end

  # ── Validations ──────────────────────────────────────────────────────────────
  describe "validations" do
    it "enforces one profile per user" do
      user = create(:user)           # profile auto-created
      duplicate = build(:profile, user: user)
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:user_id]).to be_present
    end
  end

  # ── Attributes ───────────────────────────────────────────────────────────────
  describe "attributes" do
    it "allows display_name and avatar_url to be nil" do
      profile = create(:user).profile
      profile.update!(display_name: nil, avatar_url: nil)
      expect(profile).to be_persisted
    end

    it "can store a display_name" do
      profile = create(:user).profile
      profile.update!(display_name: "Alex Runner")
      expect(profile.reload.display_name).to eq("Alex Runner")
    end
  end

  # ── PayWay credentials ───────────────────────────────────────────────────────
  describe "PayWay credentials" do
    let(:profile) { create(:user).profile }

    it "is not configured by default" do
      expect(profile).not_to be_payway_configured
      expect(profile.payway_api_key_masked).to be_nil
    end

    it "is configured once both fields are set" do
      profile.update!(payway_merchant_id: "merchant_123", payway_api_key: "secret_abcdef1234")
      expect(profile.reload).to be_payway_configured
    end

    it "requires an api key if a merchant id is set" do
      profile.payway_merchant_id = "merchant_123"
      expect(profile).not_to be_valid
      expect(profile.errors[:payway_api_key]).to be_present
    end

    it "requires a merchant id if an api key is set" do
      profile.payway_api_key = "secret_abcdef1234"
      expect(profile).not_to be_valid
      expect(profile.errors[:payway_merchant_id]).to be_present
    end

    it "treats blank strings as disconnecting, not as set" do
      profile.update!(payway_merchant_id: "", payway_api_key: "")
      expect(profile.reload).to be_valid
      expect(profile.payway_merchant_id).to be_nil
      expect(profile.payway_api_key).to be_nil
    end

    it "masks the api key, revealing only the last 4 characters" do
      profile.update!(payway_merchant_id: "merchant_123", payway_api_key: "secret_abcdef1234")
      expect(profile.payway_api_key_masked).to eq("••••••••1234")
    end

    it "encrypts the api key at rest" do
      profile.update!(payway_merchant_id: "merchant_123", payway_api_key: "secret_abcdef1234")
      raw = ActiveRecord::Base.connection.select_value(
        "SELECT payway_api_key FROM profiles WHERE id = '#{profile.id}'"
      )
      expect(raw).not_to include("secret_abcdef1234")
    end
  end
end
