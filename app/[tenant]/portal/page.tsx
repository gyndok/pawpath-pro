import { getDemoRole, isDemoTenantSlug, demoClientProfile, demoPets, demoServices, demoWaiver, demoBookings } from '@/lib/demo'
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
    .select('id')
    .eq('slug', tenantSlug)
    .maybeSingle()

  if (!tenant) {
    return <PortalPublicHome />
  }

  const { data: clientProfile } = await supabase
    .from('client_profiles')
    .select('id, full_name')
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

  const [{ data: pets }, { data: services }, { data: waiverSignature }, { data: bookings }] = await Promise.all([
    supabase
      .from('pets')
      .select('id, name, breed, behavior_notes, special_notes, allergies')
      .eq('tenant_id', tenant.id)
      .eq('client_id', clientProfile.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('services')
      .select('id, name, duration_minutes, base_price')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('base_price', { ascending: true }),
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
  ])

  const serviceNameById = new Map((services ?? []).map((service) => [service.id, service.name]))

  return (
    <ClientPortalHome
      tenantSlug={tenantSlug}
      clientName={clientProfile.full_name}
      pets={pets ?? []}
      services={(services ?? []).map((service) => ({
        ...service,
        base_price: Number(service.base_price),
      }))}
      hasSignedWaiver={!!waiverSignature}
      activeWaiverTitle={activeWaiver?.title ?? null}
      bookings={(bookings ?? []).map((booking) => ({
        id: booking.id,
        scheduled_at: booking.scheduled_at,
        status: booking.status,
        service_name: serviceNameById.get(booking.service_id) ?? 'Walk service',
      }))}
    />
  )
}
