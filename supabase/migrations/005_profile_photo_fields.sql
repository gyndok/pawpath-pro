ALTER TABLE tenant_walkers
ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE client_profiles
ADD COLUMN IF NOT EXISTS photo_url TEXT;
