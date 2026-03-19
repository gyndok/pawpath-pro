'use client'

import { useEffect, useMemo, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { CalendarDays } from 'lucide-react'
import { WalkerSidebar } from '@/components/walker/sidebar'
import { useTenant } from '@/lib/context/tenant-context'

const WALKER_ROUTES = {
  dashboard: {
    title: 'Dashboard',
    detail: 'Daily snapshot, client pipeline, and financial view',
  },
  clients: {
    title: 'Clients',
    detail: 'Profiles, logistics, emergency contacts, and waiver status',
  },
  schedule: {
    title: 'Schedule',
    detail: 'Requests, approved visits, buffers, and walk completion',
  },
  billing: {
    title: 'Billing',
    detail: 'Invoices, reminders, collections, and receivables',
  },
  settings: {
    title: 'Settings',
    detail: 'Services, booking rules, availability, blackout dates, and geofencing',
  },
} as const

const WALKER_ROUTE_SEGMENTS = new Set(Object.keys(WALKER_ROUTES))

export function WalkerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { tenant } = useTenant()
  const contentRef = useRef<HTMLElement | null>(null)

  const tenantBasePath = `/${tenant.slug}`
  const routeAfterTenant = pathname.startsWith(`${tenantBasePath}/`)
    ? pathname.slice(tenantBasePath.length + 1).split('/')[0]
    : ''

  const shouldShowWalkerShell = WALKER_ROUTE_SEGMENTS.has(routeAfterTenant)
  const routeMeta = useMemo(
    () => (shouldShowWalkerShell ? WALKER_ROUTES[routeAfterTenant as keyof typeof WALKER_ROUTES] : null),
    [routeAfterTenant, shouldShowWalkerShell]
  )

  useEffect(() => {
    if (!shouldShowWalkerShell || !contentRef.current) {
      return
    }

    const storageKey = `walker-scroll:${pathname}`
    const saved = window.sessionStorage.getItem(storageKey)
    contentRef.current.scrollTo({ top: saved ? Number(saved) : 0, behavior: 'auto' })

    const node = contentRef.current
    const handleScroll = () => {
      window.sessionStorage.setItem(storageKey, String(node.scrollTop))
    }

    node.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.sessionStorage.setItem(storageKey, String(node.scrollTop))
      node.removeEventListener('scroll', handleScroll)
    }
  }, [pathname, shouldShowWalkerShell])

  if (!shouldShowWalkerShell) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <WalkerSidebar />
      <main ref={contentRef} className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top_left,_rgba(47,111,143,0.14),_transparent_24%),linear-gradient(180deg,_#f8fbfd_0%,_#eff5f8_100%)]">
        <div className="sticky top-0 z-10 border-b border-[#d6e4ec]/80 bg-[#f8fbfd]/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a8594]">
                {tenant.business_name}
              </p>
              <div className="mt-1 flex items-center gap-3">
                <h1 className="text-xl font-semibold text-[#143042]">{routeMeta?.title}</h1>
                <span className="hidden text-sm text-[#5d7a89] lg:inline">{routeMeta?.detail}</span>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-[#d6e4ec] bg-white/85 px-3 py-2 text-sm text-[#5d7a89] shadow-sm md:flex">
              <CalendarDays className="h-4 w-4 text-[#2f6f8f]" />
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
