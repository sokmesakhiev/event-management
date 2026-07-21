require "rails_helper"

RSpec.describe AbaPayway::Client, ".for_event" do
  around do |example|
    original = ENV.to_hash
    ENV["ABA_PAYWAY_MERCHANT_ID"] = "platform_merchant"
    ENV["ABA_PAYWAY_API_KEY"] = "platform_key"
    example.run
    ENV.replace(original)
  end

  it "uses the platform credentials when the organizer hasn't connected PayWay" do
    event = create(:event)

    client = described_class.for_event(event)

    expect(client.instance_variable_get(:@merchant_id)).to eq("platform_merchant")
    expect(client.instance_variable_get(:@api_key)).to eq("platform_key")
  end

  it "uses the organizer's own credentials once they've connected PayWay" do
    event = create(:event)
    event.creator.profile.update!(payway_merchant_id: "organizer_merchant", payway_api_key: "organizer_key")

    client = described_class.for_event(event)

    expect(client.instance_variable_get(:@merchant_id)).to eq("organizer_merchant")
    expect(client.instance_variable_get(:@api_key)).to eq("organizer_key")
  end
end
