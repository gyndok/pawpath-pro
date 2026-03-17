ALTER TABLE client_profiles
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_card_brand TEXT,
  ADD COLUMN IF NOT EXISTS stripe_card_last4 TEXT,
  ADD COLUMN IF NOT EXISTS stripe_card_exp_month INT,
  ADD COLUMN IF NOT EXISTS stripe_card_exp_year INT,
  ADD COLUMN IF NOT EXISTS autopay_enabled BOOLEAN NOT NULL DEFAULT true;
