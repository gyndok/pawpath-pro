import { notFound } from 'next/navigation'
import { PortalShell } from '@/components/portal/shell'
import { TenantProvider } from '@/lib/context/tenant-context'
import { demoClientProfile, demoTenant, getDemoRole, isDemoTenantSlug } from '@/lib/demo'
import { createServerClient, createServiceClient } from '@/lib/supabase/server'
import { getTenantBySlug } from '@/lib/tenant'

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params
  let isAuthenticatedClient = false
  let clientProfile: { full_name: string; photo_url: string | null } | null = null
  const tenant = isDemoTenantSlug(tenantSlug) ? demoTenant : await getTenantBySlug(tenantSlug)

  if (!tenant) notFound()

  if (isDemoTenantSlug(tenantSlug)) {
    isAuthenticatedClient = (await getDemoRole()) === 'client'
    if (isAuthenticatedClient) {
      clientProfile = {
        full_name: demoClientProfile.full_name,
        photo_url: demoClientProfile.photo_url ?? null,
      }
    }
  } else {
    const authClient = await createServerClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (user) {
      const supabase = createServiceClient()
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', tenantSlug)
        .maybeSingle()

      if (tenant) {
        const { data: profile } = await supabase
          .from('client_profiles')
          .select('id, full_name, photo_url')
          .eq('tenant_id', tenant.id)
          .eq('user_id', user.id)
          .maybeSingle()

        isAuthenticatedClient = !!profile
        if (profile) {
          clientProfile = {
            full_name: profile.full_name,
            photo_url: profile.photo_url ?? null,
          }
        }
      }
    }
  }

  return (
    <TenantProvider tenant={tenant} clientProfile={clientProfile}>
      <PortalShell isAuthenticatedClient={isAuthenticatedClient}>{children}</PortalShell>
    </TenantProvider>
  )
}
