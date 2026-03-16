import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { demoClientProfile, demoInvoices, demoPaymentMethod, isDemoTenantSlug, requireDemoRole } from '@/lib/demo'
import { requireTenantClient } from '@/lib/tenant-session'

export default async function PortalBillingPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params

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

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, amount, status, due_date, paid_at, created_at')
    .eq('tenant_id', tenant.id)
    .eq('client_id', clientProfile.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-sm text-stone-500">Invoices and payment status for your account.</p>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
