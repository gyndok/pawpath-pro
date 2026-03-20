import { beginPaymentMethodSetupAction, updateAutopayAction } from '@/lib/actions/client-billing'
import { syncCheckoutSetupSession, isStripePaymentsReady } from '@/lib/payments'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PayInvoiceButton } from '@/components/portal/pay-invoice-button'
import { demoClientProfile, demoInvoices, demoPaymentMethod, isDemoTenantSlug, requireDemoRole } from '@/lib/demo'
import { createServiceClient } from '@/lib/supabase/server'
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
    const paymentParam = typeof query.payment === 'string' ? query.payment : ''
    const paymentMessage = paymentParam === 'success'
      ? 'Demo payment received! This walkthrough simulates a successful invoice payment.'
      : paymentParam === 'cancelled'
        ? 'Demo payment was cancelled.'
        : null

    return (
      <div className="kinetic-shell mx-auto max-w-7xl px-4 py-10">
        <div className="kinetic-card mb-6 rounded-[2rem] bg-[#003fb1] p-8 text-white">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#dbe1ff]">Billing and payments</p>
          <h1 className="mt-3 font-[var(--font-display)] text-4xl font-extrabold tracking-tight">Keep billing clear and easy to trust.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#d4dcff]">Saved cards, autopay, and invoice history all live here so owners always know what is due and what has already been handled.</p>
        </div>

        {paymentMessage && (
          <div className={`mb-6 rounded-md border p-3 text-sm ${
            paymentParam === 'cancelled'
              ? 'border-amber-200 bg-amber-50 text-amber-700'
              : 'border-green-200 bg-green-50 text-green-700'
          }`}>
            {paymentMessage}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] shadow-none">
            <CardHeader className="pb-2">
              <CardDescription>Payment method</CardDescription>
              <CardTitle>{demoPaymentMethod.brand} ending in {demoPaymentMethod.last4}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-stone-500">
              <p>Expires {demoPaymentMethod.exp_month}/{demoPaymentMethod.exp_year}</p>
              <Button type="button" variant="outline" className="w-full" disabled>
                Update card on file
              </Button>
            </CardContent>
          </Card>
          <Card className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] shadow-none">
            <CardHeader className="pb-2">
              <CardDescription>Autopay</CardDescription>
              <CardTitle>{demoPaymentMethod.autopay ? 'Enabled' : 'Off'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-stone-500">
              <p>Demo account shows invoices collected automatically when possible.</p>
              <label className="flex items-center gap-3 text-sm text-stone-700">
                <input type="checkbox" checked={demoPaymentMethod.autopay} readOnly />
                <span>Enable autopay for future completed walks</span>
              </label>
              <Button type="button" variant="outline" className="w-full" disabled>
                Save autopay preference
              </Button>
            </CardContent>
          </Card>
          <Card className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] shadow-none">
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
            <Card key={invoice.id} className="kinetic-card rounded-[1.6rem] border-stone-200 shadow-none">
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
                {invoice.status !== 'paid' && invoice.status !== 'voided' && (
                  <div className="mt-3">
                    <Button type="button" size="sm" className="bg-[#c66a2b] hover:bg-[#ad5821]" disabled>
                      Pay ${Number(invoice.amount).toFixed(2)}
                    </Button>
                  </div>
                )}
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

  const paymentParam = typeof query.payment === 'string' ? query.payment : ''
  const paymentInvoiceId = typeof query.invoice_id === 'string' ? query.invoice_id : ''

  if (paymentParam === 'success' && paymentInvoiceId) {
    const serviceClient = createServiceClient()
    await serviceClient
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        notes: 'Paid via Stripe Checkout.',
      })
      .eq('tenant_id', tenant.id)
      .eq('client_id', clientProfile.id)
      .eq('id', paymentInvoiceId)
      .neq('status', 'paid')
  }

  const paymentMessage = paymentParam === 'success'
    ? 'Payment received! Your invoice has been marked as paid.'
    : paymentParam === 'cancelled'
      ? 'Payment was cancelled. You can try again anytime.'
      : null

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
    <div className="kinetic-shell mx-auto max-w-7xl px-4 py-10">
      <div className="kinetic-card mb-6 rounded-[2rem] bg-[#003fb1] p-8 text-white">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#dbe1ff]">Billing and payments</p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl font-extrabold tracking-tight">A billing view that feels as polished as the service.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#d4dcff]">Store a card, enable autopay, and review invoices without digging through messages or attachments.</p>
      </div>

      {(setupMessage || autopayMessage || paymentMessage) && (
        <div className={`mb-6 rounded-md border p-3 text-sm ${
          paymentParam === 'cancelled'
            ? 'border-amber-200 bg-amber-50 text-amber-700'
            : 'border-green-200 bg-green-50 text-green-700'
        }`}>
          {setupMessage || autopayMessage || paymentMessage}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] shadow-none">
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
        <Card className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] shadow-none">
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
        <Card className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] shadow-none">
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
        <Card className="kinetic-card rounded-[1.6rem] border-stone-200 shadow-none">
          <CardContent className="p-6 text-sm text-stone-500">
            No invoices yet. Charges will appear here once walks are completed and billed.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="kinetic-card rounded-[1.6rem] border-stone-200 shadow-none">
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
                {invoice.status !== 'paid' && invoice.status !== 'voided' && (
                  <div className="mt-3">
                    <PayInvoiceButton
                      invoiceId={invoice.id}
                      tenantSlug={tenantSlug}
                      clientProfileId={clientProfile.id}
                      amount={Number(invoice.amount)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
