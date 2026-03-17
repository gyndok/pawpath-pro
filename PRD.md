**PAWPATH PRO**

Dog Walking Business Platform

**Product Requirements Document**

Version 2.0 • Confidential

  ---------------------------- ------------------------------------------
  **Document Owner**           Geffrey Klein

  **Product Name**             PawPath Pro

  **Version**                  2.0 (SaaS Architecture)

  **Status**                   Draft --- For Development

  **Target Platform**          Web (PWA, mobile-responsive)

  **Primary User**             Independent Dog Walker / Sole Proprietor
  ---------------------------- ------------------------------------------

**1. Executive Summary**

PawPath Pro is a full-stack web application purpose-built for an independent professional dog walker. It replaces the need for platforms like Wag or Rover---which charge listing fees and take commissions---with a private, branded platform the owner controls entirely. The system has two primary surfaces: a professional public-facing website that converts visitors into clients, and a private operational hub consisting of a Walker Dashboard and a Client Portal.

The platform enables a solo dog walker to operate a scalable, professional business from her phone or laptop---scheduling walks, collecting payments, sending walk reports with GPS maps and photos, managing waivers and client profiles, and communicating with clients---all in one place.

This PRD defines all features, user roles, data entities, technical architecture, and a phased development plan for building PawPath Pro using Claude Code.

**1.1 The Problem**

-   Third-party platforms (Wag, Rover) charge walkers fees to list and take 20--40% of revenue

-   Current employer situation: walker is underpaid and lacks independence

-   Clients have no professional portal to schedule, pay, or communicate

-   No digital trail for walk reports, incident notes, photos, or billing history

-   No signed liability waivers stored digitally

**1.2 The Solution**

-   Owned domain, branded experience, zero platform fees after build

-   Professional front-end website to attract and convert new clients

-   Platform-level landing page that can serve both dog walkers evaluating the software and dog owners looking for a walker

-   Client accounts: scheduling, billing, payments, communication, waivers

-   Walker dashboard: full business operations in one interface

-   Walk report system: GPS tracking, photo upload, notes, client delivery

-   Integrated billing and payment collection via Stripe

**1.3 Business Impact**

With PawPath Pro, the walker owns her customer relationships, keeps 100% of revenue (minus payment processing fees \~2.9%), presents a professional brand, and has the tools to grow from a one-person operation to a multi-walker agency over time.

---

## 1.4 SaaS Architecture Strategy

