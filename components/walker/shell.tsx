'use client'

import { usePathname } from 'next/navigation'
import { WalkerSidebar } from '@/components/walker/sidebar'
import { useTenant } from '@/lib/context/tenant-context'

const WALKER_ROUTE_SEGMENTS = new Set(['dashboard', 'clients', 'schedule', 'billing', 'settings'])

export function WalkerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { tenant } = useTenant()

  const tenantBasePath = `/${tenant.slug}`
  const routeAfterTenant = pathname.startsWith(`${tenantBasePath}/`)
    ? pathname.slice(tenantBasePath.length + 1).split('/')[0]
    : ''

  const shouldShowWalkerShell = WALKER_ROUTE_SEGMENTS.has(routeAfterTenant)

  if (!shouldShowWalkerShell) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <WalkerSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
