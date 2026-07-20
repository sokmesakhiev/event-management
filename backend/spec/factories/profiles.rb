FactoryBot.define do
  factory :profile do
    association :user
    display_name { Faker::Name.name }
    avatar_url { nil }
  end
end
