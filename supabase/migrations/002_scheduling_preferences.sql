CREATE TABLE IF NOT EXISTS tenant_booking_settings (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  travel_buffer_minutes INT NOT NULL DEFAULT 15 CHECK (travel_buffer_minutes >= 0 AND travel_buffer_minutes <= 180),
  slot_interval_minutes INT NOT NULL DEFAULT 15 CHECK (slot_interval_minutes >= 5 AND slot_interval_minutes <= 120),
  advance_window_days INT NOT NULL DEFAULT 30 CHECK (advance_window_days >= 1 AND advance_window_days <= 120),
  allow_same_day_booking BOOLEAN NOT NULL DEFAULT false,
  service_area_zip_codes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.touch_tenant_booking_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenant_booking_settings_touch_updated_at ON tenant_booking_settings;
CREATE TRIGGER tenant_booking_settings_touch_updated_at
BEFORE UPDATE ON tenant_booking_settings
FOR EACH ROW
EXECUTE FUNCTION public.touch_tenant_booking_settings_updated_at();

ALTER TABLE tenant_booking_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation on tenant_booking_settings" ON tenant_booking_settings;
CREATE POLICY "Tenant isolation on tenant_booking_settings"
  ON tenant_booking_settings FOR ALL
  USING (tenant_id = public.current_tenant_id());
