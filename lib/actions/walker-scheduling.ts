'use server'

import { revalidatePath } from 'next/cache'
import { isDemoTenantSlug } from '@/lib/demo'
import { requireTenantWalker } from '@/lib/tenant-session'

export type WalkerSchedulingState = {
  error?: string
  success?: boolean
}

function value(formData: FormData, key: string) {
  const raw = formData.get(key)
  return typeof raw === 'string' ? raw.trim() : ''
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === 'on'
}

export async function saveAvailabilityAction(
  tenantSlug: string,
  _prevState: WalkerSchedulingState,
  formData: FormData
): Promise<WalkerSchedulingState> {
  if (isDemoTenantSlug(tenantSlug)) return { success: true }

  const { tenant, user, supabase } = await requireTenantWalker(tenantSlug)

  for (let day = 0; day < 7; day += 1) {
    const active = checked(formData, `day_${day}_active`)
    const start = value(formData, `day_${day}_start`) || '09:00'
    const end = value(formData, `day_${day}_end`) || '17:00'

    if (active && start >= end) {
      return { error: 'Availability end time must be after start time for each active day.' }
    }

    const { error } = await supabase.from('availability').upsert({
      tenant_id: tenant.id,
      walker_id: user.id,
      day_of_week: day,
      start_time: start,
      end_time: end,
      is_active: active,
    }, {
      onConflict: 'tenant_id,walker_id,day_of_week',
    })

    if (error) return { error: error.message }
  }

  revalidatePath(`/${tenantSlug}/settings`)
  revalidatePath(`/${tenantSlug}/portal`)
  revalidatePath(`/${tenantSlug}/portal/schedule`)
  return { success: true }
}

export async function saveBookingSettingsAction(
  tenantSlug: string,
  _prevState: WalkerSchedulingState,
  formData: FormData
): Promise<WalkerSchedulingState> {
  if (isDemoTenantSlug(tenantSlug)) return { success: true }

  const { tenant, supabase } = await requireTenantWalker(tenantSlug)

  const travelBufferMinutes = Number(value(formData, 'travel_buffer_minutes') || '15')
  const slotIntervalMinutes = Number(value(formData, 'slot_interval_minutes') || '15')
  const advanceWindowDays = Number(value(formData, 'advance_window_days') || '30')
  const allowSameDayBooking = checked(formData, 'allow_same_day_booking')
  const timeZone = value(formData, 'time_zone')
  const serviceAreaZipCodes = value(formData, 'service_area_zip_codes')
    .split(',')
    .map((zip) => zip.trim())
    .filter(Boolean)

  if (!Number.isFinite(travelBufferMinutes) || travelBufferMinutes < 0 || travelBufferMinutes > 180) {
    return { error: 'Travel buffer must be between 0 and 180 minutes.' }
  }

  if (!Number.isFinite(slotIntervalMinutes) || slotIntervalMinutes < 5 || slotIntervalMinutes > 120) {
    return { error: 'Slot interval must be between 5 and 120 minutes.' }
  }

  if (!Number.isFinite(advanceWindowDays) || advanceWindowDays < 1 || advanceWindowDays > 120) {
    return { error: 'Advance booking window must be between 1 and 120 days.' }
  }

  if (serviceAreaZipCodes.some((zip) => !/^\d{5}$/.test(zip))) {
    return { error: 'Service area ZIP codes must be 5-digit ZIP codes separated by commas.' }
  }

  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(new Date())
  } catch {
    return { error: 'Choose a valid time zone.' }
  }

  const { error: settingsError } = await supabase.from('tenant_booking_settings').upsert({
    tenant_id: tenant.id,
    travel_buffer_minutes: travelBufferMinutes,
    slot_interval_minutes: slotIntervalMinutes,
    advance_window_days: advanceWindowDays,
    allow_same_day_booking: allowSameDayBooking,
    service_area_zip_codes: serviceAreaZipCodes,
  }, {
    onConflict: 'tenant_id',
  })

  if (settingsError) {
    return { error: settingsError.message }
  }

  const { error: tenantError } = await supabase
    .from('tenants')
    .update({ time_zone: timeZone })
    .eq('id', tenant.id)

  if (tenantError) {
    return { error: tenantError.message }
  }

  revalidatePath(`/${tenantSlug}/settings`)
  revalidatePath(`/${tenantSlug}/portal`)
  revalidatePath(`/${tenantSlug}/portal/schedule`)
  return { success: true }
}

export async function addBlockedDateAction(
  tenantSlug: string,
  _prevState: WalkerSchedulingState,
  formData: FormData
): Promise<WalkerSchedulingState> {
  if (isDemoTenantSlug(tenantSlug)) return { success: true }

  const { tenant, user, supabase } = await requireTenantWalker(tenantSlug)
  const startDate = value(formData, 'start_date')
  const endDate = value(formData, 'end_date')
  const reason = value(formData, 'reason')

  if (!startDate || !endDate) {
    return { error: 'Start and end dates are required.' }
  }

  if (startDate > endDate) {
    return { error: 'End date must be on or after the start date.' }
  }

  const { error } = await supabase.from('blocked_dates').insert({
    tenant_id: tenant.id,
    walker_id: user.id,
    start_date: startDate,
    end_date: endDate,
    reason: reason || null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${tenantSlug}/settings`)
  revalidatePath(`/${tenantSlug}/portal`)
  revalidatePath(`/${tenantSlug}/portal/schedule`)
  return { success: true }
}
