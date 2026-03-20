'use server'

import { revalidatePath } from 'next/cache'
import { zonedDateTimeToUtc } from '@/lib/datetime'
import { buildAvailableDatesByService, DEFAULT_BOOKING_SETTINGS, isClientInServiceArea } from '@/lib/scheduling'
import { isDemoTenantSlug } from '@/lib/demo'
import { createServerClient, createServiceClient } from '@/lib/supabase/server'

export type ClientBookingState = {
  error?: string
  success?: boolean
}

function value(formData: FormData, key: string) {
  const raw = formData.get(key)
  return typeof raw === 'string' ? raw.trim() : ''
}

export async function requestBookingAction(
  tenantSlug: string,
  _prevState: ClientBookingState,
  formData: FormData
): Promise<ClientBookingState> {
  const serviceId = value(formData, 'service_id')
  const petIds = formData
    .getAll('pet_ids')
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean)
  const date = value(formData, 'date')
  const time = value(formData, 'time')
  const notes = value(formData, 'notes')

  if (!serviceId || !petIds.length || !date || !time) {
    return { error: 'Service, at least one pet, date, and time are required.' }
  }

  if (isDemoTenantSlug(tenantSlug)) {
    return { success: true }
  }

  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to request a booking.' }
  }

  const supabase = createServiceClient()

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, owner_user_id, time_zone')
    .eq('slug', tenantSlug)
    .single()

  if (tenantError || !tenant) {
    return { error: 'Business not found.' }
  }

  const { data: clientProfile, error: profileError } = await supabase
    .from('client_profiles')
    .select('id, address')
    .eq('tenant_id', tenant.id)
    .eq('user_id', user.id)
    .single()

  if (profileError || !clientProfile) {
    return { error: 'Client profile not found for this business.' }
  }

  const { data: activeWaiver } = await supabase
    .from('waivers')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (activeWaiver) {
    const { data: waiverSignature } = await supabase
      .from('waiver_signatures')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('client_id', clientProfile.id)
      .eq('waiver_id', activeWaiver.id)
      .maybeSingle()

    if (!waiverSignature) {
      return { error: 'You must review and sign the current waiver before requesting a booking.' }
    }
  }

  const { data: pets, error: petError } = await supabase
    .from('pets')
    .select('id')
    .in('id', petIds)
    .eq('tenant_id', tenant.id)
    .eq('client_id', clientProfile.id)
    

  if (petError || !pets || pets.length !== petIds.length) {
    return { error: 'One or more selected pets could not be found.' }
  }

  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, name, duration_minutes, base_price')
    .eq('id', serviceId)
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .single()

  if (serviceError || !service) {
    return { error: 'Selected service is not available.' }
  }

  let walkerId = tenant.owner_user_id

  if (!walkerId) {
    const { data: walker } = await supabase
      .from('tenant_walkers')
      .select('user_id')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    walkerId = walker?.user_id ?? null
  }

  if (!walkerId) {
    return { error: 'This business is not ready to accept bookings yet.' }
  }

  const [bookingSettingsResult, availabilityResult, blockedDatesResult, futureBookingsResult] = await Promise.all([
    supabase
      .from('tenant_booking_settings')
      .select('travel_buffer_minutes, slot_interval_minutes, advance_window_days, allow_same_day_booking, service_area_zip_codes')
      .eq('tenant_id', tenant.id)
      .maybeSingle(),
    supabase
      .from('availability')
      .select('day_of_week, start_time, end_time, is_active')
      .eq('tenant_id', tenant.id)
      .eq('walker_id', walkerId)
      .eq('is_active', true),
    supabase
      .from('blocked_dates')
      .select('start_date, end_date, reason')
      .eq('tenant_id', tenant.id)
      .eq('walker_id', walkerId),
    supabase
      .from('bookings')
      .select('scheduled_at, status, services(duration_minutes)')
      .eq('tenant_id', tenant.id)
      .eq('walker_id', walkerId)
      .in('status', ['pending', 'approved'])
      .gte('scheduled_at', new Date().toISOString()),
  ])

  const bookingSettings = bookingSettingsResult.error
    ? DEFAULT_BOOKING_SETTINGS
    : {
        ...DEFAULT_BOOKING_SETTINGS,
        ...bookingSettingsResult.data,
        service_area_zip_codes: bookingSettingsResult.data?.service_area_zip_codes ?? DEFAULT_BOOKING_SETTINGS.service_area_zip_codes,
        time_zone: tenant.time_zone,
      }

  const geofence = isClientInServiceArea(clientProfile.address, bookingSettings.service_area_zip_codes)
  if (!geofence.allowed) {
    return { error: geofence.clientZip ? `Your ZIP code (${geofence.clientZip}) is outside this walker's service area.` : 'Add a valid 5-digit ZIP code to your address before booking.' }
  }

  const scheduledAt = zonedDateTimeToUtc(date, time, tenant.time_zone)
  if (Number.isNaN(scheduledAt.getTime())) {
    return { error: 'Choose a valid date and time.' }
  }

  const normalizedBookings = (futureBookingsResult.data ?? []).map((booking: {
    scheduled_at: string
    status: string
    services: { duration_minutes: number } | { duration_minutes: number }[] | null
  }) => ({
    scheduled_at: booking.scheduled_at,
    status: booking.status,
    duration_minutes: Array.isArray(booking.services)
      ? booking.services[0]?.duration_minutes ?? 30
      : booking.services?.duration_minutes ?? 30,
  }))

  const availableDates = buildAvailableDatesByService({
    services: [{ ...service, base_price: Number(service.base_price) }],
    availability: availabilityResult.data ?? [],
    blockedDates: blockedDatesResult.data ?? [],
    bookings: normalizedBookings,
    settings: bookingSettings,
  })

  const slotAvailable = availableDates[service.id]?.some((group) =>
    group.date === date && group.slots.some((slot) => slot.time === time)
  )

  if (!slotAvailable) {
    return { error: 'That time is no longer available. Please choose one of the currently open slots.' }
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      tenant_id: tenant.id,
      client_id: clientProfile.id,
      walker_id: walkerId,
      service_id: service.id,
      scheduled_at: scheduledAt.toISOString(),
      status: 'pending',
      notes: notes || null,
    })
    .select('id')
    .single()

  if (bookingError || !booking) {
    return { error: bookingError?.message || 'Failed to create booking request.' }
  }

  const { error: bookingPetError } = await supabase.from('booking_pets').insert(
    pets.map((pet) => ({
      booking_id: booking.id,
      pet_id: pet.id,
      tenant_id: tenant.id,
    }))
  )

  if (bookingPetError) {
    await supabase.from('bookings').delete().eq('id', booking.id)
    return { error: bookingPetError.message }
  }

  revalidatePath(`/${tenantSlug}/portal`)
  revalidatePath(`/${tenantSlug}/portal/schedule`)
  revalidatePath(`/${tenantSlug}/dashboard`)
  revalidatePath(`/${tenantSlug}/schedule`)

  return { success: true }
}
