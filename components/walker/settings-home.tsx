'use client'

import { useActionState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createServiceAction } from '@/lib/actions/walker-services'
import { addBlockedDateAction, saveAvailabilityAction, saveBookingSettingsAction } from '@/lib/actions/walker-scheduling'
import type { BookingSettings } from '@/lib/scheduling'

type ServiceSummary = {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  base_price: number
  is_active: boolean
}

type AvailabilitySummary = {
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

type BlockedDateSummary = {
  id: string
  start_date: string
  end_date: string
  reason: string | null
}

const WEEK_DAYS = [
  { day: 0, label: 'Sunday' },
  { day: 1, label: 'Monday' },
  { day: 2, label: 'Tuesday' },
  { day: 3, label: 'Wednesday' },
  { day: 4, label: 'Thursday' },
  { day: 5, label: 'Friday' },
  { day: 6, label: 'Saturday' },
]

export function WalkerSettingsHome({
  services,
  activeWaiverTitle,
  availability,
  blockedDates,
  bookingSettings,
}: {
  services: ServiceSummary[]
  activeWaiverTitle: string | null
  availability: AvailabilitySummary[]
  blockedDates: BlockedDateSummary[]
  bookingSettings: BookingSettings
}) {
  const params = useParams<{ tenant: string }>()
  const [serviceState, serviceAction, servicePending] = useActionState(createServiceAction.bind(null, params.tenant), {})
  const [availabilityState, availabilityAction, availabilityPending] = useActionState(saveAvailabilityAction.bind(null, params.tenant), {})
  const [bookingState, bookingAction, bookingPending] = useActionState(saveBookingSettingsAction.bind(null, params.tenant), {})
  const [blockedDateState, blockedDateAction, blockedDatePending] = useActionState(addBlockedDateAction.bind(null, params.tenant), {})
  const availabilityByDay = new Map(availability.map((row) => [row.day_of_week, row]))

  return (
    <div className="max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-stone-500">Configure services, booking rules, service area, and when clients can request walks.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle>Add a service</CardTitle>
            <CardDescription>Create the walk types that appear in the client portal booking flow.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={serviceAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Service name</Label>
                <Input id="name" name="name" placeholder="30-minute midday walk" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <textarea id="description" name="description" rows={4} className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" placeholder="Ideal for lunchtime potty breaks and neighborhood walks." />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                  <Input id="duration_minutes" name="duration_minutes" type="number" min="1" step="1" placeholder="30" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="base_price">Base price ($)</Label>
                  <Input id="base_price" name="base_price" type="number" min="1" step="0.01" placeholder="25.00" required />
                </div>
              </div>

              {serviceState.error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{serviceState.error}</div>}
              {serviceState.success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Service added successfully.</div>}

              <Button type="submit" className="bg-[#c66a2b] hover:bg-[#ad5821]" disabled={servicePending}>
                {servicePending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Add service'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Active services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!services.length ? (
                <p className="text-sm text-stone-500">No services configured yet.</p>
              ) : (
                services.map((service) => (
                  <div key={service.id} className="rounded-xl border border-stone-200 p-4 text-sm text-stone-600">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-stone-900">{service.name}</p>
                        <p>{service.duration_minutes} minutes · ${service.base_price.toFixed(2)}</p>
                      </div>
                      <Badge variant="secondary">{service.is_active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    {service.description && <p className="mt-2">{service.description}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Booking settings</CardTitle>
              <CardDescription>Set travel buffers, booking window, same-day rules, and your service area.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={bookingAction} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="travel_buffer_minutes">Travel buffer (minutes)</Label>
                    <Input id="travel_buffer_minutes" name="travel_buffer_minutes" type="number" min="0" max="180" defaultValue={bookingSettings.travel_buffer_minutes} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="slot_interval_minutes">Slot interval (minutes)</Label>
                    <Input id="slot_interval_minutes" name="slot_interval_minutes" type="number" min="5" max="120" defaultValue={bookingSettings.slot_interval_minutes} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="advance_window_days">Advance window (days)</Label>
                    <Input id="advance_window_days" name="advance_window_days" type="number" min="1" max="120" defaultValue={bookingSettings.advance_window_days} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="service_area_zip_codes">Service area ZIP codes</Label>
                  <Input id="service_area_zip_codes" name="service_area_zip_codes" placeholder="77007, 77008, 77019" defaultValue={bookingSettings.service_area_zip_codes.join(', ')} />
                  <p className="text-xs text-stone-500">Clients outside these ZIP codes will be blocked from self-service booking. Leave blank to allow all areas.</p>
                </div>
                <label className="flex items-center gap-3 text-sm text-stone-700">
                  <input type="checkbox" name="allow_same_day_booking" defaultChecked={bookingSettings.allow_same_day_booking} />
                  <span>Allow same-day booking requests if a slot is still open</span>
                </label>

                {bookingState.error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{bookingState.error}</div>}
                {bookingState.success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Booking settings updated.</div>}

                <Button type="submit" variant="outline" disabled={bookingPending}>
                  {bookingPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Save booking settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle>Weekly availability</CardTitle>
            <CardDescription>Publish the days and times clients can request. Travel buffers are applied automatically when slots are generated.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={availabilityAction} className="space-y-4">
              <div className="space-y-3">
                {WEEK_DAYS.map(({ day, label }) => {
                  const row = availabilityByDay.get(day)
                  return (
                    <div key={day} className="grid gap-3 rounded-xl border border-stone-200 p-4 md:grid-cols-[1fr_160px_160px] md:items-center">
                      <label className="flex items-center gap-3 text-sm font-medium text-stone-800">
                        <input type="checkbox" name={`day_${day}_active`} defaultChecked={row?.is_active ?? false} />
                        <span>{label}</span>
                      </label>
                      <div className="space-y-1.5">
                        <Label htmlFor={`day_${day}_start`}>Start</Label>
                        <Input id={`day_${day}_start`} name={`day_${day}_start`} type="time" defaultValue={row?.start_time?.slice(0, 5) ?? '09:00'} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`day_${day}_end`}>End</Label>
                        <Input id={`day_${day}_end`} name={`day_${day}_end`} type="time" defaultValue={row?.end_time?.slice(0, 5) ?? '17:00'} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {availabilityState.error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{availabilityState.error}</div>}
              {availabilityState.success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Availability updated.</div>}

              <Button type="submit" variant="outline" disabled={availabilityPending}>
                {availabilityPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Save availability'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Blocked dates</CardTitle>
              <CardDescription>Mark vacations, blackout days, or temporary periods when no client should be able to request a walk.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={blockedDateAction} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="start_date">Start date</Label>
                    <Input id="start_date" name="start_date" type="date" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="end_date">End date</Label>
                    <Input id="end_date" name="end_date" type="date" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reason">Reason</Label>
                  <Input id="reason" name="reason" placeholder="Vacation, training day, holiday" />
                </div>

                {blockedDateState.error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{blockedDateState.error}</div>}
                {blockedDateState.success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Blocked date added.</div>}

                <Button type="submit" variant="outline" disabled={blockedDatePending}>
                  {blockedDatePending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Add blocked date'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Upcoming blackout periods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!blockedDates.length ? (
                <p className="text-sm text-stone-500">No blocked dates on file.</p>
              ) : (
                blockedDates.map((item) => (
                  <div key={item.id} className="rounded-xl border border-stone-200 p-4 text-sm text-stone-600">
                    <p className="font-medium text-stone-900">
                      {item.start_date} → {item.end_date}
                    </p>
                    <p className="mt-1">{item.reason || 'Unavailable'}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Waiver template</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-stone-600">
              <p>Current active waiver:</p>
              <p className="mt-2 font-medium text-stone-900">{activeWaiverTitle || 'No active waiver configured'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
