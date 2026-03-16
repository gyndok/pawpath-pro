import { WaiverSignCard } from '@/components/portal/waiver-sign-card'
import { demoClientProfile, demoWaiver, isDemoTenantSlug, requireDemoRole } from '@/lib/demo'
import { requireTenantClient } from '@/lib/tenant-session'

export default async function PortalWaiverPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params

  if (isDemoTenantSlug(tenantSlug)) {
    await requireDemoRole('client', tenantSlug)

    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Waiver</h1>
          <p className="text-sm text-stone-500">Review and sign the current service agreement and liability waiver.</p>
        </div>

        <WaiverSignCard
          waiverTitle={demoWaiver.title}
          waiverBody={demoWaiver.body_text}
          isSigned
          signatureName={demoClientProfile.full_name}
          signedAt={demoWaiver.signed_at}
        />
      </div>
    )
  }

  const { tenant, clientProfile, supabase } = await requireTenantClient(tenantSlug)

  const { data: waiver } = await supabase
    .from('waivers')
    .select('id, title, body_text')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: signature } = waiver
    ? await supabase
        .from('waiver_signatures')
        .select('signature_name, signed_at')
        .eq('tenant_id', tenant.id)
        .eq('client_id', clientProfile.id)
        .eq('waiver_id', waiver.id)
        .maybeSingle()
    : { data: null }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Waiver</h1>
        <p className="text-sm text-stone-500">Review and sign the current service agreement and liability waiver.</p>
      </div>

      <WaiverSignCard
        waiverTitle={waiver?.title || 'Service agreement and liability waiver'}
        waiverBody={waiver?.body_text || 'No active waiver has been configured for this business yet.'}
        isSigned={!!signature}
        signatureName={signature?.signature_name || clientProfile.full_name}
        signedAt={signature?.signed_at || null}
      />
    </div>
  )
}
