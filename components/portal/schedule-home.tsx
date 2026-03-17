'use client'

import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookingRequestForm } from '@/components/portal/booking-request-form'

type PetOption = {
  id: string
  name: string
}

type ServiceOption = {
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

export function PortalScheduleHome({
  pets,
  services,
  bookings,
  availableDatesByService,
  geofenceMessage,
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
}) {
  const params = useParams<{ tenant: string }>()

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Schedule a Walk</h1>
        <p className="text-sm text-stone-500">Send a booking request for approval.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle>New booking request</CardTitle>
            <CardDescription>Only currently open slots are shown. The walker will approve or decline this request.</CardDescription>
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

        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle>Recent requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!bookings.length ? (
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
