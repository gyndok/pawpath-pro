'use client'

import { usePathname } from 'next/navigation'
import { CalendarDays } from 'lucide-react'
import { PortalHeader } from '@/components/portal/header'
import { PortalSidebar } from '@/components/portal/sidebar'
import { useTenant } from '@/lib/context/tenant-context'

const AUTHED_PORTAL_SEGMENTS = new Set(['', 'pets', 'waiver', 'schedule', 'walks', 'billing'])

const PORTAL_ROUTE_META = {
  '': {
    title: 'Client Dashboard',
    detail: 'Pet profile, waiver status, bookings, and billing in one place',
  },
  pets: {
    title: 'My Pets',
    detail: 'Pet information, handling notes, and emergency details',
  },
  waiver: {
    title: 'Waiver',
    detail: 'Review the service agreement and current acknowledgment status',
  },
  schedule: {
    title: 'Schedule a Walk',
    detail: 'Choose from currently available dates and open booking times',
  },
  walks: {
    title: 'Walk Reports',
    detail: 'Recent visits, notes, and delivery history from your walker',
  },
  billing: {
    title: 'Billing',
    detail: 'Invoices, payment status, and account activity',
  },
} as const

export function PortalShell({
  children,
  isAuthenticatedClient,
}: {
  children: React.ReactNode
  isAuthenticatedClient: boolean
}) {
  const pathname = usePathname()
  const { tenant } = useTenant()

  const tenantPortalBase = `/${tenant.slug}/portal`
  const routeAfterPortal = pathname === tenantPortalBase
    ? ''
    : pathname.startsWith(`${tenantPortalBase}/`)
      ? pathname.slice(tenantPortalBase.length + 1).split('/')[0]
      : ''

  const useSidebarShell = isAuthenticatedClient && AUTHED_PORTAL_SEGMENTS.has(routeAfterPortal)
  const routeMeta = useSidebarShell
    ? PORTAL_ROUTE_META[routeAfterPortal as keyof typeof PORTAL_ROUTE_META] ?? PORTAL_ROUTE_META['']
    : null

  if (!useSidebarShell) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PortalHeader isAuthenticatedClient={isAuthenticatedClient} />
        <main>{children}</main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <PortalSidebar />
      <main className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top_left,_rgba(226,196,154,0.16),_transparent_24%),linear-gradient(180deg,_#fcfaf7_0%,_#f7f4ee_100%)]">
        <div className="sticky top-0 z-10 border-b border-stone-200/70 bg-[#fcfaf7]/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                {tenant.business_name}
              </p>
              <div className="mt-1 flex items-center gap-3">
                <h1 className="text-xl font-semibold text-stone-950">{routeMeta?.title}</h1>
                <span className="hidden text-sm text-stone-500 lg:inline">{routeMeta?.detail}</span>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3 py-2 text-sm text-stone-600 md:flex">
              <CalendarDays className="h-4 w-4 text-[#b45a21]" />
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>
        <div>{children}</div>
      </main>
    </div>
  )
}
