import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {
    // ─── Subscription lifecycle (walker SaaS billing) ───────────────────
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const status = subscription.status

      const isActive = ['active', 'trialing', 'past_due'].includes(status)

      const priceId = subscription.items.data[0]?.price?.id
      let planTier = 'starter'
      if (priceId === process.env.STRIPE_PRICE_PRO) planTier = 'pro'
      else if (priceId === process.env.STRIPE_PRICE_AGENCY) planTier = 'agency'

      await supabase
        .from('tenants')
        .update({
          stripe_subscription_id: subscription.id,
          plan_tier: planTier,
          is_active: isActive,
        })
        .eq('stripe_customer_id', customerId)

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await supabase
        .from('tenants')
        .update({ is_active: false, stripe_subscription_id: null })
        .eq('stripe_customer_id', customerId)

      break
    }

    // ─── Subscription invoice events ────────────────────────────────────
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.customer) {
        await supabase
          .from('tenants')
          .update({ is_active: true })
          .eq('stripe_customer_id', invoice.customer as string)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      console.warn('Subscription payment failed for customer:', invoice.customer)
      // Tenant stays active until subscription fully cancels.
      // TODO: Send alert email via Resend when email integration is ready.
      break
    }

    // ─── Client walk-payment events (PaymentIntent from Checkout or autopay) ─
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      // Only handle payment-mode sessions (client invoice payments)
      if (session.mode !== 'payment') break

      const invoiceId = session.metadata?.invoice_id
        || (session.payment_intent &&
            typeof session.payment_intent === 'object'
              ? (session.payment_intent as Stripe.PaymentIntent).metadata?.invoice_id
              : null)

      if (!invoiceId) break

      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent as Stripe.PaymentIntent)?.id

      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntentId || null,
          notes: 'Paid via Stripe Checkout.',
        })
        .eq('id', invoiceId)

      break
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const invoiceId = paymentIntent.metadata?.invoice_id

      // Only process if this PI is linked to a PawPath invoice (autopay or checkout)
      if (!invoiceId) break

      // Check if already marked paid (checkout.session.completed may have fired first)
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('status')
        .eq('id', invoiceId)
        .single()

      if (existingInvoice?.status === 'paid') break

      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntent.id,
          notes: 'Paid via Stripe.',
        })
        .eq('id', invoiceId)

      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const invoiceId = paymentIntent.metadata?.invoice_id

      if (!invoiceId) break

      const failReason = paymentIntent.last_payment_error?.message || 'Payment failed'
      await supabase
        .from('invoices')
        .update({
          notes: `Payment failed: ${failReason}`,
        })
        .eq('id', invoiceId)

      console.warn(`Payment failed for invoice ${invoiceId}:`, failReason)
      break
    }
  }

  return NextResponse.json({ received: true })
}
