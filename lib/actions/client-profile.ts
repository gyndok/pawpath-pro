'use server'

import { revalidatePath } from 'next/cache'
import { isDemoTenantSlug } from '@/lib/demo'
import { requireTenantClient } from '@/lib/tenant-session'

function value(formData: FormData, key: string) {
  const raw = formData.get(key)
  return typeof raw === 'string' ? raw.trim() : ''
}

export type ClientProfileState = {
  error?: string
  success?: boolean
}

export async function updateClientProfilePhotoAction(
  tenantSlug: string,
  _prevState: ClientProfileState,
  formData: FormData
): Promise<ClientProfileState> {
  if (isDemoTenantSlug(tenantSlug)) {
    return { success: true }
  }

  const { tenant, clientProfile, supabase } = await requireTenantClient(tenantSlug)
  const photoUrl = value(formData, 'photo_url')

  const { error } = await supabase
    .from('client_profiles')
    .update({
      photo_url: photoUrl || null,
    })
    .eq('tenant_id', tenant.id)
    .eq('id', clientProfile.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${tenantSlug}/portal`)
  revalidatePath(`/${tenantSlug}/portal/pets`)
  revalidatePath(`/${tenantSlug}/portal/schedule`)
  revalidatePath(`/${tenantSlug}/portal/walks`)
  revalidatePath(`/${tenantSlug}/portal/billing`)
  return { success: true }
}
