'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { isDemoTenantSlug } from '@/lib/demo'
import { requireTenantClient } from '@/lib/tenant-session'

export type ClientWaiverState = {
  error?: string
  success?: boolean
}

export async function signActiveWaiverAction(
  tenantSlug: string,
  _prevState: ClientWaiverState,
  formData: FormData
): Promise<ClientWaiverState> {
  const rawSignature = formData.get('signature_name')
  const signatureName = typeof rawSignature === 'string' ? rawSignature.trim() : ''

  if (!signatureName) {
    return { error: 'Signature name is required.' }
  }

  if (isDemoTenantSlug(tenantSlug)) {
    return { success: true }
  }

  const { tenant, clientProfile, supabase } = await requireTenantClient(tenantSlug)

  const { data: waiver } = await supabase
    .from('waivers')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!waiver) {
    return { error: 'No active waiver is configured for this business.' }
  }

  const { data: existing } = await supabase
    .from('waiver_signatures')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('client_id', clientProfile.id)
    .eq('waiver_id', waiver.id)
    .maybeSingle()

  if (!existing) {
    const headerStore = await headers()
    const ipAddress = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() || null

    const { error } = await supabase.from('waiver_signatures').insert({
      tenant_id: tenant.id,
      waiver_id: waiver.id,
      client_id: clientProfile.id,
      ip_address: ipAddress,
      signature_name: signatureName,
    })

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath(`/${tenantSlug}/portal`)
  revalidatePath(`/${tenantSlug}/portal/waiver`)
  return { success: true }
}
