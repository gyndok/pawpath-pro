import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { DEFAULT_TIME_ZONE } from '@/lib/datetime'
import { extractSubdomain, getTenantBySlug, APP_DOMAIN } from '@/lib/tenant'

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const host = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  // ─── Determine subdomain ─────────────────────────────────────────────────
  let subdomain = extractSubdomain(host)

  // Local dev: support ?tenant=slug for testing tenant routing
  if (!subdomain && searchParams.get('tenant')) {
    subdomain = searchParams.get('tenant')!
  }

  const requestHeaders = new Headers(request.headers)

  // ─── Platform root: no subdomain ─────────────────────────────────────────
  // pawpathpro.com → marketing site + /signup
  if (!subdomain) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ─── Platform admin: app.pawpathpro.com ──────────────────────────────────
  if (subdomain === 'app') {
    // Admin routes handled directly; inject admin flag
    requestHeaders.set('x-is-admin-subdomain', 'true')
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ─── Tenant subdomain: [slug].pawpathpro.com ─────────────────────────────
  const tenant = await getTenantBySlug(subdomain)

  if (!tenant) {
    // Unknown tenant → redirect to marketing site with error
    url.host = APP_DOMAIN
    url.pathname = '/'
    url.searchParams.set('error', 'tenant_not_found')
    return NextResponse.redirect(url)
  }

  // Inject tenant context into headers for all downstream pages/APIs
  requestHeaders.set('x-tenant-id', tenant.id)
  requestHeaders.set('x-tenant-slug', tenant.slug)
  requestHeaders.set('x-tenant-business-name', tenant.business_name)
  requestHeaders.set('x-tenant-plan', tenant.plan_tier)
  requestHeaders.set('x-tenant-time-zone', tenant.time_zone ?? DEFAULT_TIME_ZONE)
  requestHeaders.set('x-tenant-branding-color', tenant.branding_primary_color)
  if (tenant.logo_url) {
    requestHeaders.set('x-tenant-logo-url', tenant.logo_url)
  }

  // Check if tenant subscription is active / within trial
  const trialEnds = new Date(tenant.trial_ends_at)
  const now = new Date()
  const isInTrial = trialEnds > now
  const hasActiveSubscription = !!tenant.stripe_subscription_id && tenant.is_active

  if (!isInTrial && !hasActiveSubscription) {
    // Tenant subscription expired — redirect to billing/reactivate page
    // Allow access to /login so they can log in to reactivate
    if (!pathname.includes('/login') && !pathname.includes('/api/')) {
      url.pathname = `/${subdomain}/billing-expired`
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
