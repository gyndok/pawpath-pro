'use client'

import { useActionState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WalkerProfileCard } from '@/components/walker/walker-profile-card'
import { createServiceAction } from '@/lib/actions/walker-services'
import { addBlockedDateAction, saveAvailabilityAction, saveBookingSettingsAction } from '@/lib/actions/walker-scheduling'
import { COMMON_TIME_ZONES } from '@/lib/datetime'
import { getServiceKindLabel } from '@/lib/service-eligibility'
import type { BookingSettings } from '@/lib/scheduling'

type ServiceSummary = {
  id: string
  name: string
  description: string | null
  service_kind: string
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
  { day: 0, label: 'Sunday', short: 'S' },
  { day: 1, label: 'Monday', short: 'M' },
  { day: 2, label: 'Tuesday', short: 'T' },
  { day: 3, label: 'Wednesday', short: 'W' },
  { day: 4, label: 'Thursday', short: 'T' },
  { day: 5, label: 'Friday', short: 'F' },
  { day: 6, label: 'Saturday', short: 'S' },
]

export function WalkerSettingsHome({
  businessName,
  timeZone,
  services,
  activeWaiverTitle,
  walkerPhotoUrl,
  availability,
  blockedDates,
  bookingSettings,
}: {
  businessName: string
  timeZone: string
  services: ServiceSummary[]
  activeWaiverTitle: string | null
  walkerPhotoUrl: string | null
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
  const activeAvailabilityDays = availability.filter((row) => row.is_active).length

  return (
    <div className="kinetic-shell max-w-7xl p-6 lg:p-8">
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <section className="kinetic-card rounded-[2rem] p-8">
          <Badge className="kinetic-pill mb-4 px-4 py-2 shadow-none">
            Availability and booking controls
          </Badge>
          <h1 className="section-title text-4xl">
            Shape the calendar clients are actually allowed to book.
          </h1>
          <p className="editorial-subtitle mt-5 max-w-2xl">
            {businessName} can publish services, define weekly flow, add blackout dates, and control service territory from one operating surface.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#9d4300]">Services</p>
              <p className="mt-3 text-4xl font-black tracking-tight text-stone-950">{services.length}</p>
              <p className="mt-2 text-sm leading-6 text-stone-500">Active walk types clients can request.</p>
            </div>
            <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#9d4300]">Weekly flow</p>
              <p className="mt-3 text-4xl font-black tracking-tight text-stone-950">{activeAvailabilityDays}</p>
              <p className="mt-2 text-sm leading-6 text-stone-500">Active days currently published to clients.</p>
            </div>
            <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#9d4300]">Service area</p>
              <p className="mt-3 text-2xl font-black tracking-tight text-stone-950">
                {bookingSettings.service_area_zip_codes.length ? `${bookingSettings.service_area_zip_codes.length} ZIPs` : 'Open'}
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-500">Booking territory, windows, and same-day policy live here.</p>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <WalkerProfileCard
            tenantSlug={params.tenant}
            businessName={businessName}
            photoUrl={walkerPhotoUrl}
          />

          <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">Waiver template</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-stone-600">The current agreement owners will review and sign before requesting services.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5 text-sm text-stone-600">
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#9d4300]">Active waiver</p>
                <p className="mt-3 font-semibold text-stone-900">{activeWaiverTitle || 'No active waiver configured'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">Add a service</CardTitle>
            <CardDescription className="mt-2 text-sm leading-6 text-stone-600">Create the walk types that appear in the client portal booking flow.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={serviceAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Service name</Label>
                <Input id="name" name="name" placeholder="30-minute midday walk" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="service_kind">Service type</Label>
                <select
                  id="service_kind"
                  name="service_kind"
                  defaultValue="standard"
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="standard">Standard service</option>
                  <option value="meet_and_greet">Meet &amp; Greet</option>
                </select>
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

              <Button type="submit" className="rounded-xl bg-[#003fb1] text-white hover:bg-[#1a56db]" disabled={servicePending}>
                {servicePending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Add service'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">Active services</CardTitle>
            <CardDescription className="mt-2 text-sm leading-6 text-stone-600">This is what owners will see when they open your booking flow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!services.length ? (
              <div className="kinetic-card-soft rounded-[1.35rem] border border-dashed border-[rgba(115,118,134,0.22)] p-5">
                <p className="text-sm font-semibold text-stone-900">No services configured yet.</p>
                <p className="mt-2 text-sm leading-6 text-stone-500">Add your first walk type to unlock the client booking flow.</p>
              </div>
            ) : (
              services.map((service) => (
                <div key={service.id} className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5 text-sm text-stone-600">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-900">{service.name}</p>
                      <p className="mt-1">{service.duration_minutes} minutes · ${service.base_price.toFixed(2)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{getServiceKindLabel(service.service_kind)}</Badge>
                      <Badge variant="secondary">{service.is_active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                  </div>
                  {service.description && <p className="mt-3 leading-6">{service.description}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">Weekly flow</CardTitle>
            <CardDescription className="mt-2 text-sm leading-6 text-stone-600">Publish the days and times clients can request. Travel buffers are applied automatically when slots are generated.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={availabilityAction} className="space-y-4">
              <div className="space-y-3">
                {WEEK_DAYS.map(({ day, label, short }) => {
                  const row = availabilityByDay.get(day)
                  const isActive = row?.is_active ?? false
                  return (
                    <div key={day} className={`rounded-[1.35rem] border p-4 transition-colors ${isActive ? 'border-[rgba(26,86,219,0.24)] bg-[#eef3ff]' : 'border-stone-200 bg-white'}`}>
                      <div className="grid gap-3 md:grid-cols-[1fr_160px_160px] md:items-center">
                        <label className="flex items-center gap-3 text-sm font-medium text-stone-800">
                          <input type="checkbox" name={`day_${day}_active`} defaultChecked={isActive} />
                          <span className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${isActive ? 'bg-[#003fb1] text-white' : 'bg-stone-100 text-stone-500'}`}>
                            {short}
                          </span>
                          <span className="font-semibold">{label}</span>
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
                    </div>
                  )
                })}
              </div>

              {availabilityState.error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{availabilityState.error}</div>}
              {availabilityState.success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Availability updated.</div>}

              <Button type="submit" variant="outline" className="border-stone-300 bg-white" disabled={availabilityPending}>
                {availabilityPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Save availability'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">Booking settings</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-stone-600">Set travel buffers, booking window, same-day rules, and your service area.</CardDescription>
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
                  <Label htmlFor="time_zone">Walker time zone</Label>
                  <select
                    id="time_zone"
                    name="time_zone"
                    defaultValue={timeZone}
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {COMMON_TIME_ZONES.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-stone-500">All booking times, reports, and billing timestamps will follow this timezone.</p>
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

                <Button type="submit" variant="outline" className="border-stone-300 bg-white" disabled={bookingPending}>
                  {bookingPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Save booking settings'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">Blocked dates</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-stone-600">Mark vacations, blackout days, or temporary periods when no client should be able to request a walk.</CardDescription>
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

                <Button type="submit" variant="outline" className="border-stone-300 bg-white" disabled={blockedDatePending}>
                  {blockedDatePending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Add blocked date'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">Upcoming blackout periods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!blockedDates.length ? (
                <div className="kinetic-card-soft rounded-[1.35rem] border border-dashed border-[rgba(115,118,134,0.22)] p-5">
                  <p className="text-sm font-semibold text-stone-900">No blocked dates on file.</p>
                  <p className="mt-2 text-sm leading-6 text-stone-500">Vacation and blackout periods will show here once they are added.</p>
                </div>
              ) : (
                blockedDates.map((item) => (
                  <div key={item.id} className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5 text-sm text-stone-600">
                    <p className="font-semibold text-stone-900">
                      {item.start_date} → {item.end_date}
                    </p>
                    <p className="mt-2 leading-6">{item.reason || 'Unavailable'}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
