module Api
  module V1
    class ProfilesController < ApplicationController
      before_action :authenticate_user!

      # GET /api/v1/profile
      def show
        render json: { profile: profile_json(current_user.profile) }
      end

      # PATCH /api/v1/profile
      def update
        profile = current_user.profile || current_user.create_profile!
        if profile.update(profile_params)
          render json: { profile: profile_json(profile) }
        else
          render json: { error: profile.errors.full_messages.join(", ") }, status: :unprocessable_entity
        end
      end

      private

      def profile_params
        params.require(:profile).permit(:display_name, :avatar_url)
      end

      def profile_json(profile)
        {
          id: profile&.id,
          user_id: current_user.id,
          display_name: profile&.display_name,
          avatar_url: profile&.avatar_url,
          created_at: profile&.created_at,
          updated_at: profile&.updated_at
        }
      end
    end
  end
end
