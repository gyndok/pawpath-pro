'use server'

import { createServerClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const PLATFORM_ADMIN_EMAIL = process.env.PLATFORM_ADMIN_EMAIL || 'geffrey@pawpathpro.com'

export async function requirePlatformAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== PLATFORM_ADMIN_EMAIL) {
    redirect('/')
  }

  return user
}

export async function getAdminStats() {
  const supabase = createServiceClient()

  const [tenantsResult, activeResult] = await Promise.all([
    supabase.from('tenants').select('*').order('created_at', { ascending: false }),
    supabase.from('tenants').select('id', { count: 'exact' }).eq('is_active', true),
  ])

  const tenants = tenantsResult.data || []
  const activeCount = activeResult.count || 0

  // MRR calculation based on plan tiers
  const planPrices = { starter: 29, pro: 59, agency: 99 }
  const subscribedTenants = tenants.filter(t => t.stripe_subscription_id && t.is_active)
  const mrr = subscribedTenants.reduce((sum, t) => {
    return sum + (planPrices[t.plan_tier as keyof typeof planPrices] || 0)
  }, 0)

  return {
    tenants,
    totalCount: tenants.length,
    activeCount,
    mrr,
    trialCount: tenants.filter(t => !t.stripe_subscription_id && t.is_active).length,
  }
}
