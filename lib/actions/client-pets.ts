'use server'

import { revalidatePath } from 'next/cache'
import { isDemoTenantSlug } from '@/lib/demo'
import { requireTenantClient } from '@/lib/tenant-session'

function value(formData: FormData, key: string) {
  const raw = formData.get(key)
  return typeof raw === 'string' ? raw.trim() : ''
}

function optionalNumber(input: string) {
  if (!input) return null
  const parsed = Number(input)
  return Number.isFinite(parsed) ? parsed : null
}

export type ClientPetState = {
  error?: string
  success?: boolean
}

export async function updatePetAction(
  tenantSlug: string,
  _prevState: ClientPetState,
  formData: FormData
): Promise<ClientPetState> {
  const petId = value(formData, 'pet_id')
  const name = value(formData, 'name')

  if (!petId || !name) {
    return { error: 'Pet name is required.' }
  }

  if (isDemoTenantSlug(tenantSlug)) {
    return { success: true }
  }

  const { tenant, clientProfile, supabase } = await requireTenantClient(tenantSlug)

  const { error } = await supabase
    .from('pets')
    .update({
      name,
      breed: value(formData, 'breed') || null,
      medications: value(formData, 'medications') || null,
      allergies: value(formData, 'allergies') || null,
      behavior_notes: value(formData, 'behavior_notes') || null,
      special_notes: value(formData, 'special_notes') || null,
      vet_name: value(formData, 'vet_name') || null,
      vet_phone: value(formData, 'vet_phone') || null,
      microchip: value(formData, 'microchip') || null,
      weight_lbs: optionalNumber(value(formData, 'weight_lbs')),
    })
    .eq('tenant_id', tenant.id)
    .eq('client_id', clientProfile.id)
    .eq('id', petId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${tenantSlug}/portal/pets`)
  revalidatePath(`/${tenantSlug}/portal`)
  revalidatePath(`/${tenantSlug}/portal/schedule`)
  return { success: true }
}

export async function addPetAction(
  tenantSlug: string,
  _prevState: ClientPetState,
  formData: FormData
): Promise<ClientPetState> {
  const name = value(formData, 'name')
  if (!name) {
    return { error: 'Pet name is required.' }
  }

  if (isDemoTenantSlug(tenantSlug)) {
    return { success: true }
  }

  const { tenant, clientProfile, supabase } = await requireTenantClient(tenantSlug)

  const { error } = await supabase.from('pets').insert({
    tenant_id: tenant.id,
    client_id: clientProfile.id,
    name,
    breed: value(formData, 'breed') || null,
    medications: value(formData, 'medications') || null,
    allergies: value(formData, 'allergies') || null,
    behavior_notes: value(formData, 'behavior_notes') || null,
    special_notes: value(formData, 'special_notes') || null,
    vet_name: value(formData, 'vet_name') || null,
    vet_phone: value(formData, 'vet_phone') || null,
    microchip: value(formData, 'microchip') || null,
    weight_lbs: optionalNumber(value(formData, 'weight_lbs')),
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${tenantSlug}/portal/pets`)
  revalidatePath(`/${tenantSlug}/portal`)
  revalidatePath(`/${tenantSlug}/portal/schedule`)
  return { success: true }
}
