'use server'

import { revalidatePath } from 'next/cache'
import { isDemoTenantSlug } from '@/lib/demo'
import { requireTenantWalker } from '@/lib/tenant-session'

function value(formData: FormData, key: string) {
  const raw = formData.get(key)
  return typeof raw === 'string' ? raw.trim() : ''
}

export type WalkerProfileState = {
  error?: string
  success?: boolean
}

export async function updateWalkerPhotoAction(
  tenantSlug: string,
  _prevState: WalkerProfileState,
  formData: FormData
): Promise<WalkerProfileState> {
  if (isDemoTenantSlug(tenantSlug)) {
    return { success: true }
  }

  const { tenant, user, supabase } = await requireTenantWalker(tenantSlug)
  const photoUrl = value(formData, 'photo_url')

  const { error } = await supabase
    .from('tenant_walkers')
    .update({
      photo_url: photoUrl || null,
    })
    .eq('tenant_id', tenant.id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${tenantSlug}/dashboard`)
  revalidatePath(`/${tenantSlug}/clients`)
  revalidatePath(`/${tenantSlug}/schedule`)
  revalidatePath(`/${tenantSlug}/billing`)
  revalidatePath(`/${tenantSlug}/settings`)
  return { success: true }
}
