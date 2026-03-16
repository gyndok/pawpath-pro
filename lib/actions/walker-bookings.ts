'use server'

import { revalidatePath } from 'next/cache'
import { isDemoTenantSlug } from '@/lib/demo'
import { requireTenantWalker } from '@/lib/tenant-session'

export async function updateBookingStatusAction(tenantSlug: string, formData: FormData) {
  const rawBookingId = formData.get('booking_id')
  const rawStatus = formData.get('status')
  const bookingId = typeof rawBookingId === 'string' ? rawBookingId : ''
  const status = typeof rawStatus === 'string' ? rawStatus : ''

  if (!bookingId || !['approved', 'declined'].includes(status)) {
    return
  }

  if (isDemoTenantSlug(tenantSlug)) {
    return
  }

  const { tenant, supabase } = await requireTenantWalker(tenantSlug)

  await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .eq('tenant_id', tenant.id)

  revalidatePath(`/${tenantSlug}/schedule`)
  revalidatePath(`/${tenantSlug}/dashboard`)
}
