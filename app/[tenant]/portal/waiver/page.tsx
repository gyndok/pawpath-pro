import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Sparkles } from 'lucide-react'
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
      <div className="kinetic-shell mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="kinetic-card rounded-[2rem] p-8">
            <Badge className="kinetic-pill mb-4 px-4 py-2 shadow-none">Waiver and service agreement</Badge>
            <h1 className="section-title text-4xl">Review the agreement once, then keep your signature on file for future bookings.</h1>
            <p className="editorial-subtitle mt-5 max-w-2xl">
              This is where liability language, emergency authorization, and service expectations stay visible and signed.
            </p>
          </section>

          <section className="kinetic-card rounded-[2rem] bg-[#003fb1] p-7 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/14">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#dbe1ff]">Agreement status</p>
                <h2 className="font-[var(--font-display)] text-2xl font-bold tracking-tight">Your account is ready once this signature is on file.</h2>
              </div>
            </div>
            <div className="mt-6 rounded-[1.6rem] border border-white/12 bg-white/8 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4" />
                Signed status: yes
              </p>
              <p className="mt-2 text-sm leading-6 text-[#dbe1ff]">
                If the walker updates their waiver in the future, this page becomes the place to review and re-sign the new version.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-6">
        <WaiverSignCard
          waiverTitle={demoWaiver.title}
          waiverBody={demoWaiver.body_text}
          isSigned
          signatureName={demoClientProfile.full_name}
          signedAt={demoWaiver.signed_at}
          timeZone="America/Chicago"
        />
        </div>
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
    <div className="kinetic-shell mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="kinetic-card rounded-[2rem] p-8">
          <Badge className="kinetic-pill mb-4 px-4 py-2 shadow-none">Waiver and service agreement</Badge>
          <h1 className="section-title text-4xl">Review the agreement once, then keep your signature on file for future bookings.</h1>
          <p className="editorial-subtitle mt-5 max-w-2xl">
            Review and sign the current service agreement and liability waiver for {tenant.business_name}. This is the legal foundation for future service requests.
          </p>
        </section>

        <section className="kinetic-card rounded-[2rem] bg-[#003fb1] p-7 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/14">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#dbe1ff]">Agreement status</p>
              <h2 className="font-[var(--font-display)] text-2xl font-bold tracking-tight">
                {signature ? 'Your signature is already on file.' : 'This signature needs to be completed before booking continues.'}
              </h2>
            </div>
          </div>
          <div className="mt-6 rounded-[1.6rem] border border-white/12 bg-white/8 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldCheck className="h-4 w-4" />
              Signed status: {signature ? 'yes' : 'pending'}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#dbe1ff]">
              If the active waiver changes later, this page will show the new version so you can review and re-sign it.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-6">
      <WaiverSignCard
        waiverTitle={waiver?.title || 'Service agreement and liability waiver'}
        waiverBody={waiver?.body_text || 'No active waiver has been configured for this business yet.'}
        isSigned={!!signature}
        signatureName={signature?.signature_name || clientProfile.full_name}
        signedAt={signature?.signed_at || null}
        timeZone={tenant.time_zone}
      />
      </div>
    </div>
  )
}
