'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardCheck, CreditCard, Dog, Home, LogOut, CalendarDays, FileText, UserRound } from 'lucide-react'
import { logoutClientAction } from '@/lib/actions/auth'
import { ProfilePhoto } from '@/components/shared/profile-photo'
import { useTenant } from '@/lib/context/tenant-context'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: 'portal', label: 'Home', icon: Home },
  { href: 'portal/pets', label: 'My Pets', icon: Dog },
  { href: 'portal/waiver', label: 'Waiver', icon: ClipboardCheck },
  { href: 'portal/schedule', label: 'Schedule a Walk', icon: CalendarDays },
  { href: 'portal/walks', label: 'Walk Reports', icon: FileText },
  { href: 'portal/billing', label: 'Billing', icon: CreditCard },
]

export function PortalSidebar() {
  const pathname = usePathname()
  const { tenant, clientProfile } = useTenant()
  const isDemo = tenant.slug === 'demo'

  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col border-r border-stone-200 bg-[#f8f2e9]">
      <div className="border-b border-stone-200 p-5">
        <Link href={`/${tenant.slug}/portal`} className="flex items-center gap-3">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <ProfilePhoto
              src={clientProfile?.photo_url || tenant.logo_url}
              alt={`${clientProfile?.full_name || tenant.business_name} photo`}
              name={clientProfile?.full_name || tenant.business_name}
              className="h-14 w-14"
              fallbackClassName="text-base"
              fallback={<UserRound className="h-6 w-6 text-[#b45a21]" />}
            />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight text-stone-900">{clientProfile?.full_name || tenant.business_name}</div>
            <div className="text-xs text-stone-500">{clientProfile ? 'Client portal' : tenant.business_name}</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
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
                href={`/${tenant.slug}/dashboard`}
                className="block rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
              >
                Walker Side
              </Link>
            </div>
          </div>
        )}

        <div className="mb-3 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <Image
            src="/assets/portal/empty-state-no-walks.png"
            alt="Client portal artwork"
            width={1200}
            height={900}
            className="h-auto w-full"
          />
        </div>

        <form action={logoutClientAction.bind(null, tenant.slug)}>
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
