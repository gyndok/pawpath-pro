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
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const status = subscription.status

      // Map Stripe status to tenant active state
      const isActive = ['active', 'trialing', 'past_due'].includes(status)

      // Get price ID to determine plan tier
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

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      // Ensure tenant stays active after successful payment
      if (invoice.customer) {
        await supabase
          .from('tenants')
          .update({ is_active: true })
          .eq('stripe_customer_id', invoice.customer as string)
      }
      break
    }

    case 'invoice.payment_failed': {
      // Could send alert email; tenant stays active until subscription fully cancels
      console.warn('Payment failed for customer:', (event.data.object as Stripe.Invoice).customer)
      break
    }
  }

  return NextResponse.json({ received: true })
}
