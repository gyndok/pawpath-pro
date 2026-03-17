import { NextRequest, NextResponse } from 'next/server'
import { getStripe, STRIPE_PRICES } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import type { PlanTier } from '@/types/tenant'

/**
 * POST /api/stripe/create-checkout
 *
 * Creates a Stripe Checkout Session for a walker to subscribe (or re-subscribe)
 * to a PawPath Pro plan. This is used when:
 *   - A walker's trial expires and they need to enter payment info
 *   - A walker wants to upgrade/change their plan
 *
 * Body: { tenantId: string, planTier?: PlanTier }
 */
export async function POST(req: NextRequest) {
  try {
    const { tenantId, planTier } = (await req.json()) as {
      tenantId: string
      planTier?: PlanTier
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, slug, stripe_customer_id, stripe_subscription_id, plan_tier, business_name, owner_user_id')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const selectedTier = planTier || (tenant.plan_tier as PlanTier) || 'starter'
    const priceId = STRIPE_PRICES[selectedTier]

    if (!priceId) {
      return NextResponse.json({ error: `No Stripe price configured for plan: ${selectedTier}` }, { status: 400 })
    }

    const stripe = getStripe()

    // Ensure the tenant has a Stripe customer
    let customerId = tenant.stripe_customer_id
    if (!customerId) {
      // Look up owner email
      const { data: ownerUser } = await supabase.auth.admin.getUserById(tenant.owner_user_id!)
      const customer = await stripe.customers.create({
        email: ownerUser?.user?.email || undefined,
        name: tenant.business_name,
        metadata: { tenant_id: tenant.id, slug: tenant.slug },
      })
      customerId = customer.id

      await supabase
        .from('tenants')
        .update({ stripe_customer_id: customerId })
        .eq('id', tenant.id)
    }

    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'pawpathpro.com'
    const baseUrl = `https://${appDomain}`

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: undefined, // No additional trial — they already had one
        metadata: { tenant_id: tenant.id },
      },
      success_url: `${baseUrl}/${tenant.slug}/settings?checkout=success`,
      cancel_url: `${baseUrl}/${tenant.slug}/settings?checkout=cancelled`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Error creating checkout session:', err)
    const message = err instanceof Error ? err.message : 'Failed to create checkout session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
