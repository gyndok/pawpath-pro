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

1. Create a Stripe account and get your API keys
2. Run the Stripe setup script:
   ```bash
   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/setup-stripe.ts
   ```
3. Copy the printed price IDs into your `.env.local`
4. Create a webhook endpoint in the Stripe Dashboard pointing to `https://yourdomain.com/api/webhooks/stripe`

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
