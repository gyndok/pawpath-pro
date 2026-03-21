import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildAvailableDatesByService,
  DEFAULT_BOOKING_SETTINGS,
  isClientInServiceArea,
  type BookingSettings,
} from '@/lib/scheduling'

type ServiceRow = {
  id: string
  name: string
  duration_minutes: number
  base_price: number | string
  service_kind?: string | null
}

export async function loadPortalBookingOptions(params: {
  supabase: SupabaseClient
  tenantId: string
  walkerId: string | null
  clientAddress: string | null
  tenantTimeZone?: string | null
}) {
  const { supabase, tenantId, walkerId, clientAddress, tenantTimeZone } = params

  const [{ data: services }, bookingSettingsResult] = await Promise.all([
    supabase
      .from('services')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('base_price', { ascending: true }),
    supabase
      .from('tenant_booking_settings')
      .select('travel_buffer_minutes, slot_interval_minutes, advance_window_days, allow_same_day_booking, service_area_zip_codes')
      .eq('tenant_id', tenantId)
      .maybeSingle(),
  ])

  const normalizedServices = (services ?? []).map((service: ServiceRow) => ({
    ...service,
    base_price: Number(service.base_price),
    service_kind: service.service_kind ?? 'standard',
  }))

  const bookingSettings: BookingSettings = bookingSettingsResult.error
    ? DEFAULT_BOOKING_SETTINGS
    : {
        ...DEFAULT_BOOKING_SETTINGS,
        ...bookingSettingsResult.data,
        service_area_zip_codes: bookingSettingsResult.data?.service_area_zip_codes ?? DEFAULT_BOOKING_SETTINGS.service_area_zip_codes,
      }

  const geofence = isClientInServiceArea(clientAddress, bookingSettings.service_area_zip_codes)

  if (!walkerId) {
    return {
      services: normalizedServices,
      availableDatesByService: {},
      geofenceMessage: 'This business is not ready to accept bookings yet.',
    }
  }

  if (!geofence.allowed) {
    return {
      services: normalizedServices,
      availableDatesByService: {},
      geofenceMessage: geofence.clientZip
        ? `Your profile ZIP code (${geofence.clientZip}) is currently outside this walker's service area.`
        : 'Add a 5-digit ZIP code to your address before requesting a walk in the service area.',
    }
  }

  const [{ data: availability }, { data: blockedDates }, { data: futureBookings }] = await Promise.all([
    supabase
      .from('availability')
      .select('day_of_week, start_time, end_time, is_active')
      .eq('tenant_id', tenantId)
      .eq('walker_id', walkerId)
      .eq('is_active', true),
    supabase
      .from('blocked_dates')
      .select('start_date, end_date, reason')
      .eq('tenant_id', tenantId)
      .eq('walker_id', walkerId),
    supabase
      .from('bookings')
      .select('scheduled_at, status, services(duration_minutes)')
      .eq('tenant_id', tenantId)
      .eq('walker_id', walkerId)
      .in('status', ['pending', 'approved'])
      .gte('scheduled_at', new Date().toISOString()),
  ])

  const normalizedBookings = (futureBookings ?? []).map((booking: {
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

  return {
    services: normalizedServices,
    availableDatesByService: buildAvailableDatesByService({
      services: normalizedServices,
      availability: availability ?? [],
      blockedDates: blockedDates ?? [],
      bookings: normalizedBookings,
      settings: {
        ...bookingSettings,
        time_zone: tenantTimeZone ?? bookingSettings.time_zone ?? DEFAULT_BOOKING_SETTINGS.time_zone,
      },
      now: new Date(),
    }),
    geofenceMessage: null,
    bookingSettings,
  }
}
