'use client'

import { useActionState, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { requestBookingAction, type ClientBookingState } from '@/lib/actions/client-booking'

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

type SlotOption = {
  iso: string
  date: string
  time: string
  label: string
}

type DateGroup = {
  date: string
  label: string
  slots: SlotOption[]
}

export function BookingRequestForm({
  tenantSlug,
  pets,
  services,
  availableDatesByService,
  geofenceMessage,
}: {
  tenantSlug: string
  pets: PetOption[]
  services: ServiceOption[]
  availableDatesByService: Record<string, DateGroup[]>
  geofenceMessage?: string | null
}) {
  const [state, formAction, isPending] = useActionState<ClientBookingState, FormData>(
    requestBookingAction.bind(null, tenantSlug),
    {}
  )
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id ?? '')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')

  const availableDates = useMemo(
    () => (selectedServiceId ? availableDatesByService[selectedServiceId] ?? [] : []),
    [availableDatesByService, selectedServiceId]
  )

  const effectiveSelectedDate = availableDates.some((group) => group.date === selectedDate)
    ? selectedDate
    : (availableDates[0]?.date ?? '')

  const effectiveAvailableTimes = availableDates.find((group) => group.date === effectiveSelectedDate)?.slots ?? []

  const effectiveSelectedTime = effectiveAvailableTimes.some((slot) => slot.time === selectedTime)
    ? selectedTime
    : (effectiveAvailableTimes[0]?.time ?? '')

  if (geofenceMessage) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {geofenceMessage}
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-200 p-4 text-sm text-stone-500">
        This business has not configured any services yet, so booking requests are not available.
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-stone-800">Service</span>
          <select
            name="service_id"
            value={selectedServiceId}
            onChange={(event) => setSelectedServiceId(event.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            required
          >
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
          <span className="font-medium text-stone-800">Available date</span>
          <select
            value={effectiveSelectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            disabled={!availableDates.length}
          >
            {!availableDates.length ? (
              <option value="">No open dates available</option>
            ) : (
              availableDates.map((group) => (
                <option key={group.date} value={group.date}>{group.label}</option>
              ))
            )}
          </select>
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-stone-800">Available time</span>
          <select
            value={effectiveSelectedTime}
            onChange={(event) => setSelectedTime(event.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            disabled={!effectiveAvailableTimes.length}
          >
            {!effectiveAvailableTimes.length ? (
              <option value="">No open times available</option>
            ) : (
              effectiveAvailableTimes.map((slot) => (
                <option key={slot.iso} value={slot.time}>{slot.label}</option>
              ))
            )}
          </select>
        </label>
      </div>

      <input type="hidden" name="date" value={effectiveSelectedDate} />
      <input type="hidden" name="time" value={effectiveSelectedTime} />

      {selectedServiceId && !availableDates.length && (
        <div className="rounded-xl border border-dashed border-stone-200 p-4 text-sm text-stone-500">
          No open slots are available for this service within the current booking window.
        </div>
      )}

      <label className="space-y-1.5 text-sm">
        <span className="font-medium text-stone-800">Notes for the walker</span>
        <textarea
          name="notes"
          rows={4}
          className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder="Anything important about timing, access, or special care for this visit"
        />
      </label>

      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Booking request submitted. The walker will review it and approve or decline it.
        </div>
      )}

      <Button type="submit" className="bg-[#c66a2b] hover:bg-[#ad5821]" disabled={isPending || pets.length === 0 || !selectedServiceId || !effectiveSelectedDate || !effectiveSelectedTime}>
        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending request…</> : 'Request booking'}
      </Button>
    </form>
  )
}
