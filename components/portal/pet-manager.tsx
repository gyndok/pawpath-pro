'use client'

import { useActionState } from 'react'
import { Dog, Loader2, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfilePhoto } from '@/components/shared/profile-photo'
import { addPetAction, type ClientPetState, updatePetAction } from '@/lib/actions/client-pets'

type PetRecord = {
  id: string
  name: string
  photo_url: string | null
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
    <Card className="border-stone-200">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              <ProfilePhoto
                src={pet.photo_url}
                alt={`${pet.name} photo`}
                name={pet.name}
                className="h-16 w-16"
                fallbackClassName="text-lg"
                fallback={<Dog className="h-7 w-7 text-[#b45a21]" />}
              />
            </div>
            <div>
              <CardTitle>{pet.name}</CardTitle>
              <CardDescription>{pet.breed || 'Breed not provided'} · {pet.species}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary">On file</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="pet_id" value={pet.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-stone-800">Pet name</span>
              <input name="name" defaultValue={pet.name} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" required />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-stone-800">Breed</span>
              <input name="breed" defaultValue={pet.breed ?? ''} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            </label>
            <label className="space-y-1.5 text-sm md:col-span-2">
              <span className="font-medium text-stone-800">Photo URL</span>
              <input name="photo_url" defaultValue={pet.photo_url ?? ''} placeholder="https://example.com/dog-photo.jpg" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-stone-800">Weight (lbs)</span>
              <input name="weight_lbs" type="number" min="0" step="0.1" defaultValue={pet.weight_lbs ?? ''} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-stone-800">Microchip</span>
              <input name="microchip" defaultValue={pet.microchip ?? ''} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-stone-800">Vet name</span>
              <input name="vet_name" defaultValue={pet.vet_name ?? ''} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-stone-800">Vet phone</span>
              <input name="vet_phone" defaultValue={pet.vet_phone ?? ''} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-stone-800">Medications</span>
              <textarea name="medications" rows={3} defaultValue={pet.medications ?? ''} className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-stone-800">Allergies</span>
              <textarea name="allergies" rows={3} defaultValue={pet.allergies ?? ''} className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-stone-800">Behavior notes</span>
              <textarea name="behavior_notes" rows={3} defaultValue={pet.behavior_notes ?? ''} className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-stone-800">Handling notes</span>
              <textarea name="special_notes" rows={3} defaultValue={pet.special_notes ?? ''} className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            </label>
          </div>

          {state.error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</div>}
          {state.success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Pet profile updated.</div>}

          <Button type="submit" disabled={isPending} className="bg-[#c66a2b] hover:bg-[#ad5821]">
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

      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#c66a2b]" />
            Add another pet
          </CardTitle>
          <CardDescription>Create another pet profile for bookings and walk reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={addFormAction} className="space-y-4">
            <div className="grid gap-4">
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-stone-800">Pet name</span>
                <input name="name" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" required />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-stone-800">Breed</span>
                <input name="breed" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-stone-800">Photo URL</span>
                <input name="photo_url" placeholder="https://example.com/dog-photo.jpg" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-stone-800">Weight (lbs)</span>
                <input name="weight_lbs" type="number" min="0" step="0.1" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-stone-800">Allergies</span>
                <textarea name="allergies" rows={2} className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-stone-800">Behavior notes</span>
                <textarea name="behavior_notes" rows={2} className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-stone-800">Handling notes</span>
                <textarea name="special_notes" rows={2} className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-stone-800">Medications</span>
                <textarea name="medications" rows={2} className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-stone-800">Microchip</span>
                <input name="microchip" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-stone-800">Vet name</span>
                <input name="vet_name" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-stone-800">Vet phone</span>
                <input name="vet_phone" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
              </label>
            </div>

            {addState.error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{addState.error}</div>}
            {addState.success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">New pet added successfully.</div>}

            <Button type="submit" disabled={isAdding} className="w-full bg-[#c66a2b] hover:bg-[#ad5821]">
              {isAdding ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding pet…</> : 'Add pet'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
