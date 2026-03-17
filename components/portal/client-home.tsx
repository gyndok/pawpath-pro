'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, CheckCircle2, CreditCard, FileText, PawPrint, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookingRequestForm } from '@/components/portal/booking-request-form'

type PetSummary = {
  id: string
  name: string
  breed: string | null
  behavior_notes: string | null
  special_notes: string | null
  allergies: string | null
}

type ServiceSummary = {
  id: string
  name: string
  duration_minutes: number
  base_price: number
}

type BookingSummary = {
  id: string
  scheduled_at: string
  status: string
  service_name: string
}

export function ClientPortalHome({
  tenantSlug,
  clientName,
  pets,
  services,
  hasSignedWaiver,
  activeWaiverTitle,
  bookings,
  availableDatesByService,
  geofenceMessage,
}: {
  tenantSlug: string
  clientName: string
  pets: PetSummary[]
  services: ServiceSummary[]
  hasSignedWaiver: boolean
  activeWaiverTitle: string | null
  bookings: BookingSummary[]
  availableDatesByService: Record<string, Array<{
    date: string
    label: string
    slots: Array<{ iso: string; date: string; time: string; label: string }>
  }>>
  geofenceMessage?: string | null
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <Badge variant="secondary" className="mb-4">Client dashboard</Badge>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {clientName}.</h1>
          <p className="mt-3 max-w-2xl text-stone-600">
            Your pet profile, waiver status, and booking requests all live here. This is the first step toward a full client portal workflow.
          </p>
        </div>
        <Card className="overflow-hidden border-stone-200">
          <Image
            src={pets.length === 0 ? '/assets/portal/empty-state-no-pets.png' : '/assets/brand/mascot-dog.png'}
            alt="Portal overview illustration"
            width={1200}
            height={900}
            className="h-auto w-full bg-[#fff8f0] object-contain p-8"
            priority
          />
        </Card>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Link href={`/${tenantSlug}/portal/pets`}>
          <Card className="border-stone-200 bg-[#fcfaf7] transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-3 p-4">
            <PawPrint className="h-10 w-10 rounded-xl bg-white p-2 text-[#c66a2b]" />
            <div>
              <p className="text-sm font-medium text-stone-900">Pets on file</p>
              <p className="text-xs text-stone-500">{pets.length} profile{pets.length === 1 ? '' : 's'} saved</p>
            </div>
          </CardContent>
          </Card>
        </Link>
        <Link href={`/${tenantSlug}/portal/waiver`}>
          <Card className="border-stone-200 bg-[#fcfaf7] transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-3 p-4">
            {hasSignedWaiver ? (
              <CheckCircle2 className="h-10 w-10 rounded-xl bg-white p-2 text-green-600" />
            ) : (
              <ShieldAlert className="h-10 w-10 rounded-xl bg-white p-2 text-amber-600" />
            )}
            <div>
              <p className="text-sm font-medium text-stone-900">Waiver status</p>
              <p className="text-xs text-stone-500">{hasSignedWaiver ? 'Signed and on file' : 'Needs attention before first walk'}</p>
            </div>
          </CardContent>
          </Card>
        </Link>
        <Link href={`/${tenantSlug}/portal/schedule`}>
          <Card className="border-stone-200 bg-[#fcfaf7] transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-3 p-4">
            <CalendarDays className="h-10 w-10 rounded-xl bg-white p-2 text-sky-600" />
            <div>
              <p className="text-sm font-medium text-stone-900">Upcoming requests</p>
              <p className="text-xs text-stone-500">{bookings.length} pending or scheduled</p>
            </div>
          </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-[#c66a2b]" />
              Pet profile
            </CardTitle>
            <CardDescription>Your pet information sheet is stored here for the walker.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-200 p-4 text-sm text-stone-500">
                No pet profile found yet.
              </div>
            ) : (
              pets.map((pet) => (
                <div key={pet.id} className="rounded-xl border border-stone-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-stone-900">{pet.name}</h3>
                      <p className="text-sm text-stone-500">{pet.breed || 'Breed not provided'}</p>
                    </div>
                    <Badge variant="secondary">On file</Badge>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-stone-600">
                    <div>
                      <p className="font-medium text-stone-800">Behavior notes</p>
                      <p>{pet.behavior_notes || 'No behavior notes provided yet.'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-stone-800">Allergies / health</p>
                      <p>{pet.allergies || 'No allergies listed.'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-stone-800">Handling notes</p>
                      <p>{pet.special_notes || 'No additional handling notes yet.'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#c66a2b]" />
                Waiver and service agreement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
                <p className="font-medium text-stone-900">{activeWaiverTitle || 'Service agreement and liability waiver'}</p>
                <p className="mt-2">
                  {hasSignedWaiver
                    ? 'Your signed acknowledgment is on file.'
                    : 'Your account exists, but the active waiver is not yet signed. Booking should remain limited until this is completed.'}
                </p>
                <div className="mt-4">
                  <Link href={`/${tenantSlug}/portal/waiver`}>
                    <Button variant="outline" size="sm">{hasSignedWaiver ? 'Review waiver' : 'Review and sign waiver'}</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-[#c66a2b]" />
                Request a walk
              </CardTitle>
              <CardDescription>Select from currently open dates and times based on the walker&apos;s published schedule.</CardDescription>
            </CardHeader>
            <CardContent>
              <BookingRequestForm
                tenantSlug={tenantSlug}
                pets={pets.map((pet) => ({ id: pet.id, name: pet.name }))}
                services={services}
                availableDatesByService={availableDatesByService}
                geofenceMessage={geofenceMessage}
              />
            </CardContent>
          </Card>

          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#c66a2b]" />
                Booking activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bookings.length === 0 ? (
                <p className="text-sm text-stone-500">No requests submitted yet.</p>
              ) : (
                bookings.map((booking) => (
                  <div key={booking.id} className="rounded-xl border border-stone-200 p-4 text-sm text-stone-600">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-stone-900">{booking.service_name}</p>
                        <p>{new Date(booking.scheduled_at).toLocaleString()}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">{booking.status}</Badge>
                    </div>
                  </div>
                ))
              )}
              <div className="pt-2">
                <div className="flex flex-wrap gap-2">
                  <Link href={`/${tenantSlug}/portal/walks`}>
                    <Button variant="outline" size="sm">View walk reports</Button>
                  </Link>
                  <Link href={`/${tenantSlug}/portal/billing`}>
                    <Button variant="outline" size="sm">View billing</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
