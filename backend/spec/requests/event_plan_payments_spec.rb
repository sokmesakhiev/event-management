require "rails_helper"

RSpec.describe "Event plan payments API", type: :request do
  let(:organizer) { create(:user) }

  let(:generate_qr_response) do
    {
      status: { code: "0", message: "Success", trace_id: "trace-1" },
      qrString: "00020101...",
      abapay_deeplink: "abamobilebank://ababank.com?type=payway&qrcode=..."
    }
  end

  describe "POST /api/v1/events/:event_id/plan_payments" do
    context "when the event's types add up to more than the chosen plan allows" do
      let!(:event) { create(:event, :draft, creator: organizer) }

      before do
        event.event_types.create!(name: "5K", capacity: 100, position: 0)
        event.event_types.create!(name: "10K", capacity: 150, position: 1)
      end

      it "rejects the small plan (200) without charging or creating a plan payment" do
        expect_any_instance_of(AbaPayway::Client).not_to receive(:generate_qr)

        post "/api/v1/events/#{event.id}/plan_payments",
             params: { plan: "small" },
             headers: auth_headers(organizer),
             as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json["code"]).to eq("plan_capacity_too_low")
        expect(json["error"]).to include("Small plan allows up to 200")
        expect(json["error"]).to include("250")
        expect(event.reload).not_to be_is_published
        expect(event.event_plan_payments).to be_empty
      end

      it "rejects even the free tier without publishing" do
        post "/api/v1/events/#{event.id}/plan_payments",
             params: { plan: "free" },
             headers: auth_headers(organizer),
             as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json["code"]).to eq("plan_capacity_too_low")
        expect(event.reload).not_to be_is_published
      end

      it "accepts a plan whose capacity covers the combined type limits" do
        allow_any_instance_of(AbaPayway::Client).to receive(:generate_qr).and_return(generate_qr_response)

        post "/api/v1/events/#{event.id}/plan_payments",
             params: { plan: "medium" },
             headers: auth_headers(organizer),
             as: :json

        expect(response).to have_http_status(:created)
        expect(json["plan_payment"]["status"]).to eq("pending")
      end

      it "rejects re-publishing under an already-paid plan that no longer fits" do
        # Simulates: organizer published under "small" (200) back when their
        # types fit, then unpublished and added more types that now total
        # 250. update_columns bypasses Event's own validation here since
        # we're seeding prior state, not performing the action under test.
        event.update_columns(plan: "small", capacity: 200)

        post "/api/v1/events/#{event.id}/plan_payments",
             params: { plan: "small" },
             headers: auth_headers(organizer),
             as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json["code"]).to eq("plan_capacity_too_low")
        expect(event.reload).not_to be_is_published
      end
    end

    context "when the event's types fit comfortably within the plan" do
      let!(:event) { create(:event, :draft, creator: organizer) }

      it "publishes the free tier immediately" do
        event.event_types.create!(name: "5K", capacity: 10, position: 0)

        post "/api/v1/events/#{event.id}/plan_payments",
             params: { plan: "free" },
             headers: auth_headers(organizer),
             as: :json

        expect(response).to have_http_status(:created)
        expect(event.reload).to be_is_published
      end
    end
  end
end
