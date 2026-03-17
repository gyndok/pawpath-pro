'use server'

import { redirect } from 'next/navigation'
import { getStripe } from '@/lib/stripe'
import { getAppBaseUrl, ensureClientStripeCustomer, isStripePaymentsReady } from '@/lib/payments'
import { requireTenantClient } from '@/lib/tenant-session'

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === 'on'
}

export async function beginPaymentMethodSetupAction(tenantSlug: string) {
  const { user, clientProfile, supabase } = await requireTenantClient(tenantSlug)

  if (!isStripePaymentsReady()) {
    redirect(`/${tenantSlug}/portal/billing?setup=unavailable`)
  }

  const customerId = await ensureClientStripeCustomer({
    supabase,
    clientProfileId: clientProfile.id,
    existingStripeCustomerId: (clientProfile as { stripe_customer_id?: string | null }).stripe_customer_id ?? null,
    email: user.email ?? null,
    fullName: clientProfile.full_name,
  })

  if (!customerId) {
    redirect(`/${tenantSlug}/portal/billing?setup=unavailable`)
  }

  const stripe = getStripe()
  const baseUrl = getAppBaseUrl()
  const session = await stripe.checkout.sessions.create({
    mode: 'setup',
    customer: customerId,
    payment_method_types: ['card'],
    success_url: `${baseUrl}/${tenantSlug}/portal/billing?setup=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/${tenantSlug}/portal/billing?setup=cancelled`,
  })

  if (!session.url) {
    redirect(`/${tenantSlug}/portal/billing?setup=error`)
  }

  redirect(session.url)
}

export async function updateAutopayAction(tenantSlug: string, formData: FormData) {
  const enabled = checkbox(formData, 'autopay_enabled')
  const { clientProfile, supabase } = await requireTenantClient(tenantSlug)

  await supabase
    .from('client_profiles')
    .update({ autopay_enabled: enabled })
    .eq('id', clientProfile.id)

  redirect(`/${tenantSlug}/portal/billing?autopay=${enabled ? 'enabled' : 'disabled'}`)
}
