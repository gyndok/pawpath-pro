'use client'

import { useActionState } from 'react'
import { Dog, HeartPulse, Loader2, Plus, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfilePhoto } from '@/components/shared/profile-photo'
import { addPetAction, type ClientPetState, updatePetAction } from '@/lib/actions/client-pets'

type PetRecord = {
  id: string
  name: string
  photo_url: string | null
  meet_and_greet_completed_at?: string | null
  breed: string | null
  species: string
  medications: string | null
  allergies: string | null
  behavior_notes: string | null
  special_notes: string | null
  vet_name: string | null
  vet_phone: string | null
  microchip: string | null
  weight_lbs: number | null
}

function PetEditor({
  tenantSlug,
  pet,
}: {
  tenantSlug: string
  pet: PetRecord
}) {
  const [state, formAction, isPending] = useActionState<ClientPetState, FormData>(
    updatePetAction.bind(null, tenantSlug),
    {}
  )

  return (
    <Card className="kinetic-card rounded-[32px] border-0 shadow-[0_30px_70px_rgba(18,52,70,0.08)]">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="overflow-hidden rounded-[24px] border border-[#d7e4eb] bg-white shadow-[0_18px_34px_rgba(18,52,70,0.08)]">
              <ProfilePhoto
                src={pet.photo_url}
                alt={`${pet.name} photo`}
                name={pet.name}
                className="h-20 w-20"
                fallbackClassName="text-lg"
                fallback={<Dog className="h-7 w-7 text-[#2f6f8f]" />}
              />
            </div>
            <div>
              <CardTitle className="text-2xl text-[#143042]">{pet.name}</CardTitle>
              <CardDescription className="text-sm text-[#4f6b7a]">{pet.breed || 'Breed not provided'} · {pet.species}</CardDescription>
            </div>
          </div>
          <Badge
            className={pet.meet_and_greet_completed_at
              ? 'rounded-full bg-[#e7f2ee] px-3 py-1 text-[#1e6150] hover:bg-[#e7f2ee]'
              : 'rounded-full bg-[#fff1e6] px-3 py-1 text-[#9a5a22] hover:bg-[#fff1e6]'
            }
          >
            {pet.meet_and_greet_completed_at ? 'Meet & Greet complete' : 'Meet & Greet required'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="pet_id" value={pet.id} />
          <div className="grid gap-4 rounded-[28px] border border-[#d7e4eb] bg-white p-5 shadow-sm md:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[#143042]">Pet name</span>
              <input name="name" defaultValue={pet.name} className="flex h-11 w-full rounded-2xl border border-[#d7e4eb] bg-[#fbfdfe] px-3 py-2 text-sm text-[#143042] shadow-none outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" required />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[#143042]">Breed</span>
              <input name="breed" defaultValue={pet.breed ?? ''} className="flex h-11 w-full rounded-2xl border border-[#d7e4eb] bg-[#fbfdfe] px-3 py-2 text-sm text-[#143042] shadow-none outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" />
            </label>
            <label className="space-y-1.5 text-sm md:col-span-2">
              <span className="font-medium text-[#143042]">Photo URL</span>
              <input name="photo_url" defaultValue={pet.photo_url ?? ''} placeholder="https://example.com/dog-photo.jpg" className="flex h-11 w-full rounded-2xl border border-[#d7e4eb] bg-[#fbfdfe] px-3 py-2 text-sm text-[#143042] shadow-none outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[#143042]">Weight (lbs)</span>
              <input name="weight_lbs" type="number" min="0" step="0.1" defaultValue={pet.weight_lbs ?? ''} className="flex h-11 w-full rounded-2xl border border-[#d7e4eb] bg-[#fbfdfe] px-3 py-2 text-sm text-[#143042] shadow-none outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[#143042]">Microchip</span>
              <input name="microchip" defaultValue={pet.microchip ?? ''} className="flex h-11 w-full rounded-2xl border border-[#d7e4eb] bg-[#fbfdfe] px-3 py-2 text-sm text-[#143042] shadow-none outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[#143042]">Vet name</span>
              <input name="vet_name" defaultValue={pet.vet_name ?? ''} className="flex h-11 w-full rounded-2xl border border-[#d7e4eb] bg-[#fbfdfe] px-3 py-2 text-sm text-[#143042] shadow-none outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[#143042]">Vet phone</span>
              <input name="vet_phone" defaultValue={pet.vet_phone ?? ''} className="flex h-11 w-full rounded-2xl border border-[#d7e4eb] bg-[#fbfdfe] px-3 py-2 text-sm text-[#143042] shadow-none outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="inline-flex items-center gap-2 font-medium text-[#143042]"><HeartPulse className="h-4 w-4 text-[#2f6f8f]" />Medications</span>
              <textarea name="medications" rows={3} defaultValue={pet.medications ?? ''} className="flex min-h-24 w-full rounded-[20px] border border-[#d7e4eb] bg-white px-3 py-3 text-sm text-[#143042] shadow-sm outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="inline-flex items-center gap-2 font-medium text-[#143042]"><ShieldCheck className="h-4 w-4 text-[#2f6f8f]" />Allergies</span>
              <textarea name="allergies" rows={3} defaultValue={pet.allergies ?? ''} className="flex min-h-24 w-full rounded-[20px] border border-[#d7e4eb] bg-white px-3 py-3 text-sm text-[#143042] shadow-sm outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[#143042]">Behavior notes</span>
              <textarea name="behavior_notes" rows={3} defaultValue={pet.behavior_notes ?? ''} className="flex min-h-24 w-full rounded-[20px] border border-[#d7e4eb] bg-white px-3 py-3 text-sm text-[#143042] shadow-sm outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[#143042]">Handling notes</span>
              <textarea name="special_notes" rows={3} defaultValue={pet.special_notes ?? ''} className="flex min-h-24 w-full rounded-[20px] border border-[#d7e4eb] bg-white px-3 py-3 text-sm text-[#143042] shadow-sm outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" />
            </label>
          </div>

          {state.error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</div>}
          {state.success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Pet profile updated.</div>}

          <Button type="submit" disabled={isPending} className="h-11 rounded-full bg-[#2f6f8f] px-5 text-white hover:bg-[#245a75]">
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Save pet profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function PetManager({
  tenantSlug,
  pets,
}: {
  tenantSlug: string
  pets: PetRecord[]
}) {
  const [addState, addFormAction, isAdding] = useActionState<ClientPetState, FormData>(
    addPetAction.bind(null, tenantSlug),
    {}
  )

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4">
        {pets.map((pet) => (
          <PetEditor key={pet.id} tenantSlug={tenantSlug} pet={pet} />
        ))}
      </div>

      <Card className="kinetic-card rounded-[32px] border-0 shadow-[0_30px_70px_rgba(18,52,70,0.08)]">
        <CardHeader className="space-y-3 pb-4">
          <CardTitle className="flex items-center gap-2 text-2xl text-[#143042]">
            <Plus className="h-4 w-4 text-[#2f6f8f]" />
            Add another pet
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-[#4f6b7a]">Create another pet profile for bookings, logistics, and walk reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={addFormAction} className="space-y-4 rounded-[28px] border border-[#d7e4eb] bg-white p-5 shadow-sm">
            <div className="grid gap-4">
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-[#143042]">Pet name</span>
                <input name="name" className="flex h-11 w-full rounded-2xl border border-[#d7e4eb] bg-[#fbfdfe] px-3 py-2 text-sm text-[#143042] shadow-none outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" required />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-[#143042]">Breed</span>
                <input name="breed" className="flex h-11 w-full rounded-2xl border border-[#d7e4eb] bg-[#fbfdfe] px-3 py-2 text-sm text-[#143042] shadow-none outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-[#143042]">Photo URL</span>
                <input name="photo_url" placeholder="https://example.com/dog-photo.jpg" className="flex h-11 w-full rounded-2xl border border-[#d7e4eb] bg-[#fbfdfe] px-3 py-2 text-sm text-[#143042] shadow-none outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-[#143042]">Weight (lbs)</span>
                <input name="weight_lbs" type="number" min="0" step="0.1" className="flex h-11 w-full rounded-2xl border border-[#d7e4eb] bg-[#fbfdfe] px-3 py-2 text-sm text-[#143042] shadow-none outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-[#143042]">Allergies</span>
                <textarea name="allergies" rows={2} className="flex min-h-20 w-full rounded-[20px] border border-[#d7e4eb] bg-white px-3 py-3 text-sm text-[#143042] shadow-sm outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-[#143042]">Behavior notes</span>
                <textarea name="behavior_notes" rows={2} className="flex min-h-20 w-full rounded-[20px] border border-[#d7e4eb] bg-white px-3 py-3 text-sm text-[#143042] shadow-sm outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-[#143042]">Handling notes</span>
                <textarea name="special_notes" rows={2} className="flex min-h-20 w-full rounded-[20px] border border-[#d7e4eb] bg-white px-3 py-3 text-sm text-[#143042] shadow-sm outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-[#143042]">Medications</span>
                <textarea name="medications" rows={2} className="flex min-h-20 w-full rounded-[20px] border border-[#d7e4eb] bg-white px-3 py-3 text-sm text-[#143042] shadow-sm outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-[#143042]">Microchip</span>
                <input name="microchip" className="flex h-11 w-full rounded-2xl border border-[#d7e4eb] bg-[#fbfdfe] px-3 py-2 text-sm text-[#143042] shadow-none outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-[#143042]">Vet name</span>
                <input name="vet_name" className="flex h-11 w-full rounded-2xl border border-[#d7e4eb] bg-[#fbfdfe] px-3 py-2 text-sm text-[#143042] shadow-none outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-[#143042]">Vet phone</span>
                <input name="vet_phone" className="flex h-11 w-full rounded-2xl border border-[#d7e4eb] bg-[#fbfdfe] px-3 py-2 text-sm text-[#143042] shadow-none outline-none transition focus-visible:border-[#2f6f8f] focus-visible:ring-[3px] focus-visible:ring-[#d9eef7]" />
              </label>
            </div>

            {addState.error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{addState.error}</div>}
            {addState.success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">New pet added successfully.</div>}

            <Button type="submit" disabled={isAdding} className="h-11 w-full rounded-full bg-[#2f6f8f] text-white hover:bg-[#245a75]">
              {isAdding ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding pet…</> : 'Add pet'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
