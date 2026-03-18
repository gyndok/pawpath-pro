import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { WalkerShell } from '@/components/walker/shell'
import { createServerClient, createServiceClient } from '@/lib/supabase/server'
import { getTenantBySlug } from '@/lib/tenant'
import { TenantProvider } from '@/lib/context/tenant-context'

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}) {
  const { tenant: slug } = await params

  // Try header first (set by middleware) for performance; fall back to DB lookup
  const headersList = await headers()
  const tenantIdFromHeader = headersList.get('x-tenant-id')

  let tenant
  if (tenantIdFromHeader) {
    // Reconstruct minimal tenant object from headers
    tenant = {
      id:                     tenantIdFromHeader,
      slug:                   headersList.get('x-tenant-slug') || slug,
      business_name:          headersList.get('x-tenant-business-name') || 'PawPath Pro',
      plan_tier:              (headersList.get('x-tenant-plan') || 'starter') as 'starter' | 'pro' | 'agency',
      branding_primary_color: headersList.get('x-tenant-branding-color') || '#7c3aed',
      logo_url:               headersList.get('x-tenant-logo-url') || null,
      owner_user_id:          null,
      stripe_customer_id:     null,
      stripe_subscription_id: null,
      custom_domain:          null,
      created_at:             '',
      trial_ends_at:          '',
      is_active:              true,
    }
  } else {
    // Direct URL access or local dev without header — do DB lookup
    tenant = await getTenantBySlug(slug)
  }

  if (!tenant) notFound()

  let walkerProfile: { photo_url: string | null } | null = null
  const authClient = await createServerClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (user) {
    const supabase = createServiceClient()
    const { data: walker } = await supabase
      .from('tenant_walkers')
      .select('photo_url')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (walker) {
      walkerProfile = {
        photo_url: walker.photo_url ?? null,
      }
    }
  }

  return (
    <TenantProvider tenant={tenant} walkerProfile={walkerProfile}>
      <WalkerShell>{children}</WalkerShell>
    </TenantProvider>
  )
}
