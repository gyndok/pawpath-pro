'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  Settings,
  LogOut,
} from 'lucide-react'
import { logoutAction } from '@/lib/actions/auth'
import { useTenant } from '@/lib/context/tenant-context'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: 'clients',    label: 'Clients',    icon: Users },
  { href: 'schedule',   label: 'Schedule',   icon: Calendar },
  { href: 'billing',    label: 'Billing',    icon: DollarSign },
  { href: 'settings',   label: 'Settings',   icon: Settings },
]

export function WalkerSidebar() {
  const pathname = usePathname()
  const { tenant } = useTenant()
  const isDemo = tenant.slug === 'demo'

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-stone-200 bg-[#f5efe6]">
      {/* Brand */}
      <div className="border-b border-stone-200 p-5">
        <div className="flex items-center gap-3">
          <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-sm">
            <Image
              src="/assets/brand/logo-icon-dark.png"
              alt="PawPath Pro"
              width={96}
              height={96}
              className="h-10 w-10 object-cover"
            />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight text-stone-900">{tenant.business_name}</div>
            <div className="text-xs capitalize text-stone-500">{tenant.plan_tier} plan</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const fullHref = `/${tenant.slug}/${href}`
          const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`)
          return (
            <Link
              key={href}
              href={fullHref}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#fff4e8] text-[#b45a21]'
                  : 'text-stone-600 hover:bg-white hover:text-stone-900'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-stone-200 p-3">
        {isDemo && (
          <div className="mb-3 space-y-2">
            <Link
              href={`/${tenant.slug}`}
              className="block rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
            >
              Demo Hub
            </Link>
            <Link
              href={`/${tenant.slug}/portal`}
              className="block rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
            >
              Switch to Client Side
            </Link>
          </div>
        )}
        <div className="mb-3 overflow-hidden rounded-2xl bg-white">
          <Image
            src="/assets/portal/empty-state-no-walks.png"
            alt="No walks scheduled illustration"
            width={1200}
            height={900}
            className="h-auto w-full"
          />
        </div>
        <form action={logoutAction.bind(null, tenant.slug)}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-stone-500 transition-colors hover:bg-white hover:text-stone-900"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  )
}
