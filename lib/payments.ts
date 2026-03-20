import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { APP_DOMAIN } from '@/lib/tenant'

export function isStripePaymentsReady() {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export function getAppBaseUrl() {
  const normalizedDomain = APP_DOMAIN.trim()

  if (normalizedDomain.startsWith('http://') || normalizedDomain.startsWith('https://')) {
    return normalizedDomain.replace(/\/+$/, '')
  }

  return `https://${normalizedDomain}`
}

export async function ensureClientStripeCustomer(params: {
  supabase: ReturnType<typeof import('@/lib/supabase/server').createServiceClient>
  clientProfileId: string
  existingStripeCustomerId: string | null
  email: string | null
  fullName: string
}) {
  if (params.existingStripeCustomerId) {
    return params.existingStripeCustomerId
  }

  if (!isStripePaymentsReady()) {
    return null
  }

  const stripe = getStripe()
  const customer = await stripe.customers.create({
    email: params.email || undefined,
    name: params.fullName,
    metadata: {
      client_profile_id: params.clientProfileId,
    },
  })

  const { error } = await params.supabase
    .from('client_profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', params.clientProfileId)

  if (error) {
    throw new Error(error.message)
  }

  return customer.id
}

function getCardSummary(paymentMethod: Stripe.PaymentMethod) {
  if (paymentMethod.type !== 'card' || !paymentMethod.card) {
    return {
      stripe_payment_method_id: paymentMethod.id,
      stripe_card_brand: null,
      stripe_card_last4: null,
      stripe_card_exp_month: null,
      stripe_card_exp_year: null,
    }
  }

  return {
    stripe_payment_method_id: paymentMethod.id,
    stripe_card_brand: paymentMethod.card.brand,
    stripe_card_last4: paymentMethod.card.last4,
    stripe_card_exp_month: paymentMethod.card.exp_month,
    stripe_card_exp_year: paymentMethod.card.exp_year,
  }
}

export async function syncCheckoutSetupSession(params: {
  supabase: ReturnType<typeof import('@/lib/supabase/server').createServiceClient>
  clientProfileId: string
  sessionId: string
}) {
  if (!isStripePaymentsReady()) {
    return { ok: false as const, reason: 'Stripe is not configured.' }
  }

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.retrieve(params.sessionId, {
    expand: ['setup_intent.payment_method'],
  })

  if (session.mode !== 'setup') {
    return { ok: false as const, reason: 'This checkout session is not a payment setup flow.' }
  }

  if (session.status !== 'complete') {
    return { ok: false as const, reason: 'Payment setup is not complete yet.' }
  }

  const setupIntent = session.setup_intent
  if (!setupIntent || typeof setupIntent === 'string') {
    return { ok: false as const, reason: 'No setup intent found for this session.' }
  }

  const paymentMethod = setupIntent.payment_method
  if (!paymentMethod || typeof paymentMethod === 'string') {
    return { ok: false as const, reason: 'No payment method was attached.' }
  }

  const summary = getCardSummary(paymentMethod)

  const { error } = await params.supabase
    .from('client_profiles')
    .update({
      ...summary,
      autopay_enabled: true,
    })
    .eq('id', params.clientProfileId)

  if (error) {
    throw new Error(error.message)
  }

  return { ok: true as const }
}

export async function attemptInvoiceAutopay(params: {
  supabase: ReturnType<typeof import('@/lib/supabase/server').createServiceClient>
  invoiceId: string
  amount: number
  tenantId: string
  clientProfile: {
    id: string
    stripe_customer_id: string | null
    stripe_payment_method_id: string | null
    autopay_enabled: boolean | null
  }
}) {
  if (!isStripePaymentsReady()) {
    return { status: 'unconfigured' as const }
  }

  if (!params.clientProfile.autopay_enabled) {
    return { status: 'disabled' as const }
  }

  if (!params.clientProfile.stripe_customer_id || !params.clientProfile.stripe_payment_method_id) {
    return { status: 'missing-payment-method' as const }
  }

  const stripe = getStripe()

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100),
      currency: 'usd',
      customer: params.clientProfile.stripe_customer_id,
      payment_method: params.clientProfile.stripe_payment_method_id,
      off_session: true,
      confirm: true,
      description: `PawPath Pro invoice ${params.invoiceId}`,
      metadata: {
        invoice_id: params.invoiceId,
        tenant_id: params.tenantId,
        client_profile_id: params.clientProfile.id,
      },
    })

    const successful = paymentIntent.status === 'succeeded'
    const { error } = await params.supabase
      .from('invoices')
      .update({
        status: successful ? 'paid' : 'sent',
        paid_at: successful ? new Date().toISOString() : null,
        stripe_payment_intent_id: paymentIntent.id,
        notes: successful
          ? 'Auto-collected using card on file.'
          : `Autopay attempted but Stripe returned status ${paymentIntent.status}.`,
      })
      .eq('id', params.invoiceId)

    if (error) {
      throw new Error(error.message)
    }

    return {
      status: successful ? ('paid' as const) : ('pending' as const),
      paymentIntentId: paymentIntent.id,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Autopay failed.'

    await params.supabase
      .from('invoices')
      .update({
        status: 'sent',
        notes: `Autopay failed: ${message}`,
      })
      .eq('id', params.invoiceId)

    return {
      status: 'failed' as const,
      error: message,
    }
  }
}
