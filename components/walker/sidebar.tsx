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
  Camera,
} from 'lucide-react'
import { logoutAction } from '@/lib/actions/auth'
import { ProfilePhoto } from '@/components/shared/profile-photo'
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
  const { tenant, walkerProfile } = useTenant()
  const isDemo = tenant.slug === 'demo'

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-stone-200 bg-[#f5efe6]">
      {/* Brand */}
      <div className="border-b border-stone-200 p-5">
        <div className="flex items-center gap-3">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <ProfilePhoto
              src={walkerProfile?.photo_url || tenant.logo_url}
              alt={`${tenant.business_name} walker photo`}
              name={tenant.business_name}
              className="h-14 w-14"
              fallbackClassName="text-base"
              fallback={<Camera className="h-6 w-6 text-[#b45a21]" />}
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
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-white text-[#9b4d1c] shadow-[0_12px_30px_-18px_rgba(180,90,33,0.65)]'
                  : 'text-stone-600 hover:bg-white hover:text-stone-900'
              )}
            >
              <span
                className={cn(
                  'absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-colors',
                  isActive ? 'bg-[#c66a2b]' : 'bg-transparent group-hover:bg-stone-200'
                )}
              />
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                  isActive ? 'bg-[#fff4e8] text-[#b45a21]' : 'bg-transparent text-stone-500 group-hover:bg-stone-100 group-hover:text-stone-800'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
              </span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-stone-200 p-3">
        {isDemo && (
          <div className="mb-3 rounded-2xl border border-[#e7c6a8] bg-[#fff6ed] p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Demo Navigation</p>
            <div className="space-y-2">
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
