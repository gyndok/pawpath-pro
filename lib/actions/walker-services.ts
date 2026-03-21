'use server'

import { revalidatePath } from 'next/cache'
import { isDemoTenantSlug } from '@/lib/demo'
import { normalizeServiceKind } from '@/lib/service-eligibility'
import { requireTenantWalker } from '@/lib/tenant-session'

export type WalkerServiceState = {
  error?: string
  success?: boolean
}

function value(formData: FormData, key: string) {
  const raw = formData.get(key)
  return typeof raw === 'string' ? raw.trim() : ''
}

export async function createServiceAction(
  tenantSlug: string,
  _prevState: WalkerServiceState,
  formData: FormData
): Promise<WalkerServiceState> {
  const name = value(formData, 'name')
  const description = value(formData, 'description')
  const serviceKind = normalizeServiceKind(value(formData, 'service_kind'))
  const duration = value(formData, 'duration_minutes')
  const price = value(formData, 'base_price')

  if (!name || !duration || !price) {
    return { error: 'Name, duration, and price are required.' }
  }

  const durationMinutes = Number(duration)
  const basePrice = Number(price)

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || !Number.isFinite(basePrice) || basePrice <= 0) {
    return { error: 'Enter valid service duration and pricing values.' }
  }

  if (isDemoTenantSlug(tenantSlug)) {
    return { success: true }
  }

  const { tenant, supabase } = await requireTenantWalker(tenantSlug)

  const { error } = await supabase.from('services').insert({
    tenant_id: tenant.id,
    name,
    description: description || null,
    service_kind: serviceKind,
    duration_minutes: durationMinutes,
    base_price: basePrice,
    is_active: true,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${tenantSlug}/settings`)
  revalidatePath(`/${tenantSlug}/portal`)
  return { success: true }
}
