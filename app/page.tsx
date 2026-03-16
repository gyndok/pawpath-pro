import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, ArrowRight, Star, Shield, BarChart3 } from 'lucide-react'

const PLANS = [
  {
    name: 'Starter',
    price: '$29',
    description: '1 walker, up to 30 clients',
    features: ['GPS walk tracking', 'Walk reports + photos', 'Client portal', 'Online payments', 'Digital waivers'],
    cta: 'Start Free Trial',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$59',
    description: 'Unlimited clients + custom domain',
    features: ['Everything in Starter', 'Unlimited clients', 'Custom domain', 'Earnings CSV export', 'Priority support'],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Agency',
    price: '$99',
    description: 'Up to 5 walkers',
    features: ['Everything in Pro', 'Up to 5 walkers', 'Multi-walker assignment', 'Team earnings reports', 'White-glove onboarding'],
    cta: 'Start Free Trial',
    highlight: false,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f7f1e8] text-stone-900">
      {/* Nav */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/brand/logo-full-color.png"
            alt="PawPath Pro"
            width={160}
            height={44}
            className="h-11 w-auto"
            priority
          />
        </div>
        <div className="flex items-center gap-4">
          <Link href="/demo">
            <Button size="sm" variant="outline" className="border-stone-300 bg-white/70">Explore Demo</Button>
          </Link>
          <Link href="/#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
          <Link href="/signup">
            <Button size="sm" className="bg-[#c66a2b] hover:bg-[#ad5821]">Start Free Trial</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-20">
        <div>
          <Badge variant="secondary" className="mb-4 bg-white/80 text-stone-700">14-day free trial · No credit card required</Badge>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-stone-900">
            Dog walking software that looks polished,
            <span className="block text-[#c66a2b]">runs lean, and manages risk.</span>
          </h1>
          <p className="mb-8 max-w-2xl text-xl text-stone-600">
            Stop giving 20–40% to Rover and Wag. Own your clients, keep your revenue,
            and run a safer operation with client records, waivers, and insurance-ready workflows.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-[#c66a2b] hover:bg-[#ad5821]">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/#pricing">
              <Button size="lg" variant="outline" className="border-stone-300 bg-white/70">See Pricing</Button>
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-6 text-sm text-stone-600">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>Walkers earn 40% more vs Rover</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Liability docs + insurance-ready workflows</span>
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4 text-sky-600" />
              <span>Built-in analytics</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-6 -top-6 h-36 w-36 rounded-full bg-[#f4c978]/35 blur-3xl" />
          <div className="absolute -bottom-4 right-0 h-40 w-40 rounded-full bg-[#d88b4f]/30 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_24px_80px_rgba(90,55,20,0.18)]">
            <Image
              src="/assets/website/hero-illustration.png"
              alt="PawPath Pro dashboard and dog walking brand illustration"
              width={1600}
              height={1200}
              className="h-auto w-full"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="grid gap-4 rounded-[2rem] bg-stone-900 p-6 text-stone-100 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-stone-400">Brand package</p>
            <h2 className="mt-2 text-2xl font-semibold">A serious business should look like one.</h2>
            <p className="mt-3 text-sm text-stone-300">
              PawPath Pro combines scheduling, billing, waivers, and insurance readiness with a brand system walkers can actually market.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="overflow-hidden rounded-2xl bg-[#2a1a10] p-4">
              <Image
                src="/assets/brand/logo-white-dark-bg.png"
                alt="PawPath Pro logo on dark background"
                width={1200}
                height={800}
                className="h-auto w-full rounded-xl"
              />
            </div>
            <div className="overflow-hidden rounded-2xl bg-[#f4eadb] p-4">
              <Image
                src="/assets/website/walk-report-header.png"
                alt="Walk report header illustration"
                width={1600}
                height={900}
                className="h-auto w-full rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Image src="/assets/brand/mascot-dog.png" alt="PawPath mascot" width={72} height={72} className="h-14 w-14 rounded-full object-cover" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need to run your business</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '📍', title: 'GPS Walk Reports', desc: 'Real-time route tracking, automatic map generation, and photo capture. Clients get a beautiful report card after every walk.' },
              { icon: '💳', title: 'Online Payments', desc: "Auto-invoice after every walk. Clients pay with a tap. Funds deposit to your bank in 2 days. You keep 100% (minus Stripe's 2.9%)." },
              { icon: '📅', title: 'Smart Scheduling', desc: 'Clients request walks from your availability calendar. You approve with one tap. No more back-and-forth texting.' },
              { icon: '🐾', title: 'Client Portal', desc: 'Professional branded portal at your-name.pawpathpro.com. Clients manage pets, book walks, sign waivers, and pay — all in one place.' },
              { icon: '📋', title: 'Digital Waivers', desc: 'Liability waivers and service agreements collected electronically with IP + timestamp.' },
              { icon: '🛡️', title: 'Insurance Readiness', desc: 'Guide walkers toward specialized coverage and keep risk documents organized in one place.' },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-stone-200 bg-[#fcfaf7] p-6 shadow-sm">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-4">Simple, transparent pricing</h2>
        <p className="text-center text-gray-600 mb-12">
          A walker doing 3 walks/day at $25 earns ~$2,250/month.
          Rover takes $450–$900. PawPath Pro costs $29–$59.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-8 border-2 ${
                plan.highlight ? 'border-[#c66a2b] bg-[#fff4e8] shadow-lg' : 'border-gray-200 bg-white'
              }`}
            >
              {plan.highlight && <Badge className="mb-4 bg-[#c66a2b]">Most Popular</Badge>}
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <div className="text-4xl font-bold mb-1">
                {plan.price}<span className="text-lg text-gray-500">/mo</span>
              </div>
              <p className="text-sm text-gray-600 mb-6">{plan.description}</p>
              <ul className="space-y-2 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button
                  className={`w-full ${plan.highlight ? 'bg-[#c66a2b] hover:bg-[#ad5821]' : ''}`}
                  variant={plan.highlight ? 'default' : 'outline'}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6 text-center text-sm text-gray-500">
        <div className="mb-2 flex items-center justify-center">
          <Image
            src="/assets/brand/logo-full-color.png"
            alt="PawPath Pro"
            width={160}
            height={44}
            className="h-10 w-auto"
          />
        </div>
        <p>© {new Date().getFullYear()} PawPath Pro · Built with love for dog walkers who deserve to own their business.</p>
      </footer>
    </div>
  )
}
