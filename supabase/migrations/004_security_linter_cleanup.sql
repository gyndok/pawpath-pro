CREATE OR REPLACE FUNCTION public.current_tenant_id() RETURNS UUID
  LANGUAGE sql STABLE
  SET search_path = pg_catalog
AS $$
  SELECT NULLIF(
    (current_setting('request.jwt.claims', true)::json->>'tenant_id'),
    ''
  )::UUID;
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin() RETURNS BOOLEAN
  LANGUAGE sql STABLE
  SET search_path = pg_catalog
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'is_platform_admin')::BOOLEAN,
    false
  );
$$;

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

CREATE OR REPLACE FUNCTION public.create_default_waiver(
  p_tenant_id UUID,
  p_walker_user_id UUID
) RETURNS VOID
  LANGUAGE plpgsql
  SECURITY DEFINER
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

DROP POLICY IF EXISTS "Public can submit inquiry leads" ON public.inquiry_leads;
