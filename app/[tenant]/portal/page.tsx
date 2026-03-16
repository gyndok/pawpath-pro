'use client'

import Link from 'next/link'
import { PawPrint, Calendar, FileText, CreditCard, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTenant } from '@/lib/context/tenant-context'

const PORTAL_FEATURES = [
  { icon: Calendar,   title: 'Book a Walk',  desc: 'Booking requests and approvals are part of the MVP rollout now in progress.' },
  { icon: FileText,   title: 'Walk Reports', desc: 'Completed visit summaries, photos, and notes will appear here.' },
  { icon: CreditCard, title: 'Billing',      desc: 'Invoice viewing and payment collection are being built into the client portal.' },
  { icon: PawPrint,   title: 'My Pets',      desc: 'Pet profiles, care notes, and vaccine details will live here.' },
]

export default function PortalHomePage() {
  const { tenant } = useTenant()

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-3">
          Welcome to {tenant.business_name}
        </h1>
        <p className="text-gray-600 mb-6">
          Professional dog walking services. GPS-tracked walks, photo reports,
          and easy online scheduling — all in one place.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href={`/${tenant.slug}/portal/login`}>
            <Button>
              Sign In to Your Account <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/${tenant.slug}/portal/register`}>
            <Button variant="outline">Create Account</Button>
          </Link>
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {PORTAL_FEATURES.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="h-5 w-5 text-violet-600" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{desc}</p>
              <span className="text-violet-600 text-sm font-medium">
                Available in the next MVP release
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Badge variant="secondary">Phase 1 scaffold — full portal features ship in Phase 3</Badge>
      </div>
    </div>
  )
}
