export type PlanTier = 'starter' | 'pro' | 'agency'

export interface Tenant {
  id: string
  slug: string
  business_name: string
  owner_user_id: string | null
  plan_tier: PlanTier
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  custom_domain: string | null
  branding_primary_color: string
  logo_url: string | null
  created_at: string
  trial_ends_at: string
  is_active: boolean
}

export interface TenantContext {
  tenant: Tenant
  isWalker: boolean
  isOwner: boolean
}
