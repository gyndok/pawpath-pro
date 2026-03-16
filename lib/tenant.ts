import { createServiceClient } from './supabase/server'
import { demoTenant, isDemoTenantSlug } from './demo'
import type { Tenant } from '@/types/tenant'

export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'pawpathpro.com'

/**
 * Extract the subdomain from a host string.
 * e.g. "sarahswalks.pawpathpro.com" → "sarahswalks"
 *      "app.pawpathpro.com"         → "app"
 *      "pawpathpro.com"             → null
 *      "localhost:3000"             → null
 */
export function extractSubdomain(host: string): string | null {
  // Strip port
  const hostname = host.split(':')[0]

  // Handle localhost dev (support ?tenant=slug query for local dev)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null
  }

  const domainParts = hostname.split('.')
  const appDomainParts = APP_DOMAIN.split('.')

  // Must have more parts than the base domain to have a subdomain
  if (domainParts.length <= appDomainParts.length) {
    return null
  }

  const subdomain = domainParts[0]
  return subdomain || null
}

/**
 * Look up a tenant by slug. Returns null if not found or inactive.
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  if (isDemoTenantSlug(slug)) {
    return demoTenant
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !data) return null
  return data as Tenant
}

/**
 * Check if a tenant slug is available.
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()
  return !data
}

// Reserved slugs that cannot be used by tenants
export const RESERVED_SLUGS = new Set([
  'app', 'admin', 'api', 'www', 'mail', 'smtp', 'ftp',
  'signup', 'login', 'logout', 'auth', 'static', 'assets',
])
