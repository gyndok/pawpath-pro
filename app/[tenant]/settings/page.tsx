import { WalkerSettingsHome } from '@/components/walker/settings-home'
import { demoServices, demoWaiver, isDemoTenantSlug, requireDemoRole } from '@/lib/demo'
import { requireTenantWalker } from '@/lib/tenant-session'

export default async function WalkerSettingsPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params

  if (isDemoTenantSlug(tenantSlug)) {
    await requireDemoRole('walker', tenantSlug)
    return (
      <WalkerSettingsHome
        services={demoServices}
        activeWaiverTitle={demoWaiver.title}
      />
    )
  }

  const { tenant, supabase } = await requireTenantWalker(tenantSlug)

  const [{ data: services }, { data: activeWaiver }] = await Promise.all([
    supabase
      .from('services')
      .select('id, name, description, duration_minutes, base_price, is_active')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('waivers')
      .select('title')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return (
    <WalkerSettingsHome
      services={(services ?? []).map((service) => ({ ...service, base_price: Number(service.base_price) }))}
      activeWaiverTitle={activeWaiver?.title ?? null}
    />
  )
}
