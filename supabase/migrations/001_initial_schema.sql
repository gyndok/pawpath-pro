-- =============================================================================
-- PawPath Pro - Initial Schema Migration
-- Multi-tenant SaaS architecture with full RLS enforcement
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PLATFORM-LEVEL TABLES (no tenant_id — these are the root tables)
-- =============================================================================

-- Tenants: each independent dog walking business
CREATE TABLE tenants (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug                    TEXT NOT NULL UNIQUE,
  business_name           TEXT NOT NULL,
  owner_user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan_tier               TEXT NOT NULL DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'pro', 'agency')),
  stripe_customer_id      TEXT UNIQUE,
  stripe_subscription_id  TEXT UNIQUE,
  custom_domain           TEXT UNIQUE,
  branding_primary_color  TEXT DEFAULT '#7c3aed',
  logo_url                TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_ends_at           TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  is_active               BOOLEAN NOT NULL DEFAULT true
);

-- Walkers associated with a tenant (owner + staff)
CREATE TABLE tenant_walkers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'staff')),
  photo_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

-- =============================================================================
-- TENANT-SCOPED TABLES (all have tenant_id)
-- =============================================================================

-- Client profiles (pet owners)
CREATE TABLE client_profiles (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name                TEXT NOT NULL,
  photo_url                TEXT,
  phone                    TEXT,
  address                  TEXT,
  emergency_contact_name   TEXT,
  emergency_contact_phone  TEXT,
  stripe_customer_id       TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

-- Pets
CREATE TABLE pets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  species       TEXT NOT NULL DEFAULT 'dog' CHECK (species IN ('dog', 'cat', 'other')),
  breed         TEXT,
  color         TEXT,
  dob           DATE,
  weight_lbs    DECIMAL(5,2),
  is_spayed_neutered BOOLEAN,
  vet_name      TEXT,
  vet_clinic    TEXT,
  vet_phone     TEXT,
  microchip     TEXT,
  medications   TEXT,
  allergies     TEXT,
  behavior_notes TEXT,
  special_notes TEXT,
  meet_and_greet_completed_at TIMESTAMPTZ,
  photo_url     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pet vaccine records
CREATE TABLE pet_vaccines (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  pet_id            UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  vaccine_type      TEXT NOT NULL,
  administered_date DATE,
  expiry_date       DATE,
  file_url          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Services offered by each tenant
CREATE TABLE services (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  service_kind     TEXT NOT NULL DEFAULT 'standard' CHECK (service_kind IN ('standard', 'meet_and_greet')),
  duration_minutes INT NOT NULL,
  base_price       DECIMAL(8,2) NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Walker availability (per day of week)
CREATE TABLE availability (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  walker_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (tenant_id, walker_id, day_of_week)
);

-- Blocked dates / vacation
CREATE TABLE blocked_dates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  walker_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookings (walk requests)
CREATE TABLE bookings (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id    UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  walker_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id   UUID NOT NULL REFERENCES services(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'completed', 'cancelled')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Booking ↔ Pet join table (multiple pets per booking)
CREATE TABLE booking_pets (
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  pet_id      UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  PRIMARY KEY (booking_id, pet_id)
);

-- Walks (active/completed walk sessions)
CREATE TABLE walks (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id     UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  started_at     TIMESTAMPTZ,
  ended_at       TIMESTAMPTZ,
  distance_km    DECIMAL(6,2),
  route_geojson  JSONB,
  status         TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Walk photos
CREATE TABLE walk_photos (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  walk_id    UUID NOT NULL REFERENCES walks(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  caption    TEXT,
  taken_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Walk reports
CREATE TABLE walk_reports (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  walk_id          UUID NOT NULL REFERENCES walks(id) ON DELETE CASCADE UNIQUE,
  potty_pee        BOOLEAN NOT NULL DEFAULT false,
  potty_pee_count  SMALLINT,
  potty_poo        BOOLEAN NOT NULL DEFAULT false,
  potty_poo_count  SMALLINT,
  mood             TEXT CHECK (mood IN ('happy', 'calm', 'anxious', 'excited', 'tired')),
  behavior_tags    TEXT[],
  behavior_notes   TEXT,
  health_notes     TEXT,
  walker_message   TEXT,
  water_provided   BOOLEAN,
  internal_rating  SMALLINT CHECK (internal_rating BETWEEN 1 AND 5),
  delivered_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Liability waivers (template, per tenant)
CREATE TABLE waivers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  walker_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version     SMALLINT NOT NULL DEFAULT 1,
  title       TEXT NOT NULL DEFAULT 'Service Agreement & Liability Waiver',
  body_text   TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Waiver signatures
CREATE TABLE waiver_signatures (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  waiver_id       UUID NOT NULL REFERENCES waivers(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  signed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address      INET,
  signature_name  TEXT NOT NULL,
  pdf_url         TEXT,
  UNIQUE (waiver_id, client_id)
);

-- Invoices
CREATE TABLE invoices (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id                UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  walk_id                  UUID REFERENCES walks(id) ON DELETE SET NULL,
  amount                   DECIMAL(8,2) NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'voided')),
  due_date                 DATE,
  paid_at                  TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoice line items
CREATE TABLE invoice_line_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity    DECIMAL(6,2) NOT NULL DEFAULT 1,
  unit_price  DECIMAL(8,2) NOT NULL,
  total       DECIMAL(8,2) NOT NULL
);

-- Messages (client ↔ walker threads)
CREATE TABLE messages (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sender_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body           TEXT NOT NULL,
  attachment_url TEXT,
  sent_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at        TIMESTAMPTZ
);

-- Notifications
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inquiry leads (from public contact form)
CREATE TABLE inquiry_leads (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  pet_info    TEXT,
  message     TEXT,
  contacted   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_tenant_walkers_tenant    ON tenant_walkers(tenant_id);
CREATE INDEX idx_tenant_walkers_user      ON tenant_walkers(user_id);
CREATE INDEX idx_client_profiles_tenant   ON client_profiles(tenant_id);
CREATE INDEX idx_client_profiles_user     ON client_profiles(user_id);
CREATE INDEX idx_pets_tenant              ON pets(tenant_id);
CREATE INDEX idx_pets_client              ON pets(client_id);
CREATE INDEX idx_bookings_tenant          ON bookings(tenant_id);
CREATE INDEX idx_bookings_client          ON bookings(client_id);
CREATE INDEX idx_bookings_walker          ON bookings(walker_id);
CREATE INDEX idx_bookings_status          ON bookings(status);
CREATE INDEX idx_bookings_scheduled       ON bookings(scheduled_at);
CREATE INDEX idx_walks_tenant             ON walks(tenant_id);
CREATE INDEX idx_walks_booking            ON walks(booking_id);
CREATE INDEX idx_invoices_tenant          ON invoices(tenant_id);
CREATE INDEX idx_invoices_client          ON invoices(client_id);
CREATE INDEX idx_invoices_status          ON invoices(status);
CREATE INDEX idx_messages_tenant          ON messages(tenant_id);
CREATE INDEX idx_messages_sender          ON messages(sender_id);
CREATE INDEX idx_messages_recipient       ON messages(recipient_id);
CREATE INDEX idx_notifications_user       ON notifications(user_id);
CREATE INDEX idx_notifications_unread     ON notifications(user_id) WHERE is_read = false;

-- =============================================================================
-- ROW-LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE client_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_vaccines       ENABLE ROW LEVEL SECURITY;
ALTER TABLE services           ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability       ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_pets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE walks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE walk_photos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE walk_reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE waivers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiver_signatures  ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_leads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_walkers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants            ENABLE ROW LEVEL SECURITY;

-- Helper function: get tenant_id from JWT claim
CREATE OR REPLACE FUNCTION public.current_tenant_id() RETURNS UUID
  LANGUAGE sql STABLE
  SET search_path = pg_catalog
AS $$
  SELECT NULLIF(
    (current_setting('request.jwt.claims', true)::json->>'tenant_id'),
    ''
  )::UUID;
$$;

-- Helper function: is platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin() RETURNS BOOLEAN
  LANGUAGE sql STABLE
  SET search_path = pg_catalog
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'is_platform_admin')::BOOLEAN,
    false
  );
$$;

-- Helper function: is walker for current tenant
CREATE OR REPLACE FUNCTION public.is_tenant_walker() RETURNS BOOLEAN
  LANGUAGE sql STABLE
  SET search_path = pg_catalog, public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_walkers
    WHERE tenant_id = public.current_tenant_id()
    AND user_id = auth.uid()
  );
$$;

-- ===== TENANTS TABLE POLICIES =====
CREATE POLICY "Platform admin can see all tenants"
  ON tenants FOR SELECT
  USING (public.is_platform_admin());

CREATE POLICY "Owner can see their own tenant"
  ON tenants FOR SELECT
  USING (owner_user_id = auth.uid());

CREATE POLICY "Platform admin can modify tenants"
  ON tenants FOR ALL
  USING (public.is_platform_admin());

-- ===== TENANT WALKERS POLICIES =====
CREATE POLICY "Walkers can view their own tenant_walkers"
  ON tenant_walkers FOR SELECT
  USING (tenant_id = public.current_tenant_id() AND user_id = auth.uid());

CREATE POLICY "Platform admin full access to tenant_walkers"
  ON tenant_walkers FOR ALL
  USING (public.is_platform_admin());

-- ===== CLIENT PROFILES POLICIES =====
CREATE POLICY "Tenant isolation on client_profiles"
  ON client_profiles FOR ALL
  USING (tenant_id = public.current_tenant_id());

-- ===== PETS POLICIES =====
CREATE POLICY "Tenant isolation on pets"
  ON pets FOR ALL
  USING (tenant_id = public.current_tenant_id());

-- ===== PET VACCINES POLICIES =====
CREATE POLICY "Tenant isolation on pet_vaccines"
  ON pet_vaccines FOR ALL
  USING (tenant_id = public.current_tenant_id());

-- ===== SERVICES POLICIES =====
CREATE POLICY "Tenant isolation on services"
  ON services FOR ALL
  USING (tenant_id = public.current_tenant_id());

-- ===== AVAILABILITY POLICIES =====
CREATE POLICY "Tenant isolation on availability"
  ON availability FOR ALL
  USING (tenant_id = public.current_tenant_id());

-- ===== BLOCKED DATES POLICIES =====
CREATE POLICY "Tenant isolation on blocked_dates"
  ON blocked_dates FOR ALL
  USING (tenant_id = public.current_tenant_id());

-- ===== BOOKINGS POLICIES =====
CREATE POLICY "Tenant isolation on bookings"
  ON bookings FOR ALL
  USING (tenant_id = public.current_tenant_id());

-- ===== BOOKING PETS POLICIES =====
CREATE POLICY "Tenant isolation on booking_pets"
  ON booking_pets FOR ALL
  USING (tenant_id = public.current_tenant_id());

-- ===== WALKS POLICIES =====
CREATE POLICY "Tenant isolation on walks"
  ON walks FOR ALL
  USING (tenant_id = public.current_tenant_id());

-- ===== WALK PHOTOS POLICIES =====
CREATE POLICY "Tenant isolation on walk_photos"
  ON walk_photos FOR ALL
  USING (tenant_id = public.current_tenant_id());

-- ===== WALK REPORTS POLICIES =====
CREATE POLICY "Tenant isolation on walk_reports"
  ON walk_reports FOR ALL
  USING (tenant_id = public.current_tenant_id());

-- ===== WAIVERS POLICIES =====
CREATE POLICY "Tenant isolation on waivers"
  ON waivers FOR ALL
  USING (tenant_id = public.current_tenant_id());

-- ===== WAIVER SIGNATURES POLICIES =====
CREATE POLICY "Tenant isolation on waiver_signatures"
  ON waiver_signatures FOR ALL
  USING (tenant_id = public.current_tenant_id());

-- ===== INVOICES POLICIES =====
CREATE POLICY "Tenant isolation on invoices"
  ON invoices FOR ALL
  USING (tenant_id = public.current_tenant_id());

-- ===== INVOICE LINE ITEMS POLICIES =====
CREATE POLICY "Tenant isolation on invoice_line_items"
  ON invoice_line_items FOR ALL
  USING (tenant_id = public.current_tenant_id());

-- ===== MESSAGES POLICIES =====
CREATE POLICY "Tenant isolation on messages"
  ON messages FOR ALL
  USING (tenant_id = public.current_tenant_id());

-- Clients can only see messages they're part of
CREATE POLICY "Clients see own messages"
  ON messages FOR SELECT
  USING (tenant_id = public.current_tenant_id() AND (sender_id = auth.uid() OR recipient_id = auth.uid()));

-- ===== NOTIFICATIONS POLICIES =====
CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT
  USING (tenant_id = public.current_tenant_id() AND user_id = auth.uid());

CREATE POLICY "Walkers can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_walker());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (tenant_id = public.current_tenant_id() AND user_id = auth.uid());

-- ===== INQUIRY LEADS POLICIES =====
-- Public can INSERT (contact form), walkers can read
CREATE POLICY "Walkers can read inquiry leads for their tenant"
  ON inquiry_leads FOR SELECT
  USING (tenant_id = public.current_tenant_id() AND public.is_tenant_walker());

CREATE POLICY "Walkers can update inquiry leads"
  ON inquiry_leads FOR UPDATE
  USING (tenant_id = public.current_tenant_id() AND public.is_tenant_walker());

-- =============================================================================
-- SEED: Default waiver template function (called on tenant creation)
-- =============================================================================
CREATE OR REPLACE FUNCTION create_default_waiver(
  p_tenant_id UUID,
  p_walker_user_id UUID
) RETURNS VOID
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  INSERT INTO public.waivers (tenant_id, walker_id, body_text)
  VALUES (
    p_tenant_id,
    p_walker_user_id,
    'By signing this agreement, I acknowledge that dog walking involves inherent risks, including but not limited to injury, illness, or death of my pet. I agree to hold the walker harmless from any claims, damages, or expenses arising from services rendered, except in cases of gross negligence or willful misconduct. I confirm that my pet''s vaccinations are current and that I have disclosed all known behavioral issues. I authorize emergency veterinary treatment if the walker deems it necessary, and I agree to be responsible for all related costs.'
  );
END;
$$;
