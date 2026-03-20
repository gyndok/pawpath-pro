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
    .select('id, slug, business_name, branding_primary_color, owner_user_id, time_zone')
    .eq('slug', tenantSlug)
    .single()

  if (!tenant) {
    redirect(`/${tenantSlug}/portal/login?error=${encodeURIComponent('tenant_not_found')}`)
  }

  const { data: clientProfile, error: clientProfileError } = await supabase
    .from('client_profiles')
    .select('id, full_name, phone, address, emergency_contact_name, emergency_contact_phone')
    .eq('tenant_id', tenant.id)
    .eq('user_id', user.id)
    .single()

  if (!clientProfile) {
    const reason = clientProfileError?.message
      ? `client_membership_not_found:${user.id}:${clientProfileError.message}`
      : `client_membership_not_found:${user.id}`
    redirect(`/${tenantSlug}/portal/login?error=${encodeURIComponent(reason)}`)
  }

  return {
    tenant,
    user,
    clientProfile: {
      ...clientProfile,
      photo_url: null,
      stripe_customer_id: null,
      stripe_payment_method_id: null,
      stripe_card_brand: null,
      stripe_card_last4: null,
      stripe_card_exp_month: null,
      stripe_card_exp_year: null,
      autopay_enabled: false,
    },
    supabase,
  }
}

export async function requireTenantWalker(tenantSlug: string) {
  noStore()
  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    redirect(`/${tenantSlug}/login?error=session_not_found`)
  }

  const supabase = createServiceClient()

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, slug, business_name, branding_primary_color, plan_tier, owner_user_id, time_zone, stripe_customer_id, stripe_subscription_id, trial_ends_at, is_active')
    .eq('slug', tenantSlug)
    .single()

  if (!tenant) {
    const reason = tenantError?.message ? `tenant_not_found:${tenantError.message}` : 'tenant_not_found'
    redirect(`/${tenantSlug}/login?error=${encodeURIComponent(reason)}`)
  }

  const { data: walker, error: walkerError } = await supabase
    .from('tenant_walkers')
    .select('id, role')
    .eq('tenant_id', tenant.id)
    .eq('user_id', user.id)
    .single()

  if (!walker) {
    const reason = walkerError?.message
      ? `walker_membership_not_found:${user.id}:${walkerError.message}`
      : `walker_membership_not_found:${user.id}`
    redirect(`/${tenantSlug}/login?error=${encodeURIComponent(reason)}`)
  }

  return {
    tenant,
    user,
    walker: {
      ...walker,
      photo_url: null,
    },
    supabase,
  }
}
