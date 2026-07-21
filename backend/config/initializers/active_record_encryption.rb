# Configures Active Record's built-in encryption, used for
# Profile#payway_api_key (an organizer's PayWay payment-gateway secret key —
# see app/models/profile.rb). Docs:
# https://guides.rubyonrails.org/active_record_encryption.html
#
# In production, generate real keys once with `bin/rails db:encryption:init`
# and set them as the three ACTIVE_RECORD_ENCRYPTION_* env vars below, so the
# keys don't change if secret_key_base is ever rotated independently.
#
# In development/test, when those env vars aren't set, we derive stable keys
# from secret_key_base so the app boots and encrypts/decrypts consistently
# without any extra local setup.
if ENV["ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY"].present?
  Rails.application.config.active_record.encryption.primary_key = ENV["ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY"]
  Rails.application.config.active_record.encryption.deterministic_key = ENV["ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY"]
  Rails.application.config.active_record.encryption.key_derivation_salt = ENV["ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT"]
else
  base = Rails.application.secret_key_base
  Rails.application.config.active_record.encryption.primary_key = Digest::SHA256.hexdigest("ar-encryption-primary-key-#{base}")
  Rails.application.config.active_record.encryption.deterministic_key = Digest::SHA256.hexdigest("ar-encryption-deterministic-key-#{base}")
  Rails.application.config.active_record.encryption.key_derivation_salt = Digest::SHA256.hexdigest("ar-encryption-key-derivation-salt-#{base}")
end
