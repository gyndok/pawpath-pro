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
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col border-r border-[#d6e4ec] bg-[linear-gradient(180deg,#ecf5fa_0%,#dbeaf3_100%)]">
      <div className="border-b border-[#d6e4ec] p-5">
        <Link href={`/${tenant.slug}/portal`} className="flex items-center gap-3">
          <div className="overflow-hidden rounded-2xl border border-[rgba(47,111,143,0.14)] bg-white shadow-[0_16px_34px_rgba(20,48,66,0.08)]">
            <ProfilePhoto
              src={clientProfile?.photo_url || tenant.logo_url}
              alt={`${clientProfile?.full_name || tenant.business_name} photo`}
              name={clientProfile?.full_name || tenant.business_name}
              className="h-14 w-14"
              fallbackClassName="text-base"
              fallback={<UserRound className="h-6 w-6 text-[#2f6f8f]" />}
            />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight text-[#143042]">{clientProfile?.full_name || tenant.business_name}</div>
            <div className="text-xs text-[#5d7a89]">{clientProfile ? 'Client portal' : tenant.business_name}</div>
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
              prefetch={false}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-white text-[#143042] shadow-[0_18px_40px_-22px_rgba(20,48,66,0.45)]'
                  : 'text-[#55717f] hover:bg-white/85 hover:text-[#143042]'
              )}
            >
              <span
                className={cn(
                  'absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-colors',
                  isActive ? 'bg-[#2f6f8f]' : 'bg-transparent group-hover:bg-[#bdd4df]'
                )}
              />
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                  isActive ? 'bg-[#edf6fb] text-[#2f6f8f]' : 'bg-transparent text-[#63808f] group-hover:bg-[#eef5f9] group-hover:text-[#143042]'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
              </span>
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-[#d6e4ec] p-3">
        {isDemo && (
          <div className="mb-3 rounded-2xl border border-[#c9dde8] bg-[rgba(255,255,255,0.78)] p-3 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6a8594]">Demo Navigation</p>
            <div className="space-y-2">
              <Link
                href={`/${tenant.slug}`}
                prefetch={false}
                className="block rounded-xl border border-[#d6e4ec] bg-white px-3 py-2 text-sm font-medium text-[#143042] transition-colors hover:bg-[#f5fbfe]"
              >
                Demo Hub
              </Link>
              <Link
                href={`/${tenant.slug}/dashboard`}
                prefetch={false}
                className="block rounded-xl border border-[#d6e4ec] bg-white px-3 py-2 text-sm font-medium text-[#143042] transition-colors hover:bg-[#f5fbfe]"
              >
                Walker Side
              </Link>
            </div>
          </div>
        )}

        <div className="mb-3 overflow-hidden rounded-2xl border border-[#d6e4ec] bg-white shadow-[0_16px_34px_rgba(20,48,66,0.08)]">
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
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#55717f] transition-colors hover:bg-white/85 hover:text-[#143042]"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  )
}
