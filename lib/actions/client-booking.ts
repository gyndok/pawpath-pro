'use server'

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
  const petId = value(formData, 'pet_id')
  const date = value(formData, 'date')
  const time = value(formData, 'time')
  const notes = value(formData, 'notes')

  if (!serviceId || !petId || !date || !time) {
    return { error: 'Service, pet, date, and time are required.' }
  }

  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to request a booking.' }
  }

  const supabase = createServiceClient()

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, owner_user_id')
    .eq('slug', tenantSlug)
    .single()

  if (tenantError || !tenant) {
    return { error: 'Business not found.' }
  }

  const { data: clientProfile, error: profileError } = await supabase
    .from('client_profiles')
    .select('id')
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

  const { data: pet, error: petError } = await supabase
    .from('pets')
    .select('id')
    .eq('id', petId)
    .eq('tenant_id', tenant.id)
    .eq('client_id', clientProfile.id)
    .single()

  if (petError || !pet) {
    return { error: 'Selected pet could not be found.' }
  }

  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id')
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

  const scheduledAt = new Date(`${date}T${time}:00`)
  if (Number.isNaN(scheduledAt.getTime())) {
    return { error: 'Choose a valid date and time.' }
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

  const { error: bookingPetError } = await supabase.from('booking_pets').insert({
    booking_id: booking.id,
    pet_id: pet.id,
    tenant_id: tenant.id,
  })

  if (bookingPetError) {
    await supabase.from('bookings').delete().eq('id', booking.id)
    return { error: bookingPetError.message }
  }

  return { success: true }
}
