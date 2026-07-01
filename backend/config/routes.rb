Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  # Active Storage routes (for serving uploaded files)
  direct :rails_blob do |blob, options|
    route_for(:rails_service_blob, blob.signed_id, blob.filename, options)
  end

  namespace :api do
    namespace :v1 do
      # Auth
      post "auth/signup", to: "auth#signup"
      post "auth/signin", to: "auth#signin"
      get  "auth/me",     to: "auth#me"

      # Events
      get    "events",       to: "events#index"
      get    "events/my",    to: "events#my_events"
      post   "events",       to: "events#create"
      get    "events/:id",   to: "events#show"
      patch  "events/:id",   to: "events#update"
      delete "events/:id",   to: "events#destroy"

      # Registrations
      get    "registrations",                  to: "registrations#index"
      post   "events/:event_id/registrations", to: "registrations#create"
      get    "events/:event_id/registrations", to: "registrations#event_registrations"
      patch  "registrations/:id",              to: "registrations#update"
      delete "registrations/:id",              to: "registrations#destroy"

      # Profile
      get   "profile", to: "profiles#show"
      patch "profile", to: "profiles#update"

      # File uploads
      post "uploads", to: "uploads#create"
    end
  end
end
