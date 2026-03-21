ALTER TABLE pets
ADD COLUMN IF NOT EXISTS meet_and_greet_completed_at TIMESTAMPTZ;

ALTER TABLE services
ADD COLUMN IF NOT EXISTS service_kind TEXT NOT NULL DEFAULT 'standard';

ALTER TABLE services
DROP CONSTRAINT IF EXISTS services_service_kind_check;

ALTER TABLE services
ADD CONSTRAINT services_service_kind_check
CHECK (service_kind IN ('standard', 'meet_and_greet'));
