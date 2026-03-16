import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PawPrint, CheckCircle, ArrowRight, Star, Shield, BarChart3 } from 'lucide-react'

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
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <PawPrint className="h-6 w-6 text-violet-600" />
          <span className="font-bold text-xl">PawPath Pro</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
          <Link href="/signup">
            <Button size="sm">Start Free Trial</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <Badge variant="secondary" className="mb-4">14-day free trial · No credit card required</Badge>
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
          Your dog walking business,<br />
          <span className="text-violet-600">professionally branded.</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Stop giving 20–40% to Rover and Wag. Own your clients, keep your revenue,
          and run a safer operation with client records, waivers, and insurance-ready workflows.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="bg-violet-600 hover:bg-violet-700">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="mt-12 flex items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>Walkers earn 40% more vs Rover</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Liability docs + insurance-ready workflows</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <span>Built-in analytics</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
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
              <div key={f.title} className="bg-white rounded-xl p-6 shadow-sm">
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
                plan.highlight ? 'border-violet-600 bg-violet-50 shadow-lg' : 'border-gray-200 bg-white'
              }`}
            >
              {plan.highlight && <Badge className="mb-4 bg-violet-600">Most Popular</Badge>}
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
                  className={`w-full ${plan.highlight ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
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
        <div className="flex items-center justify-center gap-2 mb-2">
          <PawPrint className="h-4 w-4 text-violet-600" />
          <span className="font-semibold text-gray-700">PawPath Pro</span>
        </div>
        <p>© {new Date().getFullYear()} PawPath Pro · Built with love for dog walkers who deserve to own their business.</p>
      </footer>
    </div>
  )
}
