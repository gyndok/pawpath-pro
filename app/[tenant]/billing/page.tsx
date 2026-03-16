import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { demoBookings, demoClients, demoInvoices, demoServices, demoWalks, isDemoTenantSlug, requireDemoRole } from '@/lib/demo'
import { sendInvoiceReminderAction, updateInvoiceStatusAction } from '@/lib/actions/walker-invoices'
import { requireTenantWalker } from '@/lib/tenant-session'

function currency(amount: number) {
  return `$${amount.toFixed(2)}`
}

function invoiceTone(status: string) {
  if (status === 'paid') return 'bg-green-100 text-green-700'
  if (status === 'overdue') return 'bg-red-100 text-red-700'
  if (status === 'voided') return 'bg-stone-200 text-stone-700'
  return 'bg-amber-100 text-amber-700'
}

export default async function WalkerBillingPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params
  type InvoiceRow = {
    id: string
    client_id: string
    walk_id: string | null
    amount: number
    status: string
    due_date: string | null
    paid_at: string | null
    notes: string | null
    created_at: string
  }
  type ClientRow = { id: string; full_name: string }
  type WalkRow = { id: string; booking_id: string }
  type BookingRow = { id: string; service_id: string; scheduled_at: string }
  type ServiceRow = { id: string; name: string }

  let businessName = 'PawPath Pro'
  let invoices: InvoiceRow[] = demoInvoices
  let clients: ClientRow[] = demoClients.map((client) => ({ id: client.id, full_name: client.full_name }))
  let walks: WalkRow[] = demoWalks.map((walk) => ({ id: walk.id, booking_id: walk.booking_id }))
  let bookings: BookingRow[] = demoBookings.map((booking) => ({ id: booking.id, service_id: booking.service_id, scheduled_at: booking.scheduled_at }))
  let services: ServiceRow[] = demoServices.map((service) => ({ id: service.id, name: service.name }))

  if (isDemoTenantSlug(tenantSlug)) {
    await requireDemoRole('walker', tenantSlug)
    businessName = 'Maple & Main Dog Walking'
  } else {
    const { tenant, supabase } = await requireTenantWalker(tenantSlug)
    businessName = tenant.business_name

    const results = await Promise.all([
      supabase
        .from('invoices')
        .select('id, client_id, walk_id, amount, status, due_date, paid_at, notes, created_at')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('client_profiles')
        .select('id, full_name')
        .eq('tenant_id', tenant.id),
      supabase
        .from('walks')
        .select('id, booking_id')
        .eq('tenant_id', tenant.id),
      supabase
        .from('bookings')
        .select('id, service_id, scheduled_at')
        .eq('tenant_id', tenant.id),
      supabase
        .from('services')
        .select('id, name')
        .eq('tenant_id', tenant.id),
    ])

    invoices = (results[0].data ?? []).map((invoice) => ({ ...invoice, amount: Number(invoice.amount) }))
    clients = results[1].data ?? []
    walks = results[2].data ?? []
    bookings = results[3].data ?? []
    services = results[4].data ?? []
  }

  const clientById = new Map(clients.map((client) => [client.id, client.full_name]))
  const bookingById = new Map(bookings.map((booking) => [booking.id, booking]))
  const walkById = new Map(walks.map((walk) => [walk.id, walk]))
  const serviceById = new Map(services.map((service) => [service.id, service.name]))

  const unpaidInvoices = invoices.filter((invoice) => !['paid', 'voided'].includes(invoice.status))
  const overdueInvoices = invoices.filter((invoice) => invoice.status === 'overdue')
  const paidInvoices = invoices.filter((invoice) => invoice.status === 'paid')

  return (
    <div className="max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-sm text-stone-500">Track invoice status, log reminders, and mark invoices paid manually.</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardDescription>Open invoices</CardDescription>
            <CardTitle>{unpaidInvoices.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-stone-500">
            {currency(unpaidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0))}
          </CardContent>
        </Card>
        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardDescription>Overdue</CardDescription>
            <CardTitle>{overdueInvoices.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-stone-500">
            Needs reminder or payment follow-up
          </CardContent>
        </Card>
        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardDescription>Paid</CardDescription>
            <CardTitle>{paidInvoices.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-stone-500">
            {currency(paidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0))}
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardDescription>Collected revenue</CardDescription>
            <CardTitle>{currency(paidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0))}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-stone-500">
            Total paid invoices currently visible in the dashboard
          </CardContent>
        </Card>
        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardDescription>Accounts receivable</CardDescription>
            <CardTitle>{currency(unpaidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0))}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-stone-500">
            Open balance across sent and overdue invoices
          </CardContent>
        </Card>
      </div>

      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Operational billing view for {businessName}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!invoices?.length ? (
            <p className="text-sm text-stone-500">No invoices yet. They will appear here as completed walks are billed.</p>
          ) : (
            invoices.map((invoice) => {
              const walk = invoice.walk_id ? walkById.get(invoice.walk_id) : null
              const booking = walk ? bookingById.get(walk.booking_id) : null
              const serviceName = booking ? serviceById.get(booking.service_id) : null

              return (
                <div key={invoice.id} className="rounded-xl border border-stone-200 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-semibold text-stone-900">{currency(Number(invoice.amount))}</p>
                        <Badge className={invoiceTone(invoice.status)}>{invoice.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-stone-500">{clientById.get(invoice.client_id) || 'Client'}</p>
                      <div className="mt-2 space-y-1 text-sm text-stone-600">
                        <p>Issued {new Date(invoice.created_at).toLocaleDateString()}</p>
                        <p>Due {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'not set'}</p>
                        <p>Service {serviceName || 'Walk service'}</p>
                        <p>Paid at {invoice.paid_at ? new Date(invoice.paid_at).toLocaleString() : 'not yet paid'}</p>
                        {invoice.notes && <p>Notes: {invoice.notes}</p>}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:max-w-xs lg:justify-end">
                      {invoice.status !== 'paid' && invoice.status !== 'voided' && (
                        <form action={sendInvoiceReminderAction.bind(null, tenantSlug)}>
                          <input type="hidden" name="invoice_id" value={invoice.id} />
                          <Button type="submit" variant="outline" size="sm">Log reminder</Button>
                        </form>
                      )}
                      {invoice.status !== 'sent' && invoice.status !== 'voided' && (
                        <form action={updateInvoiceStatusAction.bind(null, tenantSlug)}>
                          <input type="hidden" name="invoice_id" value={invoice.id} />
                          <input type="hidden" name="status" value="sent" />
                          <Button type="submit" variant="outline" size="sm">Mark sent</Button>
                        </form>
                      )}
                      {invoice.status !== 'overdue' && invoice.status !== 'paid' && invoice.status !== 'voided' && (
                        <form action={updateInvoiceStatusAction.bind(null, tenantSlug)}>
                          <input type="hidden" name="invoice_id" value={invoice.id} />
                          <input type="hidden" name="status" value="overdue" />
                          <Button type="submit" variant="outline" size="sm">Mark overdue</Button>
                        </form>
                      )}
                      {invoice.status !== 'paid' && invoice.status !== 'voided' && (
                        <form action={updateInvoiceStatusAction.bind(null, tenantSlug)}>
                          <input type="hidden" name="invoice_id" value={invoice.id} />
                          <input type="hidden" name="status" value="paid" />
                          <Button type="submit" size="sm" className="bg-[#c66a2b] hover:bg-[#ad5821]">Mark paid</Button>
                        </form>
                      )}
                      {invoice.status !== 'voided' && (
                        <form action={updateInvoiceStatusAction.bind(null, tenantSlug)}>
                          <input type="hidden" name="invoice_id" value={invoice.id} />
                          <input type="hidden" name="status" value="voided" />
                          <Button type="submit" variant="outline" size="sm">Void</Button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
