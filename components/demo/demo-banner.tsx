import Link from 'next/link'
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
    <div className="rounded-2xl border border-[#f2d2b5] bg-[#fff6ed] p-4 text-sm text-stone-700">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-[#c66a2b] text-white">Interactive Demo</Badge>
        <span>This demo uses seeded data so you can explore both sides of the product without setup.</span>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-white p-3">
          <p className="font-medium text-stone-900">Dog owner walkthrough</p>
          <p className="mt-1 text-stone-600">Start in the client flow to experience onboarding, pets, waiver, booking, reports, and billing.</p>
          <div className="mt-3">
            <Link href={`/${tenantSlug}/portal/register`}>
              <Button size="sm" className="bg-[#c66a2b] hover:bg-[#ad5821]">Start client demo</Button>
            </Link>
          </div>
        </div>
        <div className="rounded-xl bg-white p-3">
          <p className="font-medium text-stone-900">Dog walker walkthrough</p>
          <p className="mt-1 text-stone-600">Use the walker side to review bookings, run visits, verify waivers, and manage invoices.</p>
          <div className="mt-3">
            <Link href={`/${tenantSlug}/login`}>
              <Button size="sm" variant="outline">Open walker demo</Button>
            </Link>
          </div>
        </div>
      </div>
      {!compact && (
        <p className="mt-3 text-xs text-stone-500">
          Suggested order: client onboarding, portal walkthrough, then walker dashboard and billing.
        </p>
      )}
    </div>
  )
}
