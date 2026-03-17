# PawPath Pro

> Multi-tenant SaaS platform for professional dog walkers.
> GPS walk reports, client portal, online payments, digital waivers — all in one place.

## What's Built (Phase 0 + Phase 1)

| | Feature |
|---|---|
| ✅ | Next.js 14 App Router scaffold with TypeScript + Tailwind + shadcn/ui |
| ✅ | Multi-tenant middleware — subdomain → tenant lookup → header injection |
| ✅ | Full Supabase schema (20 tables) with RLS enforcing tenant isolation |
| ✅ | Tenant signup flow (`/signup`) with subdomain availability check |
| ✅ | Stripe subscription creation (14-day trial) during signup |
| ✅ | Stripe products/prices setup script |
| ✅ | Stripe webhook handler (subscription lifecycle) |
| ✅ | Platform admin dashboard (`/admin`) — Geffrey-only, shows all tenants + MRR |
| ✅ | Walker login/logout (`/[tenant]/login`) with tenant-scoped auth |
| ✅ | Walker dashboard shell with sidebar nav |
| ✅ | Client portal shell with branded header |
| ✅ | `.env.example` with all required variables |
| ✅ | `vercel.json` with wildcard subdomain rewrite rules |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth + DB | Supabase (PostgreSQL + RLS) |
| Payments | Stripe Billing |
| Hosting | Vercel |

## Quick Start

### 1. Clone and install

```bash
git clone <repo>
cd pawpath-pro
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. In the SQL editor, run: `supabase/migrations/001_initial_schema.sql`
3. Copy your project URL, anon key, and service role key

### 3. Set up Stripe

PawPath Pro should use its own dedicated Stripe account. Do not reuse an unrelated single-product Stripe account such as `nextrebuy.com` for live platform operations.

Recommended setup model:
- Create a dedicated Stripe account for `PawPath Pro`
- Use that account as the platform account for walker subscriptions and platform-level Stripe Connect management
- Plan to onboard each dog walker to a connected Stripe account for client walk payments and payouts
- Keep client walk charges separate from the platform's own SaaS subscription billing

Suggested implementation order:
1. Start in Stripe test mode with the PawPath Pro platform account
2. Use the current platform account keys for walker SaaS subscription billing and client card-on-file development
3. Add Stripe Connect before broad launch so walkers are paid through connected accounts rather than a shared central account
4. Only move to live mode after test-mode signup, saved-card setup, and autopay collection are working end to end

Initial setup steps:
1. Create a dedicated Stripe account for PawPath Pro and get your test API keys
2. Run the Stripe setup script for the platform subscription products:
   ```bash
   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/setup-stripe.ts
   ```
3. Copy the printed price IDs into your `.env.local`
4. Create a webhook endpoint in the Stripe Dashboard pointing to `https://yourdomain.com/api/webhooks/stripe`
5. Leave walker connected-account onboarding and live client payment routing as a separate follow-on milestone; the repo is now prepared for card-on-file and autopay, but not yet for full Connect payout onboarding

### 4. Configure environment

```bash
cp .env.example .env.local
# Fill in all values in .env.local
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll see the marketing homepage.

**Local tenant testing:** Append `?tenant=<slug>` to any `localhost:3000/[tenant]/...` URL to bypass subdomain routing during development.

### 6. Deploy to Vercel

```bash
npx vercel --prod
```

Add all environment variables from `.env.local` to your Vercel project settings.

In Vercel's project settings → Domains, add a wildcard domain:
- `*.pawpathpro.com` → your Vercel deployment

## Demo Walkthrough

The repo includes a seeded walkthrough tenant at `/demo`.

Suggested demo flow:
- `https://your-deployment/demo` for the public tenant landing page
- `https://your-deployment/demo/portal/register` for the dog owner onboarding flow
- `https://your-deployment/demo/login` for the dog walker dashboard flow

The demo uses seeded data and role cookies so key pages remain explorable without provisioning real accounts.

## Vercel Deployment Checklist

