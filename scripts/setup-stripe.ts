/**
 * PawPath Pro — Stripe Products & Prices Setup Script
 *
 * Run once to create subscription products in Stripe.
 * After running, copy the price IDs into your .env.local file.
 *
 * Usage:
 *   npx tsx scripts/setup-stripe.ts
 *
 * Prerequisites:
 *   - STRIPE_SECRET_KEY must be set in your environment
 */

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
  typescript: true,
})

const PRODUCTS = [
  {
    key: 'starter',
    name: 'PawPath Pro — Starter',
    description: '1 walker, up to 30 clients, all core features. GPS walk tracking, walk reports, client portal, online payments, digital waivers.',
    price: 2900, // $29.00
    envVar: 'STRIPE_PRICE_STARTER',
  },
  {
    key: 'pro',
    name: 'PawPath Pro — Pro',
    description: '1 walker, unlimited clients, custom domain support, earnings CSV export, priority support.',
    price: 5900, // $59.00
    envVar: 'STRIPE_PRICE_PRO',
  },
  {
    key: 'agency',
    name: 'PawPath Pro — Agency',
    description: 'Up to 5 walkers, all Pro features, multi-walker assignment, team earnings reports, white-glove onboarding.',
    price: 9900, // $99.00
    envVar: 'STRIPE_PRICE_AGENCY',
  },
]

async function main() {
  console.log('Setting up Stripe products and prices for PawPath Pro...\n')

  const results: Record<string, string> = {}

  for (const product of PRODUCTS) {
    // Check if product already exists
    const existingProducts = await stripe.products.search({
      query: `name:'${product.name}'`,
    })

    let stripeProduct: Stripe.Product

    if (existingProducts.data.length > 0) {
      stripeProduct = existingProducts.data[0]
      console.log(`✓ Product already exists: ${product.name} (${stripeProduct.id})`)
    } else {
      stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
        metadata: { plan_tier: product.key },
      })
      console.log(`✓ Created product: ${product.name} (${stripeProduct.id})`)
    }

    // Check if price already exists
    const existingPrices = await stripe.prices.list({
      product: stripeProduct.id,
      active: true,
    })

    const existingPrice = existingPrices.data.find(
      (p) => p.unit_amount === product.price && p.recurring?.interval === 'month'
    )

    let stripePrice: Stripe.Price

    if (existingPrice) {
      stripePrice = existingPrice
      console.log(`  ↳ Price already exists: $${product.price / 100}/mo (${stripePrice.id})`)
    } else {
      stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: product.price,
        currency: 'usd',
        recurring: {
          interval: 'month',
          trial_period_days: 14,
        },
        metadata: { plan_tier: product.key },
      })
      console.log(`  ↳ Created price: $${product.price / 100}/mo (${stripePrice.id})`)
    }

    results[product.envVar] = stripePrice.id
  }

  console.log('\n✅ Setup complete! Add these to your .env.local:\n')
  for (const [key, value] of Object.entries(results)) {
    console.log(`${key}=${value}`)
  }

  // Also set up webhook endpoint reminder
  console.log('\n📌 Reminder: Set up a Stripe webhook endpoint pointing to:')
  console.log('   https://pawpathpro.com/api/webhooks/stripe')
  console.log('   Events to listen for:')
  console.log('   - customer.subscription.created')
  console.log('   - customer.subscription.updated')
  console.log('   - customer.subscription.deleted')
  console.log('   - invoice.payment_succeeded')
  console.log('   - invoice.payment_failed')
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