PawPath Pro is built from day one as a **multi-tenant SaaS platform**. The initial deployment serves a single tenant (the founder's daughter), but the architecture supports unlimited independent walker businesses on a single codebase.

### Core Principle: Tenant Isolation from Day One

Every database table includes a `tenant_id` foreign key. Every query filters by `tenant_id`. This is the single most important architectural decision — retrofitting multi-tenancy later is expensive. Building it in from the start costs almost nothing.

### Tenant Model

Each tenant is an independent dog walking business with:
- Their own branded subdomain (e.g., `sarahswalks.pawpathpro.com`)
- Optional custom domain support (e.g., `sarahswalks.com` → CNAME to Vercel)
- Their own walker accounts, clients, pets, walks, billing, and branding
- Complete data isolation — tenants cannot see each other's data
- A tenant-specific payment account model for client payment collection, finalized in later billing architecture work

### Tenant Onboarding Flow

1. Walker visits `pawpathpro.com` and clicks "Start Free Trial"
2. Creates account: name, email, business name, subdomain slug
3. Selects subscription plan
4. Stripe subscription created for the walker's monthly fee
5. Supabase tenant row created; subdomain provisioned
6. Walker completes onboarding wizard: services, pricing, availability, branding colors/logo
7. Shareable client portal link generated: `[slug].pawpathpro.com`

### Enrollment & Acquisition Model

PawPath Pro should support two distinct enrollment funnels:

- Walker enrollment: independent walkers sign up directly from the platform landing page or arrive through walker-to-walker referrals
- Dog owner enrollment: dog owners sign up either through the platform landing page, through a direct tenant-branded link from a walker, or through referral/discovery channels

Dog owner acquisition sources may include:

- Direct invite links from the walker
- QR codes on flyers, cards, doors, or pet materials
- Email links sent by the walker
- Referral from another dog owner
- Google ads, local SEO, and organic search
- Future marketplace or ZIP-code-based discovery flows

Product implication:

- The platform homepage should eventually route users cleanly into "I am a dog walker" versus "I am looking for a dog walker" journeys
- Tenant-branded public pages remain the primary conversion surface when the owner already knows the walker
- Referral source and attribution should be preserved whenever possible for both walker and owner acquisition

### Subscription Tiers

| Plan | Price | Features |
|------|-------|----------|
| **Starter** | $29/month | 1 walker, up to 30 clients, all core features |
| **Pro** | $59/month | 1 walker, unlimited clients, custom domain, earnings CSV export |
| **Agency** | $99/month | Up to 5 walkers, all Pro features, multi-walker assignment |

> Pricing rationale: A walker doing 3 walks/day at $25 earns ~$2,250/month. Rover takes 20-40% (~$450-$900). PawPath Pro costs $29-$59/month. Value proposition is overwhelming.

### Platform-Level Roles

| Role | Description |
|------|-------------|
| **Platform Admin** | Geffrey Klein — manages all tenants, billing, support |
| **Tenant Owner (Walker)** | Business owner — full control of their tenant |
| **Tenant Staff Walker** | Employee walker under a tenant (Agency tier) |
| **Client** | Pet owner — scoped entirely to their tenant |

### Multi-Tenant Database Schema Addition

All existing entities in Section 5 gain a `tenant_id UUID NOT NULL REFERENCES tenants(id)` column. Additional tables:

```
tenants
  id, slug, business_name, owner_user_id, plan_tier,
  stripe_customer_id, stripe_subscription_id,
  custom_domain, branding_primary_color, logo_url,
  created_at, trial_ends_at, is_active

tenant_walkers
  id, tenant_id, user_id, role (owner/staff), created_at
```

### Row-Level Security (Supabase RLS)

Every table policy enforces:
```sql
USING (tenant_id = auth.jwt() ->> 'tenant_id')
```

The `tenant_id` is embedded in the Supabase JWT at login. No application-level filtering required — the database enforces isolation automatically.

### Subdomain Routing (Next.js)

```
pawpathpro.com          → Marketing site + signup
app.pawpathpro.com      → Platform admin dashboard
[slug].pawpathpro.com   → Walker's branded client portal + dashboard
```

Next.js middleware reads the subdomain from the request host, looks up the tenant, and injects tenant context into every page render. Custom domains are handled via Vercel's programmatic domain API.

### Revenue Model

- Walker subscription fees (Stripe Billing, recurring monthly)
- Platform takes **0% of client payments** — walkers keep 100% (minus Stripe's 2.9%)
- This is the core value proposition vs. Rover/Wag

### Payment Account Model (Decision Required Before Scale)

PawPath Pro must make an explicit platform-level decision about how client payments are collected and disbursed.

The recommended direction is:

- Use Stripe Connect with each dog walker operating through a connected Stripe account
- Charge the client directly for completed walks or approved autopay events
- Avoid using one platform Stripe account to collect all client revenue and then manually paying walkers later
- Default walker payouts to a linked bank account on Stripe's normal payout schedule, with optional instant payout to an eligible debit card as a premium convenience feature

Why this is the preferred model:

- Clearer ownership of funds, disputes, refunds, and payout timing
- Lower operational and regulatory burden around holding and disbursing third-party funds
- Better long-term support for multiple tenants, custom pricing, and independent business ownership

Operational implication:

- Client-facing payment methods can include cards, ACH, and wallet flows such as Apple Pay / Google Pay where supported
- Walker payout methods should stay inside the processor's payout rails, primarily bank account payouts and optional instant debit-card payouts
- Zelle, Cash App, PayPal, Venmo, and Apple Cash may still be recorded as manual external payments, but they should not be the primary integrated payout architecture

If PawPath Pro ever acts as merchant of record and pays walkers out from a central Stripe account, the platform will also need:

- Internal ledgering and payout reconciliation
- Refund and chargeback allocation rules
- 1099 / tax reporting workflows
- Reserve and payout-hold policies
- Stronger legal and compliance review

### Launch Strategy

1. **Tenant Zero Alpha:** Launch with the founder's daughter as the first live tenant and prove the core workflow with real clients.
2. **Design-Partner Beta:** Onboard 5 local solo walkers free for 60--90 days in exchange for weekly feedback and bug reports.
3. **Soft Paid Launch:** Open paid self-serve signup only after the MVP handles real bookings, reports, and invoices without manual database intervention.
4. **Focused Acquisition:** Target independent walkers leaving Rover/Wag through direct outreach, referrals, and local social communities before buying broad paid traffic.

### Demo Environment Strategy

In parallel with the market-launch MVP, PawPath Pro should maintain a **demo environment** that can be deployed to Vercel and shared as a simple walkthrough link. This demo is a validation and feedback tool, not the production launch environment.

The demo environment exists to:

- Let the founder's daughter experience the product as both a walker and a client
- Demonstrate the landing page, client onboarding, client portal, and walker dashboard in one coherent flow
- Support feedback and confidence-building before real client rollout
- Provide a polished link that feels complete enough to explore independently

The demo environment should optimize for:

- One realistic tenant with strong branding
- Seeded sample data across both roles
- Happy-path navigation with minimal setup friction
- A stable Vercel deployment that is easy to share

The demo environment may use:

- Seeded pets, bookings, walk reports, invoices, and waiver records
- Demo login shortcuts or low-friction credentials
- Mocked or simplified delivery for non-critical integrations

The demo environment must not:

- Become a separate product fork
- Replace production-readiness requirements
- Hide critical gaps in auth correctness, billing integrity, or tenant isolation

### Market Entry Strategy

PawPath Pro should go to market as a **narrow, opinionated solo-walker operating system**, not as a feature-complete pet-care platform. The fastest route to revenue is to solve the end-to-end workflow for one independent dog walker business: get discovered, onboard a client, book a walk, complete the walk, send the report, and collect payment.

This means the initial launch prioritizes:

- A tenant-branded public page with inquiry capture
- Client onboarding, waiver completion, and pet profile collection
- Booking requests and walker approval workflow
- Walk completion with photos and client-facing report delivery
- Invoice creation and online payment collection

The initial launch explicitly does **not** require:

- Agency / multi-walker scheduling
- GPS route capture and playback
- In-app messaging
- Advanced analytics and CSV export
- SMS / push notifications
- Custom domains

### MVP Definition for Market Launch

The market-launch MVP is successful when one tenant can operate the business end-to-end without reverting to text messages, Venmo, or paper waivers.

### Demo Definition for Near-Term Validation

The near-term demo is successful when a dog walker can open one Vercel link, explore the platform from both sides, and quickly understand the product's value without requiring live setup support.

#### In Scope for Demo

- PawPath Pro marketing homepage
- One tenant-branded landing page
- Seeded client onboarding and waiver experience
- Seeded client portal with pets, scheduling, walk reports, and billing
- Seeded walker dashboard with schedule, approvals, reports, billing, and settings
- Demo-safe login entry points for walker and client roles
- Preloaded realistic data that keeps key pages out of empty states

#### Out of Scope for Demo

- Full production-grade signup and tenant provisioning
- Real payment collection
- Real email delivery
- Final insurance referral partnerships
- Production support tooling
- Complete edge-case coverage from the final PRD

#### In Scope for MVP

- Marketing site for PawPath Pro platform
- Tenant-branded public landing page
- Lead capture / inquiry form
- Walker signup and tenant provisioning
- Client registration and login
- Pet profiles
- Digital waiver acceptance
- Booking request flow
- Walker schedule / approval dashboard
- Walk completion form with photos and notes
- Walk report delivery
- Invoice generation and card payment
- Transactional email for booking, report, and billing events
- Insurance guidance and embedded insurance offer / referral flow for walkers

#### Out of Scope for MVP

- Native mobile apps
- Agency tier operations
- Stripe Connect marketplace-style revenue sharing
- Route GPS replay
- Rich messaging center
- Automation-heavy onboarding sequences

### Insurance & Liability Strategy

PawPath Pro should treat liability management as part of the core product, not as an afterthought. A dog walker becomes the temporary guardian of the pet during service and can face meaningful legal and financial exposure while the pet is in their care, custody, and control.

#### Risks the Product Must Acknowledge

- Third-party bodily injury claims, including bites, falls, and traffic-related incidents
- Third-party property damage claims
- Pet injury, escape, loss, or emergency veterinary expense while under walker supervision
- Breach-of-service claims, including missed visits and lost-key incidents
- Walker injury exposure and lost-income risk

#### Insurance Positioning

The platform should clearly explain during marketing and onboarding that standard homeowners and personal auto policies typically do not cover commercial pet-care work. PawPath Pro should offer access to specialized dog walker insurance through a marketplace, referral, or affiliate workflow.

The recommended product behavior is:

- Present insurance education before a walker goes live
- Offer access to specialist insurance options from onboarding and settings
- Let walkers store insurance status and proof-of-coverage details in the platform
- Make insurance completion part of the operational-readiness checklist

#### Coverage Types to Highlight

- General Liability
- Care, Custody, and Control (CCC)
- Animal Bailee coverage
- Lost Key Liability
- Professional Liability / Errors and Omissions

#### Insurance Providers to Evaluate

- Pet Care Insurance (PCI)
- The Hartford
- Thimble
- Next Insurance
- Business Insurers of the Carolinas

> Product note: Until PawPath Pro has formal referral or distribution agreements, these should be presented as educational or partner-evaluation options rather than as in-house insurance products.

#### Liability-Reduction Workflow Requirements

- Signed service agreement and liability waiver before the first booked walk
- Emergency veterinary authorization in onboarding documents
- Required disclosure of aggression, reactivity, medications, allergies, and bite history
- Pet information sheet with vet, emergency contact, and behavioral profile
- Meet-and-greet step in onboarding or first-booking workflow
- Documentation of leash rules, off-limit areas, and special handling instructions

#### Launch Gates

Before opening paid self-serve signup, PawPath Pro should meet all of the following:

- 5--10 real clients onboarded for Tenant Zero
- At least 20 completed walks processed through the product
- At least 5 invoices paid successfully through Stripe
- No known tenant-isolation or auth defects
- No required manual SQL edits for normal day-to-day operations
- Mobile usability validated on current iPhone Safari

---

**2. User Roles & Personas**

**2.1 Role Overview**

  ---------------------------------------------------------------------------------------------------------------------------------------------------------
  **Role**                   **Access Level**          **Description**
  -------------------------- ------------------------- ----------------------------------------------------------------------------------------------------
  **Super Admin / Walker**   Full access               The dog walker / business owner. Manages all operations, schedule, billing, reports, and settings.

  **Client**                 Limited personal access   Pet owner who books and pays for services. Sees only their own data.

  **Visitor (Public)**       Unauthenticated           Prospective client browsing the public site. Can view services and submit an inquiry form.
  ---------------------------------------------------------------------------------------------------------------------------------------------------------

**2.2 Persona: The Walker**

Name: Independent Walker \| Goal: Run a professional solo business, keep all revenue, grow clientele without Wag/Rover

-   Needs a mobile-friendly dashboard she can use from her phone during walks

-   Wants to look more professional than handwritten notes and Venmo payments

-   Needs to generate walk reports clients love, building loyalty and referrals

-   Wants billing and payment handled automatically, not chased manually

**2.3 Persona: The Client**

Name: Pet Owner \| Goal: Easy booking, trust that their dog is safe, cute updates during/after walks

-   Wants to create an account once and not repeat info every time

-   Wants to schedule a walk online without texting back and forth

-   Wants walk reports with photos and a map delivered automatically

-   Wants to pay easily and see billing history in one place

**3. Feature Overview & Prioritization**

Features are prioritized using a P0--P3 scale:

-   P0 --- Launch blocker. App cannot go live without this.

-   P1 --- Core value. Must ship in Phase 1 or 2.

-   P2 --- Important enhancement. Phase 3--4.

-   P3 --- Future / nice to have. Post-launch backlog.

**3.1 Public Website Features**

  --------------------------------------------------------------------------------------------------------------------------------
  **Feature**                   **Description**                                                                     **Priority**
  ----------------------------- ----------------------------------------------------------------------------------- --------------
  **Hero / Landing Page**       Branded landing with tagline, CTA to book/inquire, professional photography         **P0**

  **Services & Pricing Page**   Cards for each service type with pricing, duration, and description                 **P0**

  **About Page**                Walker bio, certifications, philosophy, pet first aid training, photos              **P0**

  **Service Area Map**          Google Maps embed showing coverage area (Houston neighborhoods)                     **P0**

  **Contact / Inquiry Form**    Lead capture form --- name, email, pet details, message; delivers to walker inbox   **P0**

  **Client Account CTA**        Prominent \'Sign In / Create Account\' button linking to client portal              **P0**

  **Testimonials Section**      Rotating or grid-style client reviews                                               **P1**

  **FAQ Page**                  Answers to common questions (cancellation, insurance, multiple dogs, etc.)          **P1**

  **Blog / Tips Section**       Optional SEO content about dog care, Houston pet resources                          **P3**

  **SEO & Metadata**            Title tags, Open Graph, sitemap.xml, robots.txt for Google discoverability          **P1**
  --------------------------------------------------------------------------------------------------------------------------------

**3.2 Client Portal Features**

  ----------------------------------------------------------------------------------------------------------------------------------------
  **Feature**                    **Description**                                                                            **Priority**
  ------------------------------ ------------------------------------------------------------------------------------------ --------------
  **Account Registration**       Email/password signup with email verification                                              **P0**

  **Profile Management**         Client contact info, emergency contact, address, payment method on file                    **P0**

  **Pet Profiles**               Add multiple pets: name, breed, age, weight, vet info, vaccine records, special notes      **P0**

  **Digital Waiver**             Liability waiver displayed and signed electronically at onboarding; stored on account      **P0**

  **Pet Information Sheet**      Intake for vet, emergency, meds, allergies, triggers, leash behavior, and handling notes  **P0**

  **Walk Scheduling**            Calendar view to request upcoming walks with date, time, service type, and pet selection   **P0**

  **Walk History**               List of all past walks with date, service, duration, walker notes                          **P0**

  **Walk Report Viewer**         Full walk report: photos, route map, notes, health check, rating                           **P0**

  **Invoice View**               Itemized list of charges per walk with status (paid / pending)                             **P0**

  **Online Payment**             Pay outstanding invoices via Stripe (card); show payment history                           **P0**

  **Messaging / Chat**           In-app messaging thread with walker; notifications by email or SMS                         **P1**

  **Notification Preferences**   Toggle email, SMS, push notifications for reports, invoices, schedule updates              **P1**

  **Booking Cancellation**       Client can cancel or reschedule with configurable notice window                            **P1**

  **Photo Gallery**              Personal gallery of all photos taken of their pets across all walks                        **P2**

  **Referral Feature**           Generate referral link; walker may offer discount for referrals                            **P3**
  ----------------------------------------------------------------------------------------------------------------------------------------

**3.3 Walker Dashboard Features**

  --------------------------------------------------------------------------------------------------------------------------------------
  **Feature**                      **Description**                                                                        **Priority**
  -------------------------------- -------------------------------------------------------------------------------------- --------------
  **Dashboard Home**               Day-at-a-glance: today\'s walks, upcoming schedule, unread messages, unpaid invoices   **P0**

  **Schedule / Calendar View**     Week/month calendar of all booked walks; color-coded by status                         **P0**

  **Walk Request Management**      Review, approve, or decline incoming booking requests from clients                     **P0**

  **Walk Execution Mode**          Mobile-optimized \'active walk\' screen: start timer, GPS tracking, photo capture      **P0**

  **Walk Report Builder**          Post-walk form: notes, health check, potty report, mood/behavior, photo upload         **P0**

  **Report Delivery**              One-tap delivery of completed walk report to client via portal + email notification    **P0**

  **Client Management**            Directory of all clients with contact info, pets, notes, booking history               **P0**

  **Invoice Generation**           Auto-generate invoice from completed walk; manual adjustments supported                **P0**

  **Payment Tracking**             View all invoices: paid, pending, overdue; send payment reminders                      **P0**

  **Messaging Center**             Unified inbox for all client conversations; quick reply templates                      **P1**

  **Service & Pricing Config**     Set service types, prices, duration, add-ons (e.g., extra dog, holiday surcharge)      **P1**

  **Availability Settings**        Set working days/hours; mark dates as unavailable; vacation blocking                   **P1**

  **Waiver Management**            View which clients have signed; resend unsigned waiver requests                        **P1**

  **Insurance & Compliance**       Track insurance status, policy details, COI uploads, and renewal reminders            **P1**

  **Earnings Dashboard**           Revenue totals by day/week/month; charts; export to CSV for taxes                      **P2**

  **GPS Route History**            View map replay of any completed walk route                                            **P2**

  **Recurring Walk Setup**         Set up auto-recurring weekly walks for a client without repeated scheduling            **P2**

  **Multi-Walker Mode**            Add employee walkers under the account; assign walks; track earnings per walker        **P3**

  **Client Onboarding Workflow**   Automated email sequence guiding new clients through profile/waiver/first booking      **P2**
  --------------------------------------------------------------------------------------------------------------------------------------

**4. Detailed Feature Specifications**

**4.1 Active Walk Execution Module**

This is the crown jewel feature that separates PawPath Pro from a simple booking site. When a walk begins, the walker enters \'Walk Mode\' on her phone.

**4.1.1 Walk Mode Flow**

1.  Walker taps \'Start Walk\' from the dashboard or schedule for the booked appointment

2.  GPS tracking begins silently in background (browser geolocation API)

3.  Timer starts and displays elapsed time

4.  Walker can take photos directly from the walk screen (camera access)

5.  Walker can leave quick voice-to-text or typed notes mid-walk

6.  Walker taps \'End Walk\' --- GPS tracking stops, route is saved

7.  Walk Report form auto-populates with walk duration, distance, route map

8.  Walker completes the report fields and taps \'Send to Client\'

9.  Client receives push notification and email: \'Your walk report is ready!\'

**4.1.2 Walk Report Contents**

-   Date, time, duration, distance

-   GPS route displayed on interactive map (Leaflet.js or Google Maps)

-   Photos taken during walk (gallery with captions)

-   Potty report (pee ✔, poo ✔ with optional count)

-   Behavior & mood notes (from dropdown + free text)

-   Health observations (any concerning notes)

-   Walker\'s personal note to the client (warm, personalized message)

-   Star rating the walker assigns to the walk (for internal record)

**4.2 Digital Waiver System**

Liability waivers are legally important for a dog walking business. PawPath Pro handles this digitally.

**4.2.1 Waiver Flow**

10. Client creates an account and is immediately prompted to sign the service waiver

11. Waiver text is configurable by the walker from Settings

12. Client reads the full waiver text in a scrollable modal

13. Client types their full name as electronic signature and checks an acknowledgment box

14. Timestamp, IP address, and user ID are recorded and stored with the signature

15. Client receives PDF copy via email; walker can download signed copies

16. Walker dashboard flags any client who has not completed their waiver

Note: Consult a Texas attorney to ensure waiver language is enforceable. PawPath Pro provides the infrastructure; legal language is the walker\'s responsibility.

**4.3 Billing & Payment System**

**4.3.1 Invoice Generation**

-   Invoices auto-generate when a walk is marked \'Completed\' by the walker

-   Default price pulls from the service type selected at booking

-   Walker can apply discounts, add line items (extra dog, holiday rate), or waive fees

-   Invoices show: client name, pet(s), service, date, unit price, total, due date

-   Invoice status states: Draft, Sent, Viewed, Paid, Overdue, Voided

**4.3.2 Payment Collection**

-   Stripe integration for card-on-file (saved during account setup) or one-time payment

-   Clients can pay via the portal invoice page with one tap

-   Walker receives funds in Stripe dashboard (deposited to bank in 2 business days)

-   Automatic payment reminder emails at: due date, 3 days overdue, 7 days overdue

-   Walker can record cash/Venmo payments manually to mark invoice as paid

**4.4 Messaging System**

-   Threaded conversation per client-walker pair

-   Rich text messages with photo attachment support

-   Email notification for new messages with \'Reply in App\' CTA

-   Walker can create Quick Reply Templates (e.g., \'On my way!\', \'Walk complete!\')

-   Unread message count badge on walker dashboard nav

-   Optional SMS notifications via Twilio integration (Phase 2)

**4.5 Pet Profiles**

**4.5.1 Required Fields**

-   Pet name, species (dog/cat), breed, color/markings

-   Date of birth / age

-   Weight

-   Spayed/neutered status

-   Veterinarian name, clinic name, phone number

-   Vaccination records (rabies, Bordetella) --- file upload or date entry

-   Emergency contact (separate from account owner if needed)

**4.5.2 Optional / Enhanced Fields**

-   Known allergies or dietary restrictions

-   Behavioral notes (leash reactivity, fear triggers, commands known)

-   Medical conditions or medications

-   Favorite treats, toys, or rewards

-   \'Do Not Enter\' gates or lock codes for home access

-   Microchip number

**4.6 Schedule & Booking System**

**4.6.1 Booking Request Flow (Client)**

17. Client selects service type (e.g., 30-min walk, 60-min walk, drop-in)

18. Client picks pet(s) for the walk

19. Client selects desired date from availability calendar

20. Client selects preferred time from available slots

21. Client adds any special notes

22. Client submits request --- status: \'Pending Approval\'

23. Walker receives notification; reviews and approves or declines with note

24. Client receives confirmation notification; walk appears on both calendars

**4.6.2 Walker Availability Engine**

-   Walker sets default working hours per day of week

-   Walker sets walk duration and buffer time between walks

-   Walker can block individual dates or date ranges (vacation, personal)

-   System enforces maximum concurrent walks = 1 (solo walker mode)

-   Calendar shows availability in client timezone (or always Houston local time)

**5. Data Model**

The following entities form the core relational data model for PawPath Pro. Recommended database: PostgreSQL via Supabase (provides auth, realtime, storage, and REST API out of the box).

> **SaaS Note:** Every table below includes `tenant_id UUID NOT NULL REFERENCES tenants(id)`. Supabase Row-Level Security policies enforce tenant isolation at the database layer — no application code can accidentally leak cross-tenant data. The `tenants` and `tenant_walkers` tables are defined in Section 1.4.

**5.1 Core Entities**

  ---------------------------------------------------------------------------------------------------------------------------------------------------------
  **Feature**              **Description**                                                                                                   **Priority**
  ------------------------ ----------------------------------------------------------------------------------------------------------------- --------------
  **users**                Auth table: id, email, password_hash, role (walker/client), created_at, verified                                  **---**

  **client_profiles**      id, user_id, full_name, phone, address, emergency_contact_name, emergency_contact_phone                           **---**

  **pets**                 id, client_id, name, breed, species, dob, weight, vet_name, vet_phone, notes, photo_url, microchip, medications   **---**

  **pet_vaccines**         id, pet_id, vaccine_type, administered_date, expiry_date, file_url                                                **---**

  **services**             id, name, description, duration_minutes, base_price, is_active                                                    **---**

  **availability**         id, walker_id, day_of_week, start_time, end_time, is_active                                                       **---**

  **blocked_dates**        id, walker_id, start_date, end_date, reason                                                                       **---**

  **bookings**             id, client_id, walker_id, service_id, scheduled_at, status, notes, created_at                                     **---**

  **walks**                id, booking_id, started_at, ended_at, distance_km, route_geojson, status                                          **---**

  **walk_photos**          id, walk_id, url, caption, taken_at                                                                               **---**

  **walk_reports**         id, walk_id, potty_pee, potty_poo, mood, behavior_notes, health_notes, walker_message, delivered_at               **---**

  **waivers**              id, walker_id, version, title, body_text, is_active, created_at                                                   **---**

  **waiver_signatures**    id, waiver_id, client_id, signed_at, ip_address, signature_name, pdf_url                                          **---**

  **invoices**             id, client_id, walk_id, amount, status, due_date, paid_at, stripe_payment_intent_id                               **---**

  **invoice_line_items**   id, invoice_id, description, quantity, unit_price, total                                                          **---**

  **messages**             id, sender_id, recipient_id, body, attachment_url, sent_at, read_at                                               **---**

  **notifications**        id, user_id, type, title, body, is_read, created_at                                                               **---**

  **inquiry_leads**        id, name, email, phone, pet_info, message, created_at, contacted                                                  **---**
  ---------------------------------------------------------------------------------------------------------------------------------------------------------

**6. Recommended Technology Stack**

This stack is selected for rapid development, low infrastructure overhead, excellent Claude Code compatibility, and strong free-tier options.

  -------------------------------------------------------------------------------------------------------------------------------------------------------
  **Layer**            **Technology**               **Rationale**
  -------------------- ---------------------------- -----------------------------------------------------------------------------------------------------
  **Frontend**         Next.js 14 (App Router)      React-based full-stack framework; SSR for SEO; single codebase for public site + portal + dashboard

  **Styling**          Tailwind CSS                 Utility-first CSS; fast to prototype; responsive by default; pairs well with shadcn/ui components

  **UI Components**    shadcn/ui                    Accessible, beautiful pre-built components; no runtime CSS-in-JS overhead

  **Auth**             Supabase Auth                Built-in email/password + magic link + session management; free tier generous

  **Database**         Supabase (PostgreSQL)        Managed Postgres with row-level security; realtime subscriptions; REST API auto-generated

  **File Storage**     Supabase Storage             S3-compatible; store photos, waiver PDFs, vaccine records; free tier 1GB

  **Payments**         Stripe                       Industry standard; card-on-file via Stripe Customer object; webhooks for payment events

  **Maps / GPS**       Leaflet.js + OpenStreetMap   Free tile provider; route display; no API key billing surprises

  **SMS (Phase 2)**    Twilio                       SMS walk notifications and alerts; pay-per-message

  **Email**            Resend                       Transactional email (reports, invoices, confirmations); generous free tier; React Email templates

  **PDF Generation**   React-PDF or Puppeteer       Generate waiver PDFs and invoice PDFs client-side or server-side

  **Hosting**          Vercel                       Zero-config Next.js deployment; free tier for solo projects; custom domain support

  **Domain**           Custom (e.g., Namecheap)     Professional branded domain; Vercel handles SSL automatically

  **Analytics**        Vercel Analytics             Privacy-friendly page views and performance monitoring; built into Vercel platform
  -------------------------------------------------------------------------------------------------------------------------------------------------------

**7. Development Phases & Timeline**

Estimated timeline assumes Claude Code as the primary development tool with you as the technical lead. This sequence is optimized for **time-to-market**, not for shipping every feature in the full PRD before launch.

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Phase**     **Name**                        **Duration**   **Key Deliverables**
  ------------- ------------------------------- -------------- ------------------------------------------------------------------------------------------------------------------------------------------------
  **Phase 0**   Foundation Hardening            1--2 weeks     Fix tenant auth and RLS alignment, correct subscription gating, clean broken routes, add CI checks, validate local/dev/prod environment setup

  **Phase 0.5** Demo Hardening                  1 week         Demo tenant branding, seeded sample data, demo login flow, happy-path polish across client and walker surfaces, stable Vercel deployment for stakeholder walkthrough

  **Phase 1**   Tenant Public Site              1--2 weeks     Tenant-branded homepage, services/pricing sections, inquiry form, mobile-responsive layout, initial SEO metadata, lead capture storage

  **Phase 2**   Client Onboarding & Booking     2--3 weeks     Client registration/login, pet profiles, waiver signing, booking request flow, walker approval/decline workflow, basic email notifications

  **Phase 3**   Walker Operations MVP           2--3 weeks     Real dashboard data for today's walks, upcoming bookings, pending approvals, service configuration, availability management, client directory basics

  **Phase 4**   Walk Reports + Billing MVP      2--3 weeks     Walk completion form, photo upload, client-facing report viewer, invoice creation from completed walks, Stripe payment collection, payment status updates

  **Phase 5**   Tenant Zero Launch              1--2 weeks     Production deployment for founder's daughter, real-client onboarding, bug triage loop, support tooling, QA on mobile, launch KPI tracking

  **Phase 6**   Beta Cohort + Paid Soft Launch  2--3 weeks     Design-partner beta cohort, onboarding playbook, pricing activation, support docs, referral loop, direct outreach to independent walkers
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

#### Execution Rule

No Phase 6 growth work should begin until Tenant Zero can complete the full workflow from inquiry to paid invoice inside the product.

**8. Walk Report --- Detailed UX Design**

The walk report is the primary client-delight feature. It must feel warm, professional, and fun---something clients look forward to receiving.

**8.1 Walker Report Form (Post-Walk)**

  -------------------------------------------------------------------------------------------------------------------------------------------
  **Field**                  **UI Element & Options**
  -------------------------- ----------------------------------------------------------------------------------------------------------------
  **Walk Duration**          Auto-filled from GPS timer (editable)

  **Distance**               Auto-filled from GPS trace (editable)

  **Route Map**              Auto-generated from GPS data; displayed inline

  **Photos**                 Upload from camera roll or capture in-app; up to 20 photos per walk

  **Potty Report --- Pee**   Toggle: Yes / No + optional count

  **Potty Report --- Poo**   Toggle: Yes / No + optional count (with 💩 emoji for fun)

  **Mood**                   Emoji selector: 😄 Happy / 😐 Calm / 😢 Anxious / 😄 Excited / 😴 Tired

  **Behavior Notes**         Multi-select tags: Pulled on leash / Played well / Barked at dogs / Listened great / Sniffed everything / etc.

  **Health Observation**     Free text: \'Everything looked great\' or note any concerns

  **Personal Message**       Free text note to the client from the walker (pre-filled with warm template)

  **Eating/Drinking**        Did you provide water? Yes / No (if drop-in service)

  **Rating**                 Internal 1--5 star rating for walker\'s records only (not shown to client)
  -------------------------------------------------------------------------------------------------------------------------------------------

**8.2 Client-Facing Report Card Design**

The report delivered to the client should look like a beautiful \'report card\' for their dog --- shareable, delightful, branded.

-   Header: PawPath Pro logo + walker name + date

-   Hero photo: largest/best photo from the walk at the top

-   Quick stats bar: Duration \| Distance \| Potty ✔ \| Mood emoji

-   Photo gallery: grid of remaining photos

-   Route map: embedded interactive map showing the walk path

-   Walker\'s note: displayed as a handwritten-style callout card

-   Call to action: \'Book Next Walk\' button linking back to portal

-   Footer: contact info + social links

**9. Public Website --- Content & Copy Guide**

**9.1 Suggested Brand Name Options**

-   PawPath Pro

-   Happy Tails \[City\] (e.g., Happy Tails Houston)

-   The Dog Walker Co.

-   \[Her First Name\]\'s Dog Walking (personal brand)

-   Stride & Sniff

Recommendation: Use her actual name for a personal brand if she is the sole walker. Clients trust individual people, not generic company names, for pet care.

**9.2 Services to Offer (Configure in Dashboard)**

  ---------------------------------------------------------------------------------------------------------------------------------
  **Service**                  **Suggested Price**   **Description**
  ---------------------------- --------------------- ------------------------------------------------------------------------------
  **30-Minute Walk**           \$20--\$25            Solo walk; GPS tracked; walk report with photos delivered after

  **60-Minute Walk**           \$30--\$40            Extended walk for high-energy dogs; full report with photo gallery

  **Group Walk (2--3 dogs)**   \$15--\$18 per dog    Walk with 2--3 neighborhood dogs (consider carefully for solo ops)

  **Drop-In Visit**            \$15--\$20            30-min home check-in: potty break, feeding, playtime; ideal for cats too

  **Puppy Visit**              \$20--\$25            Midday visit for puppies; feeding, playtime, bathroom training reinforcement

  **Holiday Walk**             Base + \$5--\$10      Surcharge for walks on major holidays

  **Extra Dog Surcharge**      +\$5--\$10            Additional dog from same household on same walk
  ---------------------------------------------------------------------------------------------------------------------------------

**10. Security, Privacy & Legal Considerations**

**10.1 Authentication & Data Security**

-   All passwords hashed via Supabase Auth (bcrypt)

-   HTTPS enforced site-wide (Vercel auto-provisions SSL)

-   Row-Level Security (RLS) in Supabase: clients can only read their own data

-   Stripe handles all card data --- PawPath Pro never stores raw card numbers (PCI compliance via Stripe)

-   Photo uploads validated (type, size) before storage; served via signed URLs

-   Waiver signatures stored with IP + timestamp for legal defensibility

-   Environment variables for all secrets (Stripe keys, Supabase keys) --- never committed to git

**10.2 Client Data Privacy**

-   Privacy Policy page required: disclose what data is collected, how it\'s used, how to delete account

-   Terms of Service page: covers booking, cancellation, liability, payment terms

-   Cookie consent banner (minimal cookies; Supabase session cookies only)

-   Clients can request account deletion; data purged from all tables per request

**10.3 Legal Notes for the Walker**

-   Consult a Texas attorney for: waiver enforceability, business entity (LLC recommended), insurance

-   Dog walker liability insurance strongly recommended (e.g., Pet Sitters Associates)

-   Business license may be required in Harris County; check with city of Houston

-   Stripe requires a valid SSN or EIN for payouts --- set up a business bank account

-   Walk photos shared with clients: ensure no third-party dogs or people are identifiable in shared photos

**10.4 Insurance & Risk Management Requirements**

-   PawPath Pro should educate walkers that dog walking creates care, custody, and control exposure, third-party liability exposure, and professional-negligence exposure

-   The platform should offer or refer walkers to specialized insurance products covering General Liability, CCC / Animal Bailee, Lost Key Liability, and Professional Liability

-   Insurance should appear in onboarding and settings, not only in help content or FAQs

-   Walker setup should capture insurance status and support storing proof of coverage details

-   Service agreements should include indemnity / hold harmless language, emergency care authorization, and required behavior disclosure fields

-   Pet intake should capture vet contacts, emergency contacts, allergies, medications, leash behavior, triggers, and off-limit handling notes

-   PawPath Pro provides workflow and documentation infrastructure, but legal language and regulatory compliance still require local attorney review

**11. Success Metrics (KPIs)**

**11.1 Business Metrics**

-   Monthly Revenue: track via Stripe dashboard + PawPath earnings report

-   Active Clients: number of clients with at least 1 walk in last 30 days

-   Walk Completion Rate: % of booked walks marked \'Completed\' (target: \>95%)

-   Client Retention Rate: % of clients booking again within 60 days

-   Average Revenue Per Client Per Month

-   Invoice Collection Rate: % of invoices paid within 7 days of issue (target: \>90%)

**11.2 Product Quality Metrics**

-   Walk Report Delivery Rate: % of walks with a report sent within 2 hours of completion (target: 100%)

-   Client Portal Adoption: % of active clients who have logged in at least once

-   Waiver Completion Rate: % of clients with signed waivers before first walk (target: 100%)

-   Mobile Usage: % of walker dashboard sessions on mobile (optimize for this)

**12. Future Roadmap (Post-Launch)**

**SaaS Growth**

-   Affiliate / Referral Program: Walker refers another walker → credit on subscription
-   White-Label Custom Domains: Each tenant maps their own domain via Vercel CNAME
-   Walker Marketplace Directory: Optional public listing of PawPath Pro walkers for SEO/discovery
-   Zip-Code Walker Discovery: Dog owners can search by ZIP code, browse walker cards, and choose a walker based on profile, photo, short bio, ratings, and service area
-   Mobile App (React Native): Native iOS/Android app for walkers — better GPS tracking, push notifications
-   Usage-Based Billing: Charge per completed walk above a threshold instead of flat monthly

**Per-Tenant Features**

-   Multi-Walker Support: Already included in Agency tier; add payroll splitting and sub-walker scheduling
-   Subscription Packages: Offer discounted walk bundles (e.g., 10-pack for \$180)

-   AI Walk Summary: Use Claude API to auto-generate a personalized, warm walk note from structured report data

-   Photo AI: Auto-select best photo from the walk to use as the hero image in the report

-   Client App (iOS/PWA): Prompt clients to install the PWA on their home screen for push notifications

-   Vet Integration: Share walk notes and health observations to veterinary portals

-   Dog Park / Route Library: Save favorite walk routes and share them with clients

-   Waitlist Management: Auto-manage waitlist when calendar is fully booked

-   Review Collection: Post-walk email asking client to leave a Google review (link to Google Business Profile)

-   QR Code Key Tags: Generate QR code pet tags linking to the pet profile emergency card (great upsell!)

**Operational Decisions & Future Requirements**

-   Availability-Driven Booking: Replace freeform date/time requests with a clickable client calendar that only shows open slots. Walkers need recurring availability, blackout dates, travel buffers, capacity limits, and same-day / advance-booking rules.

-   Conflict Prevention: Pending requests should place a temporary hold or follow a clear first-come rule so two clients cannot book the same slot while approval is still pending.

-   Travel Buffer Rules: Walkers need configurable buffers before and after bookings so the system can account for drive time, parking, lockbox entry, and schedule overruns when presenting available slots.

-   Automatic Card-on-File Charging: Move from "invoice now, maybe pay later" to autopay on walk completion or approval, with optional deposits, saved payment methods, retries, receipts, and failed-payment handling.

-   Walker Payout Setup: The product needs a clear payout setup flow covering bank-account onboarding, payout schedule, instant-payout eligibility, tax identity collection, and visibility into expected payout timing after client charges clear.

-   Tipping Support: Clients should be able to leave an optional tip during checkout or immediately after a completed walk report. The product must define how tips appear on receipts, whether tips can be edited after submission, and how tips flow through payouts and reporting.

-   Cancellation / Reschedule Policy Engine: Tenants need configurable notice windows, cancellation fees, no-show rules, weather exceptions, and client-visible policy text at booking time.

-   Service Area Geofencing: Walkers should define service ZIP codes, neighborhoods, radius rules, or map polygons. Out-of-area inquiries and bookings should be blocked or routed to a waitlist/manual review path.

-   Walker Availability Publishing: The walker should have a real scheduling setup flow that publishes client-bookable inventory instead of relying on manual approval for every date/time forever.

-   Client / Walker Relationship Offboarding: Clients need a way to stop using a walker, and walkers need a way to terminate a client relationship. This must cancel future bookings as needed, preserve records, restrict future booking, and settle outstanding balances cleanly.

-   Meet-and-Greet Workflow: Many walkers will want a required intro visit before the first paid walk. The product should support mandatory meet-and-greet completion before standard services become bookable.

-   Household Access Management: Future versions need secure handling of lockbox codes, key status, alarm notes, gate codes, and lost-key incidents with auditable access instructions.

-   Incident & Emergency Workflow: The platform should support bite incidents, escapes, injuries, emergency vet care, owner unreachable scenarios, and post-incident documentation with timestamps and attachments.

-   Custom Domain Provisioning: If tenants bring their own domain, the product needs clear DNS instructions, automated Vercel domain verification, SSL readiness checks, propagation status, and a stable fallback URL while setup completes.

-   Platform Homepage Strategy: The root marketing site may eventually need a dual-path homepage that speaks to both walkers and owners, with clear routing into either "start your dog walking business site" or "find a local walker" experiences.

-   Walker Discovery Marketplace Decision: If PawPath Pro adds owner-side walker discovery, the product must define whether discovery is optional per tenant, how rankings work, what profile fields are required, how ratings/reviews are verified, how leads are routed, and how marketplace discovery coexists with the core "owned relationship" positioning.

-   Referral Attribution Model: The product should track whether a new walker came from another walker, whether a new dog owner came from a walker or another owner, and whether the lead originated from QR code, email, ad, SEO, or marketplace discovery.

-   Stripe Architecture Decision: Before broad launch, finalize whether PawPath Pro uses Stripe Connect connected accounts or becomes merchant of record. Recommendation: use connected accounts, not one shared platform account paying walkers manually.

-   Refunds, Disputes, and Taxes: Define who owns refunds, chargebacks, processor fees, tips, sales-tax behavior where applicable, and year-end reporting obligations for multi-tenant payouts.

-   Recurring Schedule Logic: Future scheduling should support weekly recurring walks, pause/resume, holiday overrides, alternate walkers, and client acknowledgements when the standing schedule changes.

-   Staff / Agency Controls: If the product expands beyond solo walkers, assignment rules, permissions, client ownership, payout splitting, and substitute coverage need explicit product and policy decisions.

-   Data Retention & Record Access: Decide how long to keep reports, waivers, invoices, pet records, and terminated-client history, and what each side can still access after a relationship ends.

**Design / UX Reference**

-   For future design-polish passes only, evaluate [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) as a reference for improving visual taste, layout quality, and avoiding generic UI output. Do not prioritize this ahead of core workflow delivery, tenant isolation, booking, waiver, and billing features.

**13. Appendix: Suggested Folder Structure**

Recommended Next.js project structure for Claude Code build:

pawpath-pro/

├── app/ \# Next.js App Router

│ ├── (public)/ \# Public site routes

│ │ ├── page.tsx \# Home / Landing

│ │ ├── services/ \# Services & Pricing

│ │ ├── about/ \# About page

│ │ ├── contact/ \# Contact/Lead form

│ ├── (client)/ \# Client portal (auth required)

│ │ ├── dashboard/ \# Client home

│ │ ├── pets/ \# Pet profiles

│ │ ├── schedule/ \# Booking calendar

│ │ ├── walks/ \# Walk history + reports

│ │ ├── billing/ \# Invoices + payments

│ │ ├── messages/ \# Client messaging

│ │ └── settings/ \# Account settings + waiver

│ ├── (walker)/ \# Walker dashboard (auth + role required)

│ │ ├── dashboard/ \# Walker home / day view

│ │ ├── schedule/ \# Calendar + booking approvals

│ │ ├── walk/\[id\]/ \# Active walk mode

│ │ ├── clients/ \# Client directory

│ │ ├── billing/ \# Invoices + earnings

│ │ ├── messages/ \# Walker messaging center

│ │ └── settings/ \# Services, pricing, availability, waivers

├── components/ \# Shared UI components

├── lib/ \# Supabase client, Stripe, utils, email

├── emails/ \# React Email templates

└── public/ \# Static assets, logo, og-image

**PawPath Pro**

Built with love for a dog walker who deserves to own her business.

Document prepared by Geffrey Klein • v1.0
