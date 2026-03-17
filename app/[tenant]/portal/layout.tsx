import { PortalShell } from '@/components/portal/shell'
import { getDemoRole, isDemoTenantSlug } from '@/lib/demo'
import { createServerClient, createServiceClient } from '@/lib/supabase/server'

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params
  let isAuthenticatedClient = false

  if (isDemoTenantSlug(tenantSlug)) {
    isAuthenticatedClient = (await getDemoRole()) === 'client'
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
        const { data: clientProfile } = await supabase
          .from('client_profiles')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('user_id', user.id)
          .maybeSingle()

        isAuthenticatedClient = !!clientProfile
      }
    }
  }

  return (
    <PortalShell isAuthenticatedClient={isAuthenticatedClient}>{children}</PortalShell>
  )
}
