import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, CreditCard, ShieldCheck, Sparkles, TimerReset } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const PLANS = [
  {
    name: 'Starter',
    price: '$29',
    description: 'Independent walker getting started',
    features: ['Up to 30 clients', 'Client portal + waivers', 'Walk reports + billing', 'Availability-based booking'],
  },
  {
    name: 'Pro',
    price: '$59',
    description: 'Unlimited clients + premium operations',
    features: ['Unlimited clients', 'Custom domain support', 'Payment workflows', 'Exports + stronger branding'],
    featured: true,
  },
  {
    name: 'Agency',
    price: '$99',
    description: 'Small team or growing operation',
    features: ['Up to 5 walkers', 'Multi-walker assignment', 'Shared operations view', 'Agency-ready foundation'],
  },
]

const featureCards = [
  {
    title: 'Scheduling that respects reality',
    description: 'Availability publishing, travel buffers, booking windows, geofencing, and approval workflows in one place.',
    icon: TimerReset,
  },
  {
    title: 'Billing built for trust',
    description: 'Saved cards, invoices, autopay, subscription management, and polished payment experiences for both sides.',
    icon: CreditCard,
  },
  {
    title: 'Risk documentation on file',
    description: 'Waivers, pet handling notes, emergency contacts, and insurance-ready records without scattered paperwork.',
    icon: ShieldCheck,
  },
  {
    title: 'A brand clients remember',
    description: 'Give every walker a premium home on the web, then route owners into a polished private portal experience.',
    icon: Sparkles,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/brand/logo-full-color.png"
              alt="PawPath Pro"
              width={180}
              height={52}
              className="h-11 w-auto"
              priority
            />
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-semibold text-stone-600 transition-colors hover:text-[#003fb1]">Platform</a>
            <a href="#pricing" className="text-sm font-semibold text-stone-600 transition-colors hover:text-[#003fb1]">Pricing</a>
            <Link href="/demo" className="text-sm font-semibold text-stone-600 transition-colors hover:text-[#003fb1]">Demo</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/demo">
              <Button variant="outline" className="hidden border-stone-300 bg-white md:inline-flex">
                Explore Demo
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="rounded-xl bg-[#003fb1] px-5 text-white hover:bg-[#1a56db]">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="overflow-hidden py-18 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="relative">
              <Badge className="kinetic-pill mb-6 px-4 py-2 shadow-sm">
                Platform for walkers and owners
              </Badge>
              <h1 className="section-title max-w-3xl">
                Own your dog walking business.
                <span className="mt-2 block text-[#003fb1]">Give clients something premium.</span>
              </h1>
              <p className="editorial-subtitle mt-7 max-w-2xl">
                PawPath Pro gives independent dog walkers a branded business presence, a real operating dashboard,
                and a client portal for waivers, pets, scheduling, reports, and payment collection.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/signup">
                  <Button size="lg" className="rounded-xl bg-[#003fb1] px-7 text-white hover:bg-[#1a56db]">
                    I&apos;m a Dog Walker
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="outline" className="rounded-xl border-stone-300 bg-white px-7">
                    See the Product Tour
                  </Button>
                </Link>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                <div className="kinetic-card rounded-2xl p-4">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#9d4300]">Walker</p>
                  <p className="mt-2 text-sm text-stone-600">Sign up directly, launch a branded portal, and run scheduling, reports, and payments in one place.</p>
                </div>
                <div className="kinetic-card rounded-2xl p-4">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#9d4300]">Owner</p>
                  <p className="mt-2 text-sm text-stone-600">Book through a walker invite, QR code, referral, search, or future discovery route.</p>
                </div>
                <div className="kinetic-card rounded-2xl p-4">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#9d4300]">Revenue</p>
                  <p className="mt-2 text-sm text-stone-600">Keep the client relationship and stop leaking 20–40% of every walk to marketplace commissions.</p>
                </div>
              </div>
            </div>

            <div className="relative lg:pl-10">
              <div className="absolute -top-16 -right-8 h-48 w-48 rounded-full bg-[#dbe1ff] blur-3xl" />
              <div className="absolute -bottom-10 left-0 h-52 w-52 rounded-full bg-[#89f5e7]/35 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(115,118,134,0.15)] bg-white p-4 shadow-[0_30px_80px_-28px_rgba(0,63,177,0.28)]">
                <Image
                  src="/assets/website/hero-illustration.png"
                  alt="PawPath Pro brand and dashboard illustration"
                  width={1600}
                  height={1200}
                  className="h-auto w-full rounded-[1.4rem]"
                  priority
                />
              </div>

              <div className="kinetic-card absolute -bottom-8 -left-3 hidden w-64 rounded-[1.4rem] p-5 lg:block">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#89f5e7] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#005049]">
                  <span className="h-2 w-2 rounded-full bg-[#9d4300]" />
                  Live workflow
                </div>
                <p className="font-[var(--font-display)] text-xl font-extrabold tracking-tight text-stone-900">Client books a walk.</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">Walker approves, completes the visit, sends the report, and gets paid through the same system.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-[#f2f4f6] py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-14 flex flex-col gap-4 lg:max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#9d4300]">Core platform</p>
              <h2 className="font-[var(--font-display)] text-4xl font-extrabold tracking-tight text-stone-950">
                Built like a serious service business, not a generic pet app
              </h2>
              <p className="editorial-subtitle">
                The strongest parts of PawPath Pro are operational. It brings together scheduling, client records,
                billing, reporting, and liability documentation into one branded system.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {featureCards.map(({ title, description, icon: Icon }) => (
                <div key={title} className="kinetic-card rounded-[1.35rem] p-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dbe1ff] text-[#003fb1]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-[var(--font-display)] text-2xl font-bold tracking-tight text-stone-950">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 lg:grid-cols-[0.75fr_1.25fr]">
            <div className="kinetic-card rounded-[1.7rem] bg-[#003fb1] p-8 text-white">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#dbe1ff]">What owners see</p>
              <h2 className="mt-3 font-[var(--font-display)] text-3xl font-extrabold tracking-tight">
                A private portal that feels polished and trustworthy
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#d4dcff]">
                Pet profiles, signed waivers, live booking constraints, walk reports, and billing all live behind a single client experience.
              </p>
              <div className="mt-8 flex gap-3">
                <Link href="/demo/portal/register">
                  <Button className="rounded-xl bg-white px-5 text-[#003fb1] hover:bg-[#dbe1ff]">View Client Demo</Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="kinetic-card rounded-[1.35rem] p-4">
                <Image
                  src="/assets/website/walk-report-header.png"
                  alt="Walk report artwork"
                  width={1600}
                  height={900}
                  className="h-auto w-full rounded-[1rem]"
                />
              </div>
              <div className="kinetic-card rounded-[1.35rem] bg-[#fff6ed] p-6">
                <div className="flex items-center gap-3">
                  <Image src="/assets/brand/mascot-dog.png" alt="PawPath mascot" width={72} height={72} className="h-14 w-14 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9d4300]">Owner confidence</p>
                    <p className="text-lg font-semibold text-stone-900">No more scattered texts, invoices, and notes.</p>
                  </div>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-stone-700">
                  {['Pet records stay on file', 'Waivers are signed once and tracked', 'Invoices and reports are easy to revisit'].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-[#00544c]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.26em] text-[#9d4300]">Pricing</p>
              <h2 className="mt-3 font-[var(--font-display)] text-4xl font-extrabold tracking-tight text-stone-950">
                Simple enough for one walker. Strong enough to scale later.
              </h2>
              <p className="mt-4 text-base leading-7 text-stone-600">
                Built for the economics of an independent dog walking business, not marketplace commissions.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-[1.5rem] p-8 ${
                    plan.featured
                      ? 'bg-[#003fb1] text-white shadow-[0_28px_80px_-32px_rgba(0,63,177,0.45)]'
                      : 'kinetic-card'
                  }`}
                >
                  {plan.featured && <Badge className="mb-5 bg-[#89f5e7] text-[#005049]">Recommended</Badge>}
                  <h3 className={`font-[var(--font-display)] text-2xl font-bold ${plan.featured ? 'text-white' : 'text-stone-950'}`}>{plan.name}</h3>
                  <div className="mt-3 flex items-end gap-2">
                    <span className={`font-[var(--font-display)] text-5xl font-extrabold tracking-tight ${plan.featured ? 'text-white' : 'text-stone-950'}`}>{plan.price}</span>
                    <span className={plan.featured ? 'text-[#dbe1ff]' : 'text-stone-500'}>/month</span>
                  </div>
                  <p className={`mt-3 text-sm leading-6 ${plan.featured ? 'text-[#d4dcff]' : 'text-stone-600'}`}>{plan.description}</p>
                  <ul className="mt-8 space-y-3 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${plan.featured ? 'text-[#89f5e7]' : 'text-[#00544c]'}`} />
                        <span className={plan.featured ? 'text-white' : 'text-stone-700'}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Link href="/signup">
                      <Button
                        className={`w-full rounded-xl ${
                          plan.featured
                            ? 'bg-white text-[#003fb1] hover:bg-[#dbe1ff]'
                            : 'bg-[#003fb1] text-white hover:bg-[#1a56db]'
                        }`}
                      >
                        Start Free Trial
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/60 bg-white/75 px-6 py-8 text-center backdrop-blur">
        <div className="mx-auto max-w-7xl">
          <div className="mb-3 flex items-center justify-center">
            <Image
              src="/assets/brand/logo-full-color.png"
              alt="PawPath Pro"
              width={170}
              height={48}
              className="h-10 w-auto"
            />
          </div>
          <p className="text-sm text-stone-500">
            PawPath Pro is built for dog walkers who want to own the client relationship, the workflow, and the brand.
          </p>
        </div>
      </footer>
    </div>
  )
}
