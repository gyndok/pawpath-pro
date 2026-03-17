import { getDemoRole, isDemoTenantSlug, demoClientProfile, demoPets, demoServices, demoWaiver, demoBookings } from '@/lib/demo'
import { loadPortalBookingOptions } from '@/lib/booking-options'
import { createServerClient, createServiceClient } from '@/lib/supabase/server'
import { PortalPublicHome } from '@/components/portal/public-home'
import { ClientPortalHome } from '@/components/portal/client-home'

export default async function PortalHomePage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params

  if (isDemoTenantSlug(tenantSlug)) {
    const role = await getDemoRole()

    if (role !== 'client') {
      return <PortalPublicHome />
    }

    const serviceNameById = new Map(demoServices.map((service) => [service.id, service.name]))

    return (
      <ClientPortalHome
        tenantSlug={tenantSlug}
        clientName={demoClientProfile.full_name}
        pets={demoPets.filter((pet) => pet.client_id === demoClientProfile.id)}
        services={demoServices}
        hasSignedWaiver
        activeWaiverTitle={demoWaiver.title}
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

  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return <PortalPublicHome />
  }

  const supabase = createServiceClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, owner_user_id')
    .eq('slug', tenantSlug)
    .maybeSingle()

  if (!tenant) {
    return <PortalPublicHome />
  }

  const { data: clientProfile } = await supabase
      .from('client_profiles')
    .select('id, full_name, address')
    .eq('tenant_id', tenant.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!clientProfile) {
    return <PortalPublicHome />
  }

  const { data: activeWaiver } = await supabase
    .from('waivers')
    .select('id, title')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

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

  const [{ data: pets }, { data: waiverSignature }, { data: bookings }, bookingOptions] = await Promise.all([
    supabase
      .from('pets')
      .select('id, name, breed, behavior_notes, special_notes, allergies')
      .eq('tenant_id', tenant.id)
      .eq('client_id', clientProfile.id)
      .order('created_at', { ascending: true }),
    activeWaiver
      ? supabase
          .from('waiver_signatures')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('client_id', clientProfile.id)
          .eq('waiver_id', activeWaiver.id)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('bookings')
      .select('id, scheduled_at, status, service_id')
      .eq('tenant_id', tenant.id)
      .eq('client_id', clientProfile.id)
      .order('scheduled_at', { ascending: true })
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
    <ClientPortalHome
      tenantSlug={tenantSlug}
      clientName={clientProfile.full_name}
      pets={pets ?? []}
      services={bookingOptions.services}
      hasSignedWaiver={!!waiverSignature}
      activeWaiverTitle={activeWaiver?.title ?? null}
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
