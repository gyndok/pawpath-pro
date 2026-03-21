'use client'

import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookingRequestForm } from '@/components/portal/booking-request-form'
import { formatDateTimeInTimeZone } from '@/lib/datetime'

type PetOption = {
  id: string
  name: string
  meet_and_greet_completed_at?: string | null
}

type ServiceOption = {
  id: string
  name: string
  duration_minutes: number
  base_price: number
  service_kind?: string | null
}

type BookingSummary = {
  id: string
  scheduled_at: string
  status: string
  service_name: string
}

export function PortalScheduleHome({
  pets,
  services,
  bookings,
  availableDatesByService,
  geofenceMessage,
  timeZone,
}: {
  pets: PetOption[]
  services: ServiceOption[]
  bookings: BookingSummary[]
  availableDatesByService: Record<string, Array<{
    date: string
    label: string
    slots: Array<{ iso: string; date: string; time: string; label: string }>
  }>>
  geofenceMessage?: string | null
  timeZone: string
}) {
  const params = useParams<{ tenant: string }>()

  return (
    <div className="kinetic-shell mx-auto max-w-7xl px-4 py-10">
      <div className="kinetic-card mb-6 rounded-[2rem] p-8">
        <Badge className="kinetic-pill mb-4 px-4 py-2 shadow-none">Scheduling</Badge>
        <h1 className="section-title text-4xl">Schedule a walk.</h1>
        <p className="editorial-subtitle mt-5 max-w-2xl">
          Choose from open times only. The walker&apos;s availability, travel buffers, and service area rules are already reflected here.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
        <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">New booking request</CardTitle>
            <CardDescription className="mt-2 text-sm leading-6 text-stone-600">Only currently open slots are shown. The walker will approve or decline this request.</CardDescription>
          </CardHeader>
          <CardContent>
            <BookingRequestForm
              tenantSlug={params.tenant}
              pets={pets}
              services={services}
              availableDatesByService={availableDatesByService}
              geofenceMessage={geofenceMessage}
            />
          </CardContent>
        </Card>

        <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">Recent requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!bookings.length ? (
              <div className="kinetic-card-soft rounded-[1.35rem] border border-dashed border-[rgba(115,118,134,0.22)] p-5">
                <p className="text-sm font-semibold text-stone-900">No requests submitted yet.</p>
                <p className="mt-2 text-sm leading-6 text-stone-500">Once you request a walk, status updates will appear here.</p>
              </div>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5 text-sm text-stone-600">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-stone-900">{booking.service_name}</p>
                      <p className="mt-1">{formatDateTimeInTimeZone(booking.scheduled_at, timeZone)}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{booking.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