### Required environment variables

Minimum required for the current app build:
- `NEXT_PUBLIC_APP_DOMAIN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`

Needed for full Stripe signup and webhook flows:
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_AGENCY`
- `STRIPE_WEBHOOK_SECRET`

Recommended before real client payment collection:
- Use a dedicated PawPath Pro Stripe account, not another product's account
- Keep all values in test mode until card-on-file setup and autopay are verified
- Plan for a future Stripe Connect rollout so each walker ultimately operates through a connected account

### Recommended project settings

- Framework preset: `Next.js`
- Install command: `npm install`
- Build command: `npx next build --webpack`
- Output directory: default Next.js output
- Node version: `20+`

### Domain notes

- For the seeded demo only, a standard Vercel preview or production URL is enough because the demo lives at `/demo`
- For real tenant subdomain routing later, add the wildcard root domain and keep `NEXT_PUBLIC_APP_DOMAIN` aligned with that domain

### Live smoke test after deploy

Verify these routes load successfully:
- `/demo`
- `/demo/login`
- `/demo/portal/register`
- `/demo/portal`
- `/demo/dashboard`

## Project Structure

```
app/
  page.tsx                    # Marketing homepage
  signup/                     # Tenant signup flow
  admin/                      # Platform admin (Geffrey-only)
  [tenant]/
    layout.tsx                # Tenant context injection
    login/                    # Walker login
    dashboard/                # Walker dashboard shell
    portal/                   # Client portal shell
      login/                  # Client login
      register/               # Client registration (Phase 3)
    billing-expired/          # Subscription expired page
  api/
    webhooks/stripe/          # Stripe webhook handler

lib/
  supabase/
    client.ts                 # Browser Supabase client
    server.ts                 # Server Supabase client (session + service)
  stripe.ts                   # Stripe client + plan metadata
  tenant.ts                   # Tenant lookup + slug utilities
  actions/
    auth.ts                   # Login / logout server actions
    signup.ts                 # Tenant signup server action
    admin.ts                  # Admin data fetching
  context/
    tenant-context.tsx        # React context for tenant data

components/
  walker/
    sidebar.tsx               # Walker dashboard sidebar nav
  portal/
    header.tsx                # Client portal branded header
  ui/                         # shadcn/ui components

supabase/
  migrations/
    001_initial_schema.sql    # Full schema + RLS policies

scripts/
  setup-stripe.ts             # One-time Stripe products/prices setup
```

## Architecture: Multi-Tenancy

Every request to `[slug].pawpathpro.com` passes through `middleware.ts`, which:
1. Extracts the subdomain from the `Host` header
2. Looks up the tenant in Supabase
3. Injects tenant context into request headers (`x-tenant-id`, `x-tenant-slug`, etc.)
4. Checks subscription validity (trial/active) and redirects expired tenants

The database has full Row-Level Security:
```sql
USING (tenant_id = auth.tenant_id())
-- where auth.tenant_id() reads from the JWT claim
```

This means even if application code forgets to filter by `tenant_id`, the database layer enforces isolation automatically.

## URL Structure

| URL | Destination |
|---|---|
| `pawpathpro.com` | Marketing site + `/signup` |
| `app.pawpathpro.com` | Platform admin |
| `[slug].pawpathpro.com/login` | Walker login |
| `[slug].pawpathpro.com/dashboard` | Walker dashboard |
| `[slug].pawpathpro.com/portal` | Client portal |

## Roadmap

- **Phase 2:** Public marketing website (home, services, about, contact, SEO)
- **Phase 3:** Full client portal (pet profiles, waiver signing, booking calendar, walk reports)
- **Phase 4:** Walker dashboard (schedule management, booking approval, client directory)
- **Phase 5:** Walk execution (GPS tracking, photo upload, walk reports)
- **Phase 6:** Billing & payments (auto-invoicing, Stripe payment collection)
- **Phase 7:** Messaging, earnings dashboard, CSV export, polish

---

Built with love for dog walkers who deserve to own their business. 🐾
