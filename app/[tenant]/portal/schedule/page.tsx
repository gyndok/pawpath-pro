import { PortalScheduleHome } from '@/components/portal/schedule-home'
import { loadPortalBookingOptions } from '@/lib/booking-options'
import { demoBookings, demoClientProfile, demoPets, demoServices, isDemoTenantSlug, requireDemoRole } from '@/lib/demo'
import { requireTenantClient } from '@/lib/tenant-session'

export default async function PortalSchedulePage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params

  if (isDemoTenantSlug(tenantSlug)) {
    await requireDemoRole('client', tenantSlug)
    const serviceNameById = new Map(demoServices.map((service) => [service.id, service.name]))

    return (
      <PortalScheduleHome
        pets={demoPets.filter((pet) => pet.client_id === demoClientProfile.id).map((pet) => ({ id: pet.id, name: pet.name }))}
        services={demoServices}
        bookings={demoBookings
          .filter((booking) => booking.client_id === demoClientProfile.id)
          .map((booking) => ({
            id: booking.id,
            scheduled_at: booking.scheduled_at,
            status: booking.status,
            service_name: serviceNameById.get(booking.service_id) ?? 'Walk service',
          }))}
        availableDatesByService={{
          'demo-service-1': [
            {
              date: '2026-08-18',
              label: 'Tue · Aug 18',
              slots: [
                { iso: '2026-08-18T18:00:00.000Z', date: '2026-08-18', time: '13:00', label: '1:00 PM' },
                { iso: '2026-08-18T19:00:00.000Z', date: '2026-08-18', time: '14:00', label: '2:00 PM' },
              ],
            },
          ],
          'demo-service-2': [
            {
              date: '2026-08-19',
              label: 'Wed · Aug 19',
              slots: [
                { iso: '2026-08-19T14:30:00.000Z', date: '2026-08-19', time: '09:30', label: '9:30 AM' },
              ],
            },
          ],
          'demo-service-3': [
            {
              date: '2026-08-20',
              label: 'Thu · Aug 20',
              slots: [
                { iso: '2026-08-20T16:00:00.000Z', date: '2026-08-20', time: '11:00', label: '11:00 AM' },
              ],
            },
          ],
        }}
      />
    )
  }

  const { tenant, clientProfile, supabase } = await requireTenantClient(tenantSlug)

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

  const [{ data: pets }, { data: bookings }, bookingOptions] = await Promise.all([
    supabase
      .from('pets')
      .select('id, name')
      .eq('tenant_id', tenant.id)
      .eq('client_id', clientProfile.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('bookings')
      .select('id, scheduled_at, status, service_id')
      .eq('tenant_id', tenant.id)
      .eq('client_id', clientProfile.id)
      .order('scheduled_at', { ascending: false })
      .limit(6),
    loadPortalBookingOptions({
      supabase,
      tenantId: tenant.id,
      walkerId,
      clientAddress: clientProfile.address,
    }),
  ])

  const serviceNameById = new Map((bookingOptions.services ?? []).map((service) => [service.id, service.name]))

  return (
    <PortalScheduleHome
      pets={pets ?? []}
      services={bookingOptions.services}
      bookings={(bookings ?? []).map((booking) => ({
        id: booking.id,
        scheduled_at: booking.scheduled_at,
        status: booking.status,
        service_name: serviceNameById.get(booking.service_id) ?? 'Walk service',
      }))}
      availableDatesByService={bookingOptions.availableDatesByService}
      geofenceMessage={bookingOptions.geofenceMessage}
    />
  )
}
