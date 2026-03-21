'use client'

import { useActionState, useMemo, useState } from 'react'
import { CalendarClock, CheckCircle2, Clock3, Loader2, PawPrint, ShieldAlert, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { requestBookingAction, type ClientBookingState } from '@/lib/actions/client-booking'
import { filterServicesForPets, getNoEligibleServicesMessage, getPetEligibilityMessage, getServiceKindLabel } from '@/lib/service-eligibility'
import { cn } from '@/lib/utils'

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
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>(pets[0] ? [pets[0].id] : [])
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')

  const selectedPets = useMemo(
    () => pets.filter((pet) => selectedPetIds.includes(pet.id)),
    [pets, selectedPetIds]
  )

  const eligibleServices = useMemo(
    () => filterServicesForPets(services, selectedPets),
    [services, selectedPets]
  )

  const eligibilityMessage = useMemo(
    () => getPetEligibilityMessage(selectedPets),
    [selectedPets]
  )

  const noEligibleServicesMessage = useMemo(
    () => getNoEligibleServicesMessage(services, selectedPets),
    [services, selectedPets]
  )

  const effectiveSelectedServiceId = eligibleServices.some((service) => service.id === selectedServiceId)
    ? selectedServiceId
    : (eligibleServices[0]?.id ?? '')

  const availableDates = useMemo(
    () => (effectiveSelectedServiceId ? availableDatesByService[effectiveSelectedServiceId] ?? [] : []),
    [availableDatesByService, effectiveSelectedServiceId]
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
    <form action={formAction} className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="kinetic-card space-y-4 rounded-[28px] p-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#e7f2ee] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#1e6150]">
              <PawPrint className="h-3.5 w-3.5" />
              Pets on this visit
            </div>
            <h3 className="text-lg font-semibold text-[#143042]">Choose which pets are part of this booking</h3>
          </div>

          {eligibilityMessage && (
            <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{eligibilityMessage}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {pets.map((pet) => {
              const isSelected = selectedPetIds.includes(pet.id)
              const isCleared = Boolean(pet.meet_and_greet_completed_at)

              return (
                <label
                  key={pet.id}
                  className="flex items-center justify-between gap-3 rounded-[20px] border border-[#d7e4eb] bg-white px-4 py-3 text-sm shadow-sm transition hover:border-[#8ab8cf] hover:bg-[#f8fbfd]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 font-medium text-[#143042]">
                      <span>{pet.name}</span>
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]',
                          isCleared ? 'bg-[#e7f2ee] text-[#1e6150]' : 'bg-[#fff1e6] text-[#9a5a22]'
                        )}
                      >
                        {isCleared ? 'Cleared for walks' : 'Meet & Greet required'}
                      </span>
                    </div>
                    <div className="text-xs text-[#6d8796]">Included in the walker&apos;s report and logistics</div>
                  </div>
                  <input
                    type="checkbox"
                    name="pet_ids"
                    value={pet.id}
                  checked={isSelected}
                  onChange={(event) => {
                    setSelectedPetIds((current) => (
                      event.target.checked
                        ? [...current, pet.id]
                        : current.filter((id) => id !== pet.id)
                    ))
                  }}
                    className="h-4 w-4 rounded border-[#9ab5c3] text-[#2f6f8f] focus:ring-[#2f6f8f]"
                  />
                </label>
              )
            })}
          </div>
        </div>

        <div className="kinetic-card space-y-4 rounded-[28px] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#d9eef7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#1d5671]">
                <Sparkles className="h-3.5 w-3.5" />
                Choose a service
              </div>
              <h3 className="text-xl font-semibold text-[#143042]">Book from open availability only</h3>
              <p className="max-w-2xl text-sm text-[#4f6b7a]">
                Service choices adapt to the pets you selected. New pets only see Meet &amp; Greet until they&apos;ve completed it.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {!selectedPets.length ? (
              <div className="rounded-[22px] border border-dashed border-[#c8d9e2] bg-white/80 p-4 text-sm text-[#6d8796] sm:col-span-2">
                Choose at least one pet to see available services.
              </div>
            ) : !eligibleServices.length ? (
              <div className="rounded-[22px] border border-dashed border-[#c8d9e2] bg-white/80 p-4 text-sm text-[#6d8796] sm:col-span-2">
                {noEligibleServicesMessage}
              </div>
            ) : (
              eligibleServices.map((service) => {
                const isSelected = service.id === effectiveSelectedServiceId

                return (
                  <label
                    key={service.id}
                    className={cn(
                      'cursor-pointer rounded-[24px] border bg-white p-4 shadow-sm transition-all sm:min-h-[172px]',
                      isSelected
                        ? 'border-[#2f6f8f] bg-[#edf6fb] shadow-[0_20px_45px_rgba(18,52,70,0.08)]'
                        : 'border-[#d7e4eb] hover:border-[#8ab8cf] hover:bg-[#f8fbfd]'
                    )}
                  >
                    <input
                      type="radio"
                      value={service.id}
                      checked={isSelected}
                      onChange={(event) => setSelectedServiceId(event.target.value)}
                      className="sr-only"
                      required
                    />
                    <div className="flex h-full items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 flex-col justify-between space-y-3">
                        <div className="text-base font-semibold text-[#143042]">{service.name}</div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#5b7685]">
                          <span className="rounded-full bg-[#d9eef7] px-2.5 py-1 text-[#1d5671]">
                            {getServiceKindLabel(service.service_kind)}
                          </span>
                          <span className="rounded-full bg-[#eef4f7] px-2.5 py-1">{service.duration_minutes} min</span>
                          <span className="rounded-full bg-[#fff1e6] px-2.5 py-1 text-[#9a5a22]">
                            ${service.base_price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div
                        className={cn(
                          'mt-0.5 h-4 w-4 rounded-full border-2',
                          isSelected ? 'border-[#2f6f8f] bg-[#2f6f8f]' : 'border-[#adc8d6] bg-white'
                        )}
                      />
                    </div>
                  </label>
                )
              })
            )}
          </div>
        </div>
      </section>

      <section className="kinetic-card rounded-[28px] p-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eef5fb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#2f6f8f]">
            <CalendarClock className="h-3.5 w-3.5" />
            Availability calendar
          </div>
          <h3 className="text-lg font-semibold text-[#143042]">Select an open date and time</h3>
          <p className="text-sm text-[#4f6b7a]">
            Buffers, blackout dates, and service-area rules are already applied here.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {!availableDates.length ? (
              <div className="rounded-[22px] border border-dashed border-[#c8d9e2] bg-white/80 p-4 text-sm text-[#6d8796] sm:col-span-2 xl:col-span-3">
                        {effectiveSelectedServiceId
                          ? 'No open dates are available for this service within the current booking window.'
                          : 'Choose a service to view open dates.'}
              </div>
            ) : (
              availableDates.map((group) => {
                const isSelected = group.date === effectiveSelectedDate

                return (
                  <button
                    key={group.date}
                    type="button"
                    onClick={() => setSelectedDate(group.date)}
                    className={cn(
                      'rounded-[22px] border px-4 py-3 text-left transition-all',
                      isSelected
                        ? 'border-[#2f6f8f] bg-[#edf6fb] shadow-[0_16px_32px_rgba(18,52,70,0.08)]'
                        : 'border-[#d7e4eb] bg-white hover:border-[#8ab8cf] hover:bg-[#f8fbfd]'
                    )}
                  >
                    <div className="text-sm font-semibold text-[#143042]">{group.label}</div>
                    <div className="mt-1 text-xs text-[#6d8796]">
                      {group.slots.length} open time{group.slots.length === 1 ? '' : 's'}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <div className="rounded-[24px] border border-[#d7e4eb] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#143042]">
              <Clock3 className="h-4 w-4 text-[#2f6f8f]" />
              Available times
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {!effectiveAvailableTimes.length ? (
                <div className="rounded-[18px] border border-dashed border-[#c8d9e2] px-4 py-3 text-sm text-[#6d8796] sm:col-span-2">
                  Choose an available date to view open time windows.
                </div>
              ) : (
                effectiveAvailableTimes.map((slot) => {
                  const isSelected = slot.time === effectiveSelectedTime

                  return (
                    <button
                      key={slot.iso}
                      type="button"
                      onClick={() => setSelectedTime(slot.time)}
                      className={cn(
                        'rounded-[18px] border px-4 py-3 text-left text-sm transition-all',
                        isSelected
                          ? 'border-[#2f6f8f] bg-[#143042] text-white shadow-[0_14px_30px_rgba(20,48,66,0.22)]'
                          : 'border-[#d7e4eb] bg-[#fbfdfe] text-[#143042] hover:border-[#8ab8cf] hover:bg-white'
                      )}
                    >
                      {slot.label}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </section>

      <input type="hidden" name="date" value={effectiveSelectedDate} />
      <input type="hidden" name="time" value={effectiveSelectedTime} />

      <section className="kinetic-card rounded-[28px] p-5">
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-[#143042]">Notes for the walker</span>
          <textarea
            name="notes"
            rows={4}
            className="min-h-28 w-full rounded-[20px] border border-[#d7e4eb] bg-white px-4 py-3 text-sm text-[#143042] shadow-sm outline-none transition placeholder:text-[#8aa1af] focus:border-[#2f6f8f] focus:ring-4 focus:ring-[#d9eef7]"
            placeholder="Anything important about timing, access, or special care for this visit"
          />
        </label>
      </section>

      {state.error && (
        <div className="rounded-[20px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-[20px] border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Booking request submitted. The walker will review it and approve or decline it.</span>
          </div>
        </div>
      )}

      <input type="hidden" name="service_id" value={effectiveSelectedServiceId} />

      <Button
        type="submit"
        className="h-11 rounded-full bg-[#2f6f8f] px-6 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(47,111,143,0.26)] hover:bg-[#245a75]"
        disabled={isPending || pets.length === 0 || selectedPetIds.length === 0 || !effectiveSelectedServiceId || !effectiveSelectedDate || !effectiveSelectedTime}
      >
        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending request…</> : 'Request booking'}
      </Button>
    </form>
  )
}
