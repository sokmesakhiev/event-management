module Api
  module V1
    class EventsController < ApplicationController
      before_action :authenticate_user!, only: [ :create, :update, :destroy, :my_events ]
      before_action :set_event, only: [ :show, :update, :destroy ]
      before_action :authorize_creator!, only: [ :update, :destroy ]

      # GET /api/v1/events — public, published, upcoming
      def index
        events = Event.published.upcoming.order(start_at: :asc)
        render json: { events: events.map { |e| event_json(e) } }
      end

      # GET /api/v1/events/my — current user's created events
      def my_events
        events = current_user.events.includes(:registrations).order(start_at: :asc)
        render json: {
          events: events.map { |e|
            event_json(e).merge(registrations_count: e.registrations.size)
          }
        }
      end

      # GET /api/v1/events/:id
      def show
        render json: { event: event_json(@event, include_count: true) }
      end

      # POST /api/v1/events
      def create
        event = current_user.events.build(event_params)
        if event.save
          render json: { event: event_json(event) }, status: :created
        else
          render json: { error: event.errors.full_messages.join(", ") }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/events/:id
      def update
        if @event.update(event_params)
          render json: { event: event_json(@event) }
        else
          render json: { error: @event.errors.full_messages.join(", ") }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/events/:id
      def destroy
        @event.destroy!
        render json: { message: "Event deleted" }
      end

      private

      def set_event
        @event = Event.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Event not found" }, status: :not_found
      end

      def authorize_creator!
        unless @event.creator_id == current_user.id
          render json: { error: "Forbidden" }, status: :forbidden
        end
      end

      def event_params
        params.require(:event).permit(
          :title, :description, :category, :location,
          :start_at, :end_at, :capacity, :price_cents, :currency,
          :is_published, :brand_color, :banner_url, :logo_url
        )
      end

      def event_json(event, include_count: false)
        json = {
          id: event.id,
          creator_id: event.creator_id,
          title: event.title,
          description: event.description,
          category: event.category,
          location: event.location,
          start_at: event.start_at,
          end_at: event.end_at,
          capacity: event.capacity,
          price_cents: event.price_cents,
          currency: event.currency,
          is_published: event.is_published,
          brand_color: event.brand_color,
          banner_url: event.banner_url,
          logo_url: event.logo_url,
          created_at: event.created_at,
          updated_at: event.updated_at
        }
        json[:registrations_count] = event.registrations.count if include_count
        json
      end
    end
  end
end
