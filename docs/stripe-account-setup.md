# Stripe Account Setup for PawPath Pro

This file is the explicit setup guide for the Stripe account PawPath Pro needs.

## What You Need

PawPath Pro has two different money flows:

1. `Walker -> PawPath Pro`
   - monthly SaaS subscription for using the software
   - paid to the PawPath Pro platform account

2. `Dog Owner -> Walker`
   - payment for completed walks
   - should ultimately flow through the walker's connected Stripe account

Because of that, PawPath Pro should use:

- one dedicated **PawPath Pro Stripe platform account**
- **Stripe Connect** for walker connected accounts

Do **not** use your unrelated `nextrebuy.com` Stripe account as the long-term live account for this product.

## Recommended Stripe Model

Use:

- a dedicated PawPath Pro platform Stripe account
- **Connect**
- **Express connected accounts** for walkers as the default starting point

Why Express:

- less operational burden than Custom
- more platform control than Standard
- Stripe hosts most payout/KYC onboarding

## Step 1: Create the Platform Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Create a new Stripe account specifically for `PawPath Pro`
3. Use business details for PawPath Pro, not for `nextrebuy.com`
4. Keep the account in **test mode** while you build

Use this account for:

- PawPath Pro subscription billing
- Stripe webhook handling
- Connect platform configuration
- early test-mode card-on-file/autopay development

## Step 2: Get the Keys You Need

In the new Stripe account:

1. Go to `Developers` -> `API keys`
2. Copy the **test** keys first:
   - publishable key
   - secret key
3. Go to `Developers` -> `Webhooks`
4. Create a webhook endpoint
5. Copy the webhook signing secret

PawPath Pro currently needs:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_AGENCY`

## Step 3: Create the SaaS Subscription Products

These are for `walker -> PawPath Pro` monthly software fees, not for dog-walk service charges.

Run:

```bash
STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/setup-stripe.ts
```

Then copy the printed price IDs into your env vars:

- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_AGENCY`

## Step 4: Add Stripe to Vercel

In the Vercel project, add these env vars:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_AGENCY`

Keep them as **test-mode** values until the full flow works.

## Step 5: Configure the Webhook

In Stripe Dashboard:

1. Go to `Developers` -> `Webhooks`
2. Add endpoint:
   - `https://pawpath-pro.vercel.app/api/webhooks/stripe`
3. Copy the signing secret into:
   - `STRIPE_WEBHOOK_SECRET`

The repo already has a Stripe webhook handler for tenant subscription lifecycle events.

## Step 6: Turn On Connect

For the `Dog Owner -> Walker` flow, PawPath Pro should use Stripe Connect.

In Stripe:

1. Go to `Connect`
2. Start Connect setup for the platform account
3. Choose **Express** connected accounts unless there is a strong reason to use Standard or Custom
4. Complete platform profile / branding setup for Connect onboarding

This is not just cosmetic. Stripe requires platform branding for hosted onboarding flows.

## Step 7: How to Think About Products vs Charges

You do **not** need a separate Stripe Product for every walker service.

For PawPath Pro:

- monthly software plans use recurring Stripe products/prices
- completed dog walks can be charged using `PaymentIntents` for the actual invoice amount
- saved cards should be collected with setup flows and charged off-session later

That means:

- subscription billing is product/price driven
- dog-walk billing is invoice/payment-intent driven

## Step 8: Safe Build Order

Use this order:

1. new PawPath Pro Stripe platform account
2. test keys in Vercel
3. SaaS subscription products created
4. webhook connected
5. test card-on-file setup from client billing page
6. test autopay after walk completion
7. only then start Connect onboarding for walkers
8. only then move toward live mode

## What Not to Do

Do not:

- run PawPath Pro live money through the `nextrebuy.com` account
- collect all dog-owner money in one central account and manually pay walkers later
- switch to live mode before test-mode saved-card and autopay flows work
- design the long-term platform around manual payout apps like Zelle or Cash App

## End-State Architecture

The intended end-state is:

- PawPath Pro platform account handles software subscriptions and Connect management
- each walker has a connected Stripe account
- dog owners pay for walks using saved cards
- completed walks trigger automatic collection
- Stripe pays walkers out through normal payout rails

## Useful Stripe Docs

- API keys: [https://docs.stripe.com/keys](https://docs.stripe.com/keys)
- Webhooks: [https://docs.stripe.com/webhooks](https://docs.stripe.com/webhooks)
- Connect Express accounts: [https://docs.stripe.com/connect/express-accounts](https://docs.stripe.com/connect/express-accounts)
- Connect Standard accounts: [https://docs.stripe.com/connect/standard-accounts](https://docs.stripe.com/connect/standard-accounts)
- Connect onboarding: [https://docs.stripe.com/connect/connect-onboarding](https://docs.stripe.com/connect/connect-onboarding)
- Save and reuse payment methods: [https://docs.stripe.com/payments/save-and-reuse](https://docs.stripe.com/payments/save-and-reuse)
- Checkout setup mode: [https://docs.stripe.com/payments/checkout/save-and-reuse](https://docs.stripe.com/payments/checkout/save-and-reuse)

## Repo Follow-Up

After the platform account is created, the next repo step is:

1. put the Stripe test env vars into Vercel
2. verify card-on-file setup from the client billing page
3. verify autopay after walk completion
4. then add walker connected-account onboarding
