'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PawPrint, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useTenant } from '@/lib/context/tenant-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: 'portal',          label: 'Home' },
  { href: 'portal/pets',     label: 'My Pets' },
  { href: 'portal/schedule', label: 'Schedule a Walk' },
  { href: 'portal/walks',    label: 'Walk Reports' },
  { href: 'portal/billing',  label: 'Billing' },
]

export function PortalHeader() {
  const { tenant } = useTenant()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link href={`/${tenant.slug}/portal`} className="flex items-center gap-2">
          {tenant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logo_url} alt={tenant.business_name} className="h-8 w-auto" />
          ) : (
            <div className="flex items-center gap-2">
              <PawPrint className="h-5 w-5" style={{ color: tenant.branding_primary_color }} />
              <span className="font-bold">{tenant.business_name}</span>
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
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Auth CTA */}
        <div className="hidden md:flex items-center gap-2">
          <Link href={`/${tenant.slug}/portal/login`}>
            <Button variant="outline" size="sm">Sign In</Button>
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
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={`/${tenant.slug}/${href}`}
              className="block px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <Link href={`/${tenant.slug}/portal/login`} onClick={() => setMenuOpen(false)}>
            <Button variant="outline" size="sm" className="w-full mt-2">Sign In</Button>
          </Link>
        </div>
      )}
    </header>
  )
}
