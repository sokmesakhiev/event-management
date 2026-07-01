class ApplicationController < ActionController::API
  before_action :set_default_format

  private

  def set_default_format
    request.format = :json
  end

  def authenticate_user!
    token = extract_token
    unless token
      render json: { error: "Unauthorized" }, status: :unauthorized
      return
    end

    begin
      payload = JsonWebToken.decode(token)
      @current_user = User.find(payload[:user_id])
    rescue JWT::DecodeError, ActiveRecord::RecordNotFound
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end

  def extract_token
    header = request.headers["Authorization"]
    header&.split(" ")&.last
  end
end
