import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServerClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/stripe/customer-portal
 *
 * Creates a Stripe Billing Portal session so the walker (tenant owner)
 * can manage their subscription: update payment method, change plan,
 * view invoices, or cancel.
 *
 * Body: { tenantId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const authClient = await createServerClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { tenantId } = (await req.json()) as { tenantId: string }

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, slug, stripe_customer_id')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const { data: walker } = await supabase
      .from('tenant_walkers')
      .select('role')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!walker || walker.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only the account owner can manage subscription billing' },
        { status: 403 }
      )
    }

    if (!tenant.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please subscribe first.' },
        { status: 400 }
      )
    }

    const stripe = getStripe()
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'pawpathpro.com'

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: tenant.stripe_customer_id,
      return_url: `https://${appDomain}/${tenant.slug}/settings`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (err) {
    console.error('Error creating customer portal session:', err)
    const message = err instanceof Error ? err.message : 'Failed to open billing portal'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
