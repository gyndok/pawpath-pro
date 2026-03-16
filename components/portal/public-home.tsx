'use client'

import Image from 'next/image'
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

export function PortalPublicHome() {
  const { tenant } = useTenant()

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-12 grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="text-center lg:text-left">
          <h1 className="mb-3 text-3xl font-bold">
            Welcome to {tenant.business_name}
          </h1>
          <p className="mb-6 text-gray-600">
            Professional dog walking services. GPS-tracked walks, photo reports,
            and easy online scheduling — all in one place.
          </p>
          <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link href={`/${tenant.slug}/portal/login`}>
              <Button className="bg-[#c66a2b] hover:bg-[#ad5821]">
                Sign In to Your Account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/${tenant.slug}/portal/register`}>
              <Button variant="outline">Create Account</Button>
            </Link>
          </div>
        </div>
        <Card className="overflow-hidden border-stone-200">
          <Image
            src="/assets/portal/pet-avatar-placeholder.png"
            alt="Pet portal illustration"
            width={1200}
            height={900}
            className="h-auto w-full"
            priority
          />
        </Card>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className="border-stone-200 bg-[#fcfaf7]">
          <CardContent className="flex items-center gap-3 p-4">
            <Image src="/assets/portal/map-pin-icon.png" alt="Map pin icon" width={64} height={64} className="h-12 w-12" />
            <div>
              <p className="text-sm font-medium text-stone-900">Walk updates</p>
              <p className="text-xs text-stone-500">Visit details and route summaries in one place</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-stone-200 bg-[#fcfaf7]">
          <CardContent className="flex items-center gap-3 p-4">
            <Image src="/assets/portal/mood-emoji-set.png" alt="Mood icons" width={64} height={64} className="h-12 w-12 rounded-lg object-cover" />
            <div>
              <p className="text-sm font-medium text-stone-900">Report cards</p>
              <p className="text-xs text-stone-500">Photos, notes, potty updates, and mood snapshots</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-stone-200 bg-[#fcfaf7]">
          <CardContent className="flex items-center gap-3 p-4">
            <Image src="/assets/portal/empty-state-no-pets.png" alt="Pets placeholder" width={64} height={64} className="h-12 w-12 rounded-lg object-cover" />
            <div>
              <p className="text-sm font-medium text-stone-900">Pet records</p>
              <p className="text-xs text-stone-500">Emergency info, routines, and care notes stay organized</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PORTAL_FEATURES.map(({ icon: Icon, title, desc }, index) => (
          <Card key={title} className="overflow-hidden transition-shadow hover:shadow-md">
            <div className="grid gap-4 p-0 md:grid-cols-[0.42fr_0.58fr]">
              <div className="bg-stone-50">
                <Image
                  src={
                    index === 0
                      ? '/assets/portal/empty-state-no-walks.png'
                      : index === 1
                        ? '/assets/website/walk-report-header.png'
                        : index === 2
                          ? '/assets/portal/empty-state-no-messages.png'
                          : '/assets/portal/empty-state-no-pets.png'
                  }
                  alt={title}
                  width={1200}
                  height={900}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-6">
                <CardHeader className="px-0 pb-2 pt-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-5 w-5 text-[#c66a2b]" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <p className="mb-3 text-sm text-gray-600">{desc}</p>
                  <span className="text-sm font-medium text-[#b45a21]">
                    Available in the next MVP release
                  </span>
                </CardContent>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Badge variant="secondary">Phase 1 scaffold — full portal features ship in Phase 3</Badge>
      </div>
    </div>
  )
}
