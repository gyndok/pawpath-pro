import { beginPaymentMethodSetupAction, updateAutopayAction } from '@/lib/actions/client-billing'
import { syncCheckoutSetupSession, isStripePaymentsReady } from '@/lib/payments'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { demoClientProfile, demoInvoices, demoPaymentMethod, isDemoTenantSlug, requireDemoRole } from '@/lib/demo'
import { requireTenantClient } from '@/lib/tenant-session'

export default async function PortalBillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { tenant: tenantSlug } = await params
  const query = await searchParams

  if (isDemoTenantSlug(tenantSlug)) {
    await requireDemoRole('client', tenantSlug)
    const invoices = demoInvoices.filter((invoice) => invoice.client_id === demoClientProfile.id)

    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-sm text-stone-500">Invoices, payment status, and your saved payment method.</p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card className="border-stone-200">
            <CardHeader className="pb-2">
              <CardDescription>Payment method</CardDescription>
              <CardTitle>{demoPaymentMethod.brand} ending in {demoPaymentMethod.last4}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-stone-500">
              Expires {demoPaymentMethod.exp_month}/{demoPaymentMethod.exp_year}
            </CardContent>
          </Card>
          <Card className="border-stone-200">
            <CardHeader className="pb-2">
              <CardDescription>Autopay</CardDescription>
              <CardTitle>{demoPaymentMethod.autopay ? 'Enabled' : 'Off'}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-stone-500">
              Demo account shows invoices collected automatically when possible.
            </CardContent>
          </Card>
          <Card className="border-stone-200">
            <CardHeader className="pb-2">
              <CardDescription>Open balance</CardDescription>
              <CardTitle>${invoices.filter((invoice) => invoice.status !== 'paid').reduce((sum, invoice) => sum + invoice.amount, 0).toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-stone-500">
              Includes sent and upcoming demo invoices
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="border-stone-200">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>${Number(invoice.amount).toFixed(2)}</CardTitle>
                    <CardDescription>Issued {new Date(invoice.created_at).toLocaleDateString()}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="capitalize">{invoice.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-stone-600">
                <p>Due date: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Not set'}</p>
                <p>Paid at: {invoice.paid_at ? new Date(invoice.paid_at).toLocaleString() : 'Not yet paid'}</p>
                {invoice.notes && <p>Notes: {invoice.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const { tenant, clientProfile, supabase } = await requireTenantClient(tenantSlug)

  const setupParam = typeof query.setup === 'string' ? query.setup : ''
  const sessionId = typeof query.session_id === 'string' ? query.session_id : ''
  let setupMessage: string | null = null

  if (setupParam === 'success' && sessionId && isStripePaymentsReady()) {
    try {
      const result = await syncCheckoutSetupSession({
        supabase,
        clientProfileId: clientProfile.id,
        sessionId,
      })

      setupMessage = result.ok
        ? 'Card on file saved successfully. Autopay is now enabled.'
        : result.reason
    } catch (error) {
      setupMessage = error instanceof Error ? error.message : 'Failed to sync your saved card.'
    }
  } else if (setupParam === 'cancelled') {
    setupMessage = 'Card setup was cancelled.'
  } else if (setupParam === 'unavailable') {
    setupMessage = 'Stripe payments are not configured yet for this portal.'
  }

  const autopayParam = typeof query.autopay === 'string' ? query.autopay : ''
  const autopayMessage = autopayParam === 'enabled'
    ? 'Autopay enabled.'
    : autopayParam === 'disabled'
      ? 'Autopay disabled.'
      : null

  const { data: refreshedClientProfile } = await supabase
    .from('client_profiles')
    .select('stripe_card_brand, stripe_card_last4, stripe_card_exp_month, stripe_card_exp_year, autopay_enabled, stripe_payment_method_id')
    .eq('id', clientProfile.id)
    .single()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, amount, status, due_date, paid_at, created_at, notes')
    .eq('tenant_id', tenant.id)
    .eq('client_id', clientProfile.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-sm text-stone-500">Invoices, payment status, and your saved payment method.</p>
      </div>

      {(setupMessage || autopayMessage) && (
        <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {setupMessage || autopayMessage}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardDescription>Payment method</CardDescription>
            <CardTitle>
              {refreshedClientProfile?.stripe_card_brand && refreshedClientProfile?.stripe_card_last4
                ? `${refreshedClientProfile.stripe_card_brand} ending in ${refreshedClientProfile.stripe_card_last4}`
                : 'No card on file'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-500">
            <p>
              {refreshedClientProfile?.stripe_card_exp_month && refreshedClientProfile?.stripe_card_exp_year
                ? `Expires ${refreshedClientProfile.stripe_card_exp_month}/${refreshedClientProfile.stripe_card_exp_year}`
                : 'Add a payment method to enable autopay after completed walks.'}
            </p>
            <form action={beginPaymentMethodSetupAction.bind(null, tenantSlug)}>
              <Button type="submit" variant="outline" className="w-full">
                {refreshedClientProfile?.stripe_payment_method_id ? 'Update card on file' : 'Add card on file'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardDescription>Autopay</CardDescription>
            <CardTitle>{refreshedClientProfile?.autopay_enabled ? 'Enabled' : 'Off'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-500">
            <p>When enabled, completed walks attempt automatic payment using your saved card.</p>
            <form action={updateAutopayAction.bind(null, tenantSlug)} className="space-y-3">
              <label className="flex items-center gap-3 text-sm text-stone-700">
                <input
                  type="checkbox"
                  name="autopay_enabled"
                  defaultChecked={!!refreshedClientProfile?.autopay_enabled}
                />
                <span>Enable autopay for future completed walks</span>
              </label>
              <Button type="submit" variant="outline" className="w-full">Save autopay preference</Button>
            </form>
          </CardContent>
        </Card>
        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardDescription>Open balance</CardDescription>
            <CardTitle>${(invoices ?? []).filter((invoice) => invoice.status !== 'paid').reduce((sum, invoice) => sum + Number(invoice.amount), 0).toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-stone-500">
            Includes sent, viewed, and overdue invoices still awaiting collection.
          </CardContent>
        </Card>
      </div>

      {!invoices?.length ? (
        <Card className="border-stone-200">
          <CardContent className="p-6 text-sm text-stone-500">
            No invoices yet. Charges will appear here once walks are completed and billed.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="border-stone-200">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>${Number(invoice.amount).toFixed(2)}</CardTitle>
                    <CardDescription>Issued {new Date(invoice.created_at).toLocaleDateString()}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="capitalize">{invoice.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-stone-600">
                <p>Due date: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Not set'}</p>
                <p>Paid at: {invoice.paid_at ? new Date(invoice.paid_at).toLocaleString() : 'Not yet paid'}</p>
                {invoice.notes && <p>Notes: {invoice.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
