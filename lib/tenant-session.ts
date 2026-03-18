import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { createServerClient, createServiceClient } from '@/lib/supabase/server'

export async function requireTenantClient(tenantSlug: string) {
  noStore()
  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    redirect(`/${tenantSlug}/portal/login?error=session_not_found`)
  }

  const supabase = createServiceClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, slug, business_name, branding_primary_color, owner_user_id')
    .eq('slug', tenantSlug)
    .single()

  if (!tenant) {
    redirect(`/${tenantSlug}/portal/login?error=tenant_not_found`)
  }

  const { data: clientProfile } = await supabase
    .from('client_profiles')
    .select('id, full_name, phone, address, emergency_contact_name, emergency_contact_phone, photo_url, stripe_customer_id, stripe_payment_method_id, stripe_card_brand, stripe_card_last4, stripe_card_exp_month, stripe_card_exp_year, autopay_enabled')
    .eq('tenant_id', tenant.id)
    .eq('user_id', user.id)
    .single()

  if (!clientProfile) {
    redirect(`/${tenantSlug}/portal/login?error=${encodeURIComponent(`client_membership_not_found:${user.id}`)}`)
  }

  return { tenant, user, clientProfile, supabase }
}

export async function requireTenantWalker(tenantSlug: string) {
  noStore()
  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    redirect(`/${tenantSlug}/login?error=session_not_found`)
  }

  const supabase = createServiceClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, slug, business_name, branding_primary_color, plan_tier, owner_user_id, stripe_customer_id, stripe_subscription_id, trial_ends_at, is_active')
    .eq('slug', tenantSlug)
    .single()

  if (!tenant) {
    redirect(`/${tenantSlug}/login?error=tenant_not_found`)
  }

  const { data: walker } = await supabase
    .from('tenant_walkers')
    .select('id, role, photo_url')
    .eq('tenant_id', tenant.id)
    .eq('user_id', user.id)
    .single()

  if (!walker) {
    redirect(`/${tenantSlug}/login?error=${encodeURIComponent(`walker_membership_not_found:${user.id}`)}`)
  }

  return { tenant, user, walker, supabase }
}
