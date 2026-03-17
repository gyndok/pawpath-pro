import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { ensureClientStripeCustomer } from '@/lib/payments'

/**
 * POST /api/stripe/pay-invoice
 *
 * Creates a Stripe Checkout Session in "payment" mode for a client to pay
 * a specific invoice. The client clicks "Pay Now" on their portal billing page,
 * gets redirected to Stripe Checkout, and comes back after payment.
 *
 * Body: { invoiceId: string, tenantSlug: string, clientProfileId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { invoiceId, tenantSlug, clientProfileId } = (await req.json()) as {
      invoiceId: string
      tenantSlug: string
      clientProfileId: string
    }

    if (!invoiceId || !tenantSlug || !clientProfileId) {
      return NextResponse.json(
        { error: 'invoiceId, tenantSlug, and clientProfileId are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Fetch the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, amount, status, tenant_id, client_id')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 })
    }

    if (invoice.status === 'voided') {
      return NextResponse.json({ error: 'Invoice has been voided' }, { status: 400 })
    }

    // Fetch client profile
    const { data: clientProfile, error: clientError } = await supabase
      .from('client_profiles')
      .select('id, user_id, full_name, stripe_customer_id')
      .eq('id', clientProfileId)
      .single()

    if (clientError || !clientProfile) {
      return NextResponse.json({ error: 'Client profile not found' }, { status: 404 })
    }

    // Verify the invoice belongs to this client
    if (invoice.client_id !== clientProfile.id) {
      return NextResponse.json({ error: 'Invoice does not belong to this client' }, { status: 403 })
    }

    // Get client email from auth
    const { data: authUser } = await supabase.auth.admin.getUserById(clientProfile.user_id)

    // Ensure Stripe customer exists
    const customerId = await ensureClientStripeCustomer({
      supabase,
      clientProfileId: clientProfile.id,
      existingStripeCustomerId: clientProfile.stripe_customer_id,
      email: authUser?.user?.email ?? null,
      fullName: clientProfile.full_name,
    })

    const stripe = getStripe()
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'pawpathpro.com'
    const baseUrl = `https://${appDomain}`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId || undefined,
      customer_email: !customerId ? (authUser?.user?.email || undefined) : undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice Payment`,
              description: `PawPath Pro invoice #${invoice.id.slice(0, 8)}`,
            },
            unit_amount: Math.round(Number(invoice.amount) * 100),
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          invoice_id: invoice.id,
          tenant_id: invoice.tenant_id,
          client_profile_id: clientProfile.id,
        },
      },
      success_url: `${baseUrl}/${tenantSlug}/portal/billing?payment=success&invoice_id=${invoice.id}`,
      cancel_url: `${baseUrl}/${tenantSlug}/portal/billing?payment=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Error creating payment session:', err)
    const message = err instanceof Error ? err.message : 'Failed to create payment session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
