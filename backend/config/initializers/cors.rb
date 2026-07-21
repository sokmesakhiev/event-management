Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    if Rails.env.development?
      # The frontend's dev server port isn't fixed — @lovable.dev/vite-tanstack-config's
      # sandbox detection can pick something other than Vite's default 5173 (e.g. 8080).
      # Allow any localhost port locally rather than chasing specific numbers.
      origins(/\Ahttp:\/\/(localhost|127\.0\.0\.1):\d+\z/)
    else
      origins ENV.fetch("FRONTEND_URL", "http://localhost:3000"),
               "http://localhost:5173",
               "http://localhost:4173"
    end

    resource "*",
      headers: :any,
      methods: [ :get, :post, :patch, :put, :delete, :options, :head ],
      expose: [ "Authorization" ]
  end
end
