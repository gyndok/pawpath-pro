'use client'

import { useActionState, useMemo, useState } from 'react'
import { CalendarClock, CheckCircle2, Loader2, PhoneCall, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createWalkerBookingAction, type WalkerBookingState } from '@/lib/actions/client-booking'
import { filterServicesForPets, getPetEligibilityMessage, getServiceKindLabel } from '@/lib/service-eligibility'
import { cn } from '@/lib/utils'

type WalkerClientOption = {
  id: string
  full_name: string
  pets: Array<{
    id: string
    name: string
    meet_and_greet_completed_at?: string | null
  }>
}

type WalkerServiceOption = {
  id: string
  name: string
  duration_minutes: number
  base_price: number
  service_kind?: string | null
}

export function CreateBookingForm({
  tenantSlug,
  clients,
  services,
}: {
  tenantSlug: string
  clients: WalkerClientOption[]
  services: WalkerServiceOption[]
}) {
  const [state, formAction, isPending] = useActionState<WalkerBookingState, FormData>(
    createWalkerBookingAction.bind(null, tenantSlug),
    {}
  )
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? '')
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>(clients[0]?.pets[0] ? [clients[0].pets[0].id] : [])
  const [selectedServiceId, setSelectedServiceId] = useState('')

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  )

  const clientPets = useMemo(
    () => selectedClient?.pets ?? [],
    [selectedClient]
  )
  const selectedPets = useMemo(
    () => clientPets.filter((pet) => selectedPetIds.includes(pet.id)),
    [clientPets, selectedPetIds]
  )

  const eligibleServices = useMemo(
    () => filterServicesForPets(services, selectedPets),
    [services, selectedPets]
  )

  const eligibilityMessage = useMemo(
    () => getPetEligibilityMessage(selectedPets),
    [selectedPets]
  )

  const effectiveSelectedServiceId = eligibleServices.some((service) => service.id === selectedServiceId)
    ? selectedServiceId
    : (eligibleServices[0]?.id ?? '')

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <label className="space-y-2 text-sm">
          <span className="inline-flex items-center gap-2 font-semibold text-stone-800">
            <PhoneCall className="h-4 w-4 text-blue-700" />
            Client
          </span>
          <select
            name="client_id"
            value={selectedClientId}
            onChange={(event) => {
              const nextClientId = event.target.value
              const nextClient = clients.find((client) => client.id === nextClientId) ?? null
              setSelectedClientId(nextClientId)
              setSelectedPetIds(nextClient?.pets[0] ? [nextClient.pets[0].id] : [])
              setSelectedServiceId('')
            }}
            className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            required
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-2 text-sm">
          <span className="inline-flex items-center gap-2 font-semibold text-stone-800">
            <CalendarClock className="h-4 w-4 text-blue-700" />
            Selected pets
          </span>
          <div className="grid gap-2 sm:grid-cols-2">
            {!clientPets.length ? (
              <div className="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm text-stone-500 sm:col-span-2">
                This client doesn&apos;t have any pets on file yet.
              </div>
            ) : (
              clientPets.map((pet) => {
                const isSelected = selectedPetIds.includes(pet.id)
                const isCleared = Boolean(pet.meet_and_greet_completed_at)

                return (
                  <label
                    key={pet.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <div>
                      <div className="font-medium text-stone-900">{pet.name}</div>
                      <div className="text-xs text-stone-500">
                        {isCleared ? 'Cleared for standard services' : 'Meet & Greet still required'}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      name="pet_ids"
                      value={pet.id}
                      checked={isSelected}
                      onChange={(event) => {
                        setSelectedPetIds((current) =>
                          event.target.checked
                            ? [...current, pet.id]
                            : current.filter((id) => id !== pet.id)
                        )
                      }}
                      className="h-4 w-4 rounded border-stone-300 text-[#003fb1] focus:ring-[#003fb1]"
                    />
                  </label>
                )
              })
            )}
          </div>
        </div>
      </div>

      {eligibilityMessage && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{eligibilityMessage}</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm font-semibold text-stone-800">Service</p>
        <div className="grid gap-3 lg:grid-cols-3">
          {!selectedPets.length ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm text-stone-500 lg:col-span-3">
              Select at least one pet to see available services.
            </div>
          ) : !eligibleServices.length ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm text-stone-500 lg:col-span-3">
              This mix of pets can&apos;t be booked together. New pets need their own Meet &amp; Greet booking.
            </div>
          ) : (
            eligibleServices.map((service) => {
              const isSelected = service.id === effectiveSelectedServiceId

              return (
                <label
                  key={service.id}
                  className={cn(
                    'cursor-pointer rounded-[1.2rem] border bg-white p-4 shadow-sm transition-all',
                    isSelected ? 'border-[#003fb1] bg-[#edf3ff]' : 'border-stone-200 hover:border-[#8aa8e8]'
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
                  <div className="space-y-2">
                    <div className="text-base font-semibold text-stone-900">{service.name}</div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
                      <span className="rounded-full bg-[#d9eef7] px-2.5 py-1 text-[#1d5671]">
                        {getServiceKindLabel(service.service_kind)}
                      </span>
                      <span className="rounded-full bg-stone-100 px-2.5 py-1">{service.duration_minutes} min</span>
                      <span className="rounded-full bg-[#fff1e6] px-2.5 py-1 text-[#9a5a22]">
                        ${service.base_price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </label>
              )
            })
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-stone-800">Date</span>
          <input
            type="date"
            name="date"
            className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            required
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-stone-800">Time</span>
          <input
            type="time"
            name="time"
            className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            required
          />
        </label>
      </div>

      <label className="space-y-2 text-sm">
        <span className="font-semibold text-stone-800">Notes</span>
        <textarea
          name="notes"
          rows={3}
          className="min-h-24 w-full rounded-xl border border-input bg-white px-3 py-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder="Phone booking details, access notes, or special instructions"
        />
      </label>

      {state.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Booking added to the schedule and shared with the client portal.</span>
          </div>
        </div>
      )}

      <input type="hidden" name="service_id" value={effectiveSelectedServiceId} />

      <Button
        type="submit"
        disabled={isPending || !selectedClientId || !selectedPetIds.length || !effectiveSelectedServiceId}
        className="rounded-full bg-[#003fb1] text-white hover:bg-[#1a56db]"
      >
        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</> : 'Create booking'}
      </Button>
    </form>
  )
}
