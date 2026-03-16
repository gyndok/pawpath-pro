import Link from 'next/link'
import { ArrowRight, BriefcaseBusiness, Globe2, PawPrint } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function DemoBanner({
  tenantSlug,
  compact = false,
}: {
  tenantSlug: string
  compact?: boolean
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-[#e7c6a8] bg-[linear-gradient(135deg,#fff8f1_0%,#fff1e1_55%,#f5e6d7_100%)] p-5 text-sm text-stone-700 shadow-[0_20px_60px_rgba(141,84,32,0.08)] sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-[#c66a2b] text-white">Interactive Demo</Badge>
        <span>Walk through the product the way your daughter would actually experience it.</span>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">Choose a tour path</h2>
          <p className="mt-2 max-w-2xl text-stone-600">
            This demo uses seeded data, so every screen already feels active. Start on the public site, then move into the client or walker workflow.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-600">
            <span className="rounded-full bg-white/80 px-3 py-1">Seeded clients</span>
            <span className="rounded-full bg-white/80 px-3 py-1">Walk reports</span>
            <span className="rounded-full bg-white/80 px-3 py-1">Invoices</span>
            <span className="rounded-full bg-white/80 px-3 py-1">Waiver state</span>
          </div>
          {!compact && (
            <div className="mt-6 rounded-2xl bg-stone-900 px-4 py-4 text-stone-100">
              <p className="text-xs uppercase tracking-[0.25em] text-stone-400">Suggested Flow</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="font-medium">1. Public view</p>
                  <p className="mt-1 text-xs text-stone-300">Open the landing page and see the branded client-facing experience.</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="font-medium">2. Client journey</p>
                  <p className="mt-1 text-xs text-stone-300">Register, review pets and waiver, then explore booking, reports, and billing.</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="font-medium">3. Walker ops</p>
                  <p className="mt-1 text-xs text-stone-300">Switch to the operator side for clients, schedule, invoicing, and settings.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-3">
        <div className="rounded-2xl bg-white/85 p-4 ring-1 ring-[#ecd2ba]">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[#fff2e4] p-2 text-[#b45a21]">
              <Globe2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-stone-900">Landing page</p>
              <p className="mt-1 text-stone-600">See the public-facing site a dog owner would land on first.</p>
            </div>
          </div>
          <div className="mt-3">
            <Link href={`/${tenantSlug}`}>
              <Button size="sm" variant="outline">View landing page <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
            </Link>
          </div>
        </div>
        <div className="rounded-2xl bg-white/85 p-4 ring-1 ring-[#ecd2ba]">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[#fff2e4] p-2 text-[#b45a21]">
              <PawPrint className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-stone-900">Dog owner walkthrough</p>
              <p className="mt-1 text-stone-600">Start in the client flow to experience onboarding, pets, waiver, booking, reports, and billing.</p>
            </div>
          </div>
          <div className="mt-3">
            <Link href={`/${tenantSlug}/portal/register`}>
              <Button size="sm" className="bg-[#c66a2b] hover:bg-[#ad5821]">Start client demo <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
            </Link>
          </div>
        </div>
        <div className="rounded-2xl bg-white/85 p-4 ring-1 ring-[#ecd2ba]">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[#fff2e4] p-2 text-[#b45a21]">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-stone-900">Dog walker walkthrough</p>
              <p className="mt-1 text-stone-600">Use the walker side to review bookings, run visits, verify waivers, and manage invoices.</p>
            </div>
          </div>
          <div className="mt-3">
            <Link href={`/${tenantSlug}/login`}>
              <Button size="sm" variant="outline">Open walker demo <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
            </Link>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
