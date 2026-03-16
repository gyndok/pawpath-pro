import { PortalScheduleHome } from '@/components/portal/schedule-home'
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
      />
    )
  }

  const { tenant, clientProfile, supabase } = await requireTenantClient(tenantSlug)

  const [{ data: pets }, { data: services }, { data: bookings }] = await Promise.all([
    supabase
      .from('pets')
      .select('id, name')
      .eq('tenant_id', tenant.id)
      .eq('client_id', clientProfile.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('services')
      .select('id, name, duration_minutes, base_price')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('base_price', { ascending: true }),
    supabase
      .from('bookings')
      .select('id, scheduled_at, status, service_id')
      .eq('tenant_id', tenant.id)
      .eq('client_id', clientProfile.id)
      .order('scheduled_at', { ascending: false })
      .limit(6),
  ])

  const serviceNameById = new Map((services ?? []).map((service) => [service.id, service.name]))

  return (
    <PortalScheduleHome
      pets={pets ?? []}
      services={(services ?? []).map((service) => ({ ...service, base_price: Number(service.base_price) }))}
      bookings={(bookings ?? []).map((booking) => ({
        id: booking.id,
        scheduled_at: booking.scheduled_at,
        status: booking.status,
        service_name: serviceNameById.get(booking.service_id) ?? 'Walk service',
      }))}
    />
  )
}
