'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { isSlugAvailable, RESERVED_SLUGS } from '@/lib/tenant'
import type { PlanTier } from '@/types/tenant'

export type SignupState = {
  error?: string
  success?: boolean
  tenantSlug?: string
}

function validateSlug(slug: string): string | null {
  if (!slug) return 'Subdomain is required'
  if (slug.length < 3) return 'Subdomain must be at least 3 characters'
  if (slug.length > 30) return 'Subdomain must be 30 characters or fewer'
  if (!/^[a-z0-9-]+$/.test(slug)) return 'Subdomain may only contain lowercase letters, numbers, and hyphens'
  if (slug.startsWith('-') || slug.endsWith('-')) return 'Subdomain cannot start or end with a hyphen'
  if (RESERVED_SLUGS.has(slug)) return 'That subdomain is reserved. Please choose another.'
  return null
}

export async function signupAction(
  prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const email        = formData.get('email') as string
  const password     = formData.get('password') as string
  const businessName = formData.get('business_name') as string
  const rawSlug      = (formData.get('slug') as string)?.toLowerCase().trim()
  const plan         = (formData.get('plan') as PlanTier) || 'starter'

  // ── Validation ────────────────────────────────────────────────────────────
  if (!email || !password || !businessName || !rawSlug) {
    return { error: 'All fields are required.' }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const slugError = validateSlug(rawSlug)
  if (slugError) return { error: slugError }

  const available = await isSlugAvailable(rawSlug)
  if (!available) return { error: 'That subdomain is already taken. Please choose another.' }

  const supabase = createServiceClient()

  // ── Create Supabase auth user ─────────────────────────────────────────────
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
  })

  if (authError || !authData.user) {
    return { error: authError?.message || 'Failed to create account. Please try again.' }
  }

  const userId = authData.user.id

  try {
    // ── Create Stripe customer ─────────────────────────────────────────────
    const stripeClient = getStripe()
    const stripeCustomer = await stripeClient.customers.create({
      email,
      name: businessName,
      metadata: { user_id: userId, slug: rawSlug },
    })

    // ── Create Stripe subscription (trialing) ────────────────────────────
    const priceId = process.env[`STRIPE_PRICE_${plan.toUpperCase()}`]
    let stripeSubscriptionId: string | null = null

    if (priceId) {
      const subscription = await stripeClient.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{ price: priceId }],
        trial_period_days: 14,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      })
      stripeSubscriptionId = subscription.id
    }

    // ── Insert tenant row ─────────────────────────────────────────────────
    const { error: tenantError } = await supabase.from('tenants').insert({
      slug: rawSlug,
      business_name: businessName,
      owner_user_id: userId,
      plan_tier: plan,
      stripe_customer_id: stripeCustomer.id,
      stripe_subscription_id: stripeSubscriptionId,
    })

    if (tenantError) {
      throw new Error(tenantError.message)
    }

    // ── Get the new tenant id ─────────────────────────────────────────────
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', rawSlug)
      .single()

    if (!tenant) throw new Error('Tenant not found after creation')

    // ── Add owner to tenant_walkers ───────────────────────────────────────
    await supabase.from('tenant_walkers').insert({
      tenant_id: tenant.id,
      user_id: userId,
      role: 'owner',
    })

    // ── Create default waiver ──────────────────────────────────────────────
    await supabase.rpc('create_default_waiver', {
      p_tenant_id: tenant.id,
      p_walker_user_id: userId,
    })

    return { success: true, tenantSlug: rawSlug }
  } catch (err) {
    // Roll back auth user on failure
    await supabase.auth.admin.deleteUser(userId)
    const message = err instanceof Error ? err.message : 'Setup failed. Please try again.'
    return { error: message }
  }
}

export async function checkSlugAvailability(slug: string): Promise<{ available: boolean; error?: string }> {
  const normalized = slug.toLowerCase().trim()
  const slugError = validateSlug(normalized)
  if (slugError) return { available: false, error: slugError }
  const available = await isSlugAvailable(normalized)
  return { available }
}
