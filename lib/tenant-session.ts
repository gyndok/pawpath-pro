import { redirect } from 'next/navigation'
import { createServerClient, createServiceClient } from '@/lib/supabase/server'

export async function requireTenantClient(tenantSlug: string) {
  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    redirect(`/${tenantSlug}/portal/login`)
  }

  const supabase = createServiceClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, slug, business_name, branding_primary_color, owner_user_id')
    .eq('slug', tenantSlug)
    .single()

  if (!tenant) {
    redirect(`/${tenantSlug}/portal/login`)
  }

  const { data: clientProfile } = await supabase
    .from('client_profiles')
    .select('id, full_name, phone, address, emergency_contact_name, emergency_contact_phone, stripe_customer_id, stripe_payment_method_id, stripe_card_brand, stripe_card_last4, stripe_card_exp_month, stripe_card_exp_year, autopay_enabled')
    .eq('tenant_id', tenant.id)
    .eq('user_id', user.id)
    .single()

  if (!clientProfile) {
    redirect(`/${tenantSlug}/portal/login`)
  }

  return { tenant, user, clientProfile, supabase }
}

export async function requireTenantWalker(tenantSlug: string) {
  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    redirect(`/${tenantSlug}/login`)
  }

  const supabase = createServiceClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, slug, business_name, branding_primary_color, plan_tier, owner_user_id')
    .eq('slug', tenantSlug)
    .single()

  if (!tenant) {
    redirect(`/${tenantSlug}/login`)
  }

  const { data: walker } = await supabase
    .from('tenant_walkers')
    .select('id, role')
    .eq('tenant_id', tenant.id)
    .eq('user_id', user.id)
    .single()

  if (!walker) {
    redirect(`/${tenantSlug}/login`)
  }

  return { tenant, user, walker, supabase }
}
