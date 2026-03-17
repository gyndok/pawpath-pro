import { WalkerSettingsHome } from '@/components/walker/settings-home'
import { SubscriptionCard } from '@/components/walker/subscription-card'
import { demoServices, demoWaiver, isDemoTenantSlug, requireDemoRole } from '@/lib/demo'
import { DEFAULT_BOOKING_SETTINGS } from '@/lib/scheduling'
import { requireTenantWalker } from '@/lib/tenant-session'

export default async function WalkerSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { tenant: tenantSlug } = await params
  const query = await searchParams
  const checkoutStatus = typeof query.checkout === 'string' ? query.checkout : undefined

  if (isDemoTenantSlug(tenantSlug)) {
    await requireDemoRole('walker', tenantSlug)
    return (
      <WalkerSettingsHome
        services={demoServices}
        activeWaiverTitle={demoWaiver.title}
        availability={[]}
        blockedDates={[]}
        bookingSettings={DEFAULT_BOOKING_SETTINGS}
      />
    )
  }

  const { tenant, user, supabase } = await requireTenantWalker(tenantSlug)

  const [{ data: services }, { data: activeWaiver }, { data: availability }, { data: blockedDates }, bookingSettingsResult] = await Promise.all([
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
    supabase
      .from('availability')
      .select('day_of_week, start_time, end_time, is_active')
      .eq('tenant_id', tenant.id)
      .eq('walker_id', user.id)
      .order('day_of_week', { ascending: true }),
    supabase
      .from('blocked_dates')
      .select('id, start_date, end_date, reason')
      .eq('tenant_id', tenant.id)
      .eq('walker_id', user.id)
      .order('start_date', { ascending: true })
      .limit(12),
    supabase
      .from('tenant_booking_settings')
      .select('travel_buffer_minutes, slot_interval_minutes, advance_window_days, allow_same_day_booking, service_area_zip_codes')
      .eq('tenant_id', tenant.id)
      .maybeSingle(),
  ])

  const bookingSettings = bookingSettingsResult.error
    ? DEFAULT_BOOKING_SETTINGS
    : {
        ...DEFAULT_BOOKING_SETTINGS,
        ...bookingSettingsResult.data,
        service_area_zip_codes: bookingSettingsResult.data?.service_area_zip_codes ?? DEFAULT_BOOKING_SETTINGS.service_area_zip_codes,
      }

  return (
    <>
      <div className="max-w-6xl p-6 pb-0">
        <SubscriptionCard
          tenantId={tenant.id}
          planTier={tenant.plan_tier as 'starter' | 'pro' | 'agency'}
          stripeCustomerId={tenant.stripe_customer_id}
          stripeSubscriptionId={tenant.stripe_subscription_id}
          trialEndsAt={tenant.trial_ends_at}
          isActive={tenant.is_active}
          checkoutStatus={checkoutStatus}
        />
      </div>
      <WalkerSettingsHome
        services={(services ?? []).map((service) => ({ ...service, base_price: Number(service.base_price) }))}
        activeWaiverTitle={activeWaiver?.title ?? null}
        availability={availability ?? []}
        blockedDates={blockedDates ?? []}
        bookingSettings={bookingSettings}
      />
    </>
  )
}
