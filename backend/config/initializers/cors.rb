Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV.fetch("FRONTEND_URL", "http://localhost:3000"),
             "http://localhost:5173",
             "http://localhost:4173"

    resource "*",
      headers: :any,
      methods: [ :get, :post, :patch, :put, :delete, :options, :head ],
      expose: [ "Authorization" ]
  end
end
