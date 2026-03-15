import Stripe from 'stripe'

let _stripe: Stripe | null = null

// Lazy Stripe client — defers initialization to runtime so build succeeds without STRIPE_SECRET_KEY
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    })
  }
  return _stripe
}

// Alias so callers can do: const stripe = getStripe()
export { getStripe as stripe }

// Subscription plan price IDs (populated by scripts/setup-stripe.ts)
export const STRIPE_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER!,
  pro:     process.env.STRIPE_PRICE_PRO!,
  agency:  process.env.STRIPE_PRICE_AGENCY!,
} as const

export type PlanTier = keyof typeof STRIPE_PRICES

export const PLAN_METADATA = {
  starter: { name: 'Starter', price: 2900, description: '1 walker, up to 30 clients, all core features' },
  pro:     { name: 'Pro',     price: 5900, description: '1 walker, unlimited clients, custom domain, CSV export' },
  agency:  { name: 'Agency',  price: 9900, description: 'Up to 5 walkers, all Pro features, multi-walker assignment' },
} as const
