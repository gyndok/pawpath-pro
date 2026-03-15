'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  MessageSquare,
  Settings,
  PawPrint,
  LogOut,
} from 'lucide-react'
import { logoutAction } from '@/lib/actions/auth'
import { useTenant } from '@/lib/context/tenant-context'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: 'schedule',   label: 'Schedule',   icon: Calendar },
  { href: 'clients',    label: 'Clients',    icon: Users },
  { href: 'billing',    label: 'Billing',    icon: DollarSign },
  { href: 'messages',   label: 'Messages',   icon: MessageSquare },
  { href: 'settings',   label: 'Settings',   icon: Settings },
]

export function WalkerSidebar() {
  const pathname = usePathname()
  const { tenant } = useTenant()

  return (
    <aside className="w-60 shrink-0 bg-white border-r h-screen flex flex-col sticky top-0">
      {/* Brand */}
      <div className="p-5 border-b">
        <div className="flex items-center gap-2">
          <PawPrint className="h-5 w-5 text-violet-600" />
          <div>
            <div className="font-bold text-sm leading-tight">{tenant.business_name}</div>
            <div className="text-xs text-gray-400 capitalize">{tenant.plan_tier} plan</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const fullHref = `/${tenant.slug}/${href}`
          const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`)
          return (
            <Link
              key={href}
              href={fullHref}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t">
        <form action={logoutAction.bind(null, tenant.slug)}>
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 w-full transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  )
}
