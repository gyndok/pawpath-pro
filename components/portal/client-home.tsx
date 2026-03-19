'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, CheckCircle2, CreditCard, FileText, PawPrint, ShieldAlert, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookingRequestForm } from '@/components/portal/booking-request-form'
import { ProfilePhoto } from '@/components/shared/profile-photo'

type PetSummary = {
  id: string
  name: string
  photo_url?: string | null
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
  clientPhotoUrl,
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
  clientPhotoUrl?: string | null
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
    <div className="kinetic-shell mx-auto max-w-7xl px-4 py-10">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
        <section className="kinetic-card rounded-[2rem] p-8">
          <Badge className="kinetic-pill mb-4 px-4 py-2 shadow-none">Client dashboard</Badge>
          <div className="flex items-center gap-4">
            <div className="overflow-hidden rounded-[1.6rem] border border-[rgba(115,118,134,0.15)] bg-white shadow-sm">
              <ProfilePhoto
                src={clientPhotoUrl}
                alt={`${clientName} profile photo`}
                name={clientName}
                className="h-[72px] w-[72px]"
                fallbackClassName="text-lg"
                fallback={<UserRound className="h-7 w-7 text-[#003fb1]" />}
              />
            </div>
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#9d4300]">Owner account</p>
              <p className="mt-1 text-sm text-stone-500">Bookings, waivers, pet notes, and payments all in one place.</p>
            </div>
          </div>
          <h1 className="section-title mt-6 text-4xl">Welcome back, {clientName}.</h1>
          <p className="editorial-subtitle mt-5 max-w-2xl">
            Your pack, your paperwork, and your upcoming walks live here. This portal keeps the owner side clear, polished, and easy to trust.
          </p>
        </section>

        <Card className="kinetic-card overflow-hidden rounded-[2rem] border-stone-200 shadow-none">
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

      <div className="mb-8 mt-6 grid gap-4 md:grid-cols-3">
        <Link href={`/${tenantSlug}/portal/pets`} prefetch={false}>
          <Card className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-3 p-4">
            <PawPrint className="h-10 w-10 rounded-xl bg-white p-2 text-[#2f6f8f]" />
            <div>
              <p className="text-sm font-medium text-stone-900">Pets on file</p>
              <p className="text-xs text-stone-500">{pets.length} profile{pets.length === 1 ? '' : 's'} saved</p>
            </div>
          </CardContent>
          </Card>
        </Link>
        <Link href={`/${tenantSlug}/portal/waiver`} prefetch={false}>
          <Card className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] transition-shadow hover:shadow-md">
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
        <Link href={`/${tenantSlug}/portal/schedule`} prefetch={false}>
          <Card className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] transition-shadow hover:shadow-md">
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

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 font-[var(--font-display)] text-2xl tracking-tight">
              <PawPrint className="h-5 w-5 text-[#2f6f8f]" />
              Pet profile
            </CardTitle>
            <CardDescription className="mt-2 text-sm leading-6 text-stone-600">Your pet information sheet is stored here for the walker.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pets.length === 0 ? (
              <div className="kinetic-card-soft rounded-[1.35rem] border border-dashed border-[rgba(115,118,134,0.22)] p-5 text-sm text-stone-500">
                No pet profile found yet.
              </div>
            ) : (
              pets.map((pet) => (
                <div key={pet.id} className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="overflow-hidden rounded-2xl border border-[rgba(115,118,134,0.15)] bg-white shadow-sm">
                        <ProfilePhoto
                          src={pet.photo_url}
                          alt={`${pet.name} photo`}
                          name={pet.name}
                          className="h-14 w-14"
                          fallbackClassName="text-base"
                          fallback={<PawPrint className="h-5 w-5 text-[#2f6f8f]" />}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-stone-900">{pet.name}</h3>
                        <p className="text-sm text-stone-500">{pet.breed || 'Breed not provided'}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">On file</Badge>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-stone-600">
                    <div>
                      <p className="font-medium text-stone-800">Behavior notes</p>
                      <p className="mt-1 leading-6">{pet.behavior_notes || 'No behavior notes provided yet.'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-stone-800">Allergies / health</p>
                      <p className="mt-1 leading-6">{pet.allergies || 'No allergies listed.'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-stone-800">Handling notes</p>
                      <p className="mt-1 leading-6">{pet.special_notes || 'No additional handling notes yet.'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 font-[var(--font-display)] text-2xl tracking-tight">
                <FileText className="h-5 w-5 text-[#2f6f8f]" />
                Waiver and service agreement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5 text-sm text-stone-600">
                <p className="font-medium text-stone-900">{activeWaiverTitle || 'Service agreement and liability waiver'}</p>
                <p className="mt-3 leading-6">
                  {hasSignedWaiver
                    ? 'Your signed acknowledgment is on file.'
                    : 'Your account exists, but the active waiver is not yet signed. Booking should remain limited until this is completed.'}
                </p>
                <div className="mt-4">
                  <Link href={`/${tenantSlug}/portal/waiver`} prefetch={false}>
                    <Button variant="outline" size="sm" className="rounded-full border-[#c9dde8] text-[#143042] hover:bg-[#f5fbfe]">{hasSignedWaiver ? 'Review waiver' : 'Review and sign waiver'}</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 font-[var(--font-display)] text-2xl tracking-tight">
                <CalendarDays className="h-5 w-5 text-[#2f6f8f]" />
                Request a walk
              </CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-stone-600">Select from currently open dates and times based on the walker&apos;s published schedule.</CardDescription>
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

          <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 font-[var(--font-display)] text-2xl tracking-tight">
                <CreditCard className="h-5 w-5 text-[#2f6f8f]" />
                Booking activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
            {bookings.length === 0 ? (
              <p className="text-sm text-stone-500">No requests submitted yet.</p>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5 text-sm text-stone-600">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-stone-900">{booking.service_name}</p>
                      <p className="mt-1">{new Date(booking.scheduled_at).toLocaleString()}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{booking.status}</Badge>
                  </div>
                  </div>
                ))
              )}
              <div className="pt-2">
                <div className="flex flex-wrap gap-2">
                  <Link href={`/${tenantSlug}/portal/walks`} prefetch={false}>
                    <Button variant="outline" size="sm" className="rounded-full border-[#c9dde8] text-[#143042] hover:bg-[#f5fbfe]">View walk reports</Button>
                  </Link>
                  <Link href={`/${tenantSlug}/portal/billing`} prefetch={false}>
                    <Button variant="outline" size="sm" className="rounded-full border-[#c9dde8] text-[#143042] hover:bg-[#f5fbfe]">View billing</Button>
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
