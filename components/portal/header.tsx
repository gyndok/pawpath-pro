'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useTenant } from '@/lib/context/tenant-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: 'portal',          label: 'Home' },
  { href: 'portal/pets',     label: 'My Pets' },
  { href: 'portal/waiver',   label: 'Waiver' },
  { href: 'portal/schedule', label: 'Schedule a Walk' },
  { href: 'portal/walks',    label: 'Walk Reports' },
  { href: 'portal/billing',  label: 'Billing' },
]

export function PortalHeader() {
  const { tenant } = useTenant()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const isDemo = tenant.slug === 'demo'

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link href={`/${tenant.slug}/portal`} className="flex items-center gap-2">
          {tenant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logo_url} alt={tenant.business_name} className="h-8 w-auto" />
          ) : (
            <div className="flex items-center gap-3">
              <Image
                src="/assets/brand/logo-full-color.png"
                alt="PawPath Pro"
                width={150}
                height={40}
                className="h-9 w-auto"
              />
              <span className="hidden text-sm font-medium text-stone-600 md:inline">{tenant.business_name}</span>
            </div>
          )}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const fullHref = `/${tenant.slug}/${href}`
            const isActive = pathname === fullHref
            return (
              <Link
                key={href}
                href={fullHref}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#fff4e8] text-[#b45a21]'
                    : 'text-stone-600 hover:bg-stone-100'
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Auth CTA */}
        <div className="hidden md:flex items-center gap-2">
          {isDemo && (
            <>
              <Link href={`/${tenant.slug}`}>
                <Button variant="outline" size="sm" className="border-stone-300">Demo Hub</Button>
              </Link>
              <Link href={`/${tenant.slug}/login`}>
                <Button variant="outline" size="sm" className="border-stone-300">Walker Side</Button>
              </Link>
            </>
          )}
          <Link href={`/${tenant.slug}/portal/login`}>
            <Button variant="outline" size="sm" className="border-stone-300">Sign In</Button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="space-y-1 border-t border-stone-200 bg-white px-4 py-3 md:hidden">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={`/${tenant.slug}/${href}`}
              className="block rounded-md px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          {isDemo && (
            <>
              <Link
                href={`/${tenant.slug}`}
                className="block rounded-md px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
                onClick={() => setMenuOpen(false)}
              >
                Demo Hub
              </Link>
              <Link
                href={`/${tenant.slug}/login`}
                className="block rounded-md px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
                onClick={() => setMenuOpen(false)}
              >
                Walker Side
              </Link>
            </>
          )}
          <Link href={`/${tenant.slug}/portal/login`} onClick={() => setMenuOpen(false)}>
            <Button variant="outline" size="sm" className="w-full mt-2">Sign In</Button>
          </Link>
        </div>
      )}
    </header>
  )
}
