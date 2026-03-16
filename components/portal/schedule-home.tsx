'use client'

import { useActionState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requestBookingAction } from '@/lib/actions/client-booking'

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
}: {
  pets: PetOption[]
  services: ServiceOption[]
  bookings: BookingSummary[]
}) {
  const params = useParams<{ tenant: string }>()
  const [state, formAction, isPending] = useActionState(requestBookingAction.bind(null, params.tenant), {})

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
            <CardDescription>The walker will approve or decline this request.</CardDescription>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-200 p-4 text-sm text-stone-500">
                No services are available yet.
              </div>
            ) : (
              <form action={formAction} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium text-stone-800">Service</span>
                    <select name="service_id" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" required>
                      <option value="">Select a service</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} · {service.duration_minutes} min · ${service.base_price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium text-stone-800">Pets</span>
                    <div className="rounded-md border border-input p-3">
                      <div className="space-y-2">
                        {pets.map((pet, index) => (
                          <label key={pet.id} className="flex items-center gap-2 text-sm text-stone-700">
                            <input type="checkbox" name="pet_ids" value={pet.id} defaultChecked={index === 0} />
                            <span>{pet.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </label>
                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium text-stone-800">Date</span>
                    <input type="date" name="date" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" required />
                  </label>
                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium text-stone-800">Time</span>
                    <input type="time" name="time" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" required />
                  </label>
                </div>
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-stone-800">Notes</span>
                  <textarea name="notes" rows={4} className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" placeholder="Anything important for the walker to know for this visit" />
                </label>

                {state.error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</div>}
                {state.success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Booking request submitted successfully.</div>}

                <Button type="submit" className="bg-[#c66a2b] hover:bg-[#ad5821]" disabled={isPending || pets.length === 0}>
                  {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending request…</> : 'Request booking'}
                </Button>
              </form>
            )}
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
