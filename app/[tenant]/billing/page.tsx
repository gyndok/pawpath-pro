import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BellRing, DollarSign, ReceiptText, ShieldCheck, Wallet } from 'lucide-react'
import { demoBookings, demoClients, demoInvoices, demoServices, demoWalks, isDemoTenantSlug, requireDemoRole } from '@/lib/demo'
import { DEFAULT_TIME_ZONE, formatDateInTimeZone, formatDateTimeInTimeZone } from '@/lib/datetime'
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
  let timeZone = DEFAULT_TIME_ZONE

  if (isDemoTenantSlug(tenantSlug)) {
    await requireDemoRole('walker', tenantSlug)
    businessName = 'Maple & Main Dog Walking'
  } else {
    const { tenant, supabase } = await requireTenantWalker(tenantSlug)
    businessName = tenant.business_name
    timeZone = tenant.time_zone

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
  const collectedRevenue = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0)
  const receivables = unpaidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0)
  const latestInvoice = invoices[0] ?? null

  const summary = [
    {
      label: 'Open invoices',
      value: unpaidInvoices.length,
      detail: currency(receivables),
      icon: ReceiptText,
      tint: 'text-amber-700',
    },
    {
      label: 'Collected',
      value: currency(collectedRevenue),
      detail: `${paidInvoices.length} paid invoice${paidInvoices.length === 1 ? '' : 's'}`,
      icon: DollarSign,
      tint: 'text-emerald-700',
    },
    {
      label: 'Overdue',
      value: overdueInvoices.length,
      detail: overdueInvoices.length ? 'Needs reminder or follow-up' : 'Nothing past due',
      icon: BellRing,
      tint: 'text-red-700',
    },
  ]

  return (
    <div className="kinetic-shell max-w-7xl p-6 lg:p-8">
      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <section className="kinetic-card rounded-[2rem] p-8">
          <Badge className="kinetic-pill mb-4 px-4 py-2 shadow-none">
            Billing operations
          </Badge>
          <h1 className="section-title text-4xl">
            Keep revenue moving without turning collections into a second full-time job.
          </h1>
          <p className="editorial-subtitle mt-5 max-w-2xl">
            {businessName} can track receivables, mark invoices paid, send reminders, and keep owners current from one clean operations surface.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {summary.map((item) => (
              <div key={item.label} className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-stone-600">{item.label}</p>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <item.icon className={`h-4 w-4 ${item.tint}`} />
                  </div>
                </div>
                <div className="mt-5 text-4xl font-black tracking-tight text-stone-950">{item.value}</div>
                <p className="mt-2 text-sm leading-6 text-stone-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="kinetic-card rounded-[2rem] bg-[#003fb1] p-7 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/14">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#dbe1ff]">Collections focus</p>
              <h2 className="font-[var(--font-display)] text-2xl font-bold tracking-tight">
                {latestInvoice ? 'The ledger is current and ready for the next action.' : 'Invoices will start appearing as soon as walks are billed.'}
              </h2>
            </div>
          </div>

          <div className="mt-6 rounded-[1.6rem] border border-white/12 bg-white/8 p-5">
            {latestInvoice ? (
              <>
                <p className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-white">
                  {currency(Number(latestInvoice.amount))}
                </p>
                <p className="mt-2 text-sm text-[#dbe1ff]">
                  {clientById.get(latestInvoice.client_id) || 'Client'} · issued {formatDateInTimeZone(latestInvoice.created_at, timeZone)}
                </p>
                <p className="mt-3 text-sm text-[#dbe1ff]">
                  Current status: <span className="font-semibold capitalize text-white">{latestInvoice.status}</span>
                </p>
              </>
            ) : (
              <>
                <p className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-white">No invoices on the board yet.</p>
                <p className="mt-2 text-sm leading-6 text-[#dbe1ff]">
                  When walks are completed and billed, this panel becomes the at-a-glance collections summary.
                </p>
              </>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.2rem] bg-white/8 p-4">
              <p className="text-sm text-[#dbe1ff]">Receivables</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-white">{currency(receivables)}</p>
            </div>
            <div className="rounded-[1.2rem] bg-white/8 p-4">
              <p className="text-sm text-[#dbe1ff]">Healthy accounts</p>
              <p className="mt-2 flex items-center gap-2 text-lg font-black tracking-tight text-white">
                <ShieldCheck className="h-4 w-4" />
                {clients.length - overdueInvoices.length} current
              </p>
            </div>
          </div>
        </section>
      </div>

      <Card className="kinetic-card mt-6 rounded-[1.8rem] border-stone-200 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">Invoice ledger</CardTitle>
          <CardDescription className="mt-2 text-sm leading-6 text-stone-600">
            Operational billing view for {businessName}. Review each invoice, then log the next action directly from the card.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!invoices.length ? (
            <div className="kinetic-card-soft rounded-[1.35rem] border border-dashed border-[rgba(115,118,134,0.22)] p-5">
              <p className="text-sm font-semibold text-stone-900">No invoices yet.</p>
              <p className="mt-2 text-sm leading-6 text-stone-500">Invoices will appear here automatically as completed walks are billed.</p>
            </div>
          ) : (
            invoices.map((invoice) => {
              const walk = invoice.walk_id ? walkById.get(invoice.walk_id) : null
              const booking = walk ? bookingById.get(walk.booking_id) : null
              const serviceName = booking ? serviceById.get(booking.service_id) : null

              return (
                <div key={invoice.id} className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-[var(--font-display)] text-3xl font-bold tracking-tight text-stone-950">
                          {currency(Number(invoice.amount))}
                        </p>
                        <Badge className={invoiceTone(invoice.status)}>{invoice.status}</Badge>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-stone-900">{clientById.get(invoice.client_id) || 'Client'}</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-[1rem] bg-white p-4 shadow-sm">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Issued</p>
                          <p className="mt-2 text-sm font-semibold text-stone-900">{formatDateInTimeZone(invoice.created_at, timeZone)}</p>
                        </div>
                        <div className="rounded-[1rem] bg-white p-4 shadow-sm">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Due</p>
                          <p className="mt-2 text-sm font-semibold text-stone-900">{invoice.due_date ? formatDateInTimeZone(invoice.due_date, timeZone) : 'Not set'}</p>
                        </div>
                        <div className="rounded-[1rem] bg-white p-4 shadow-sm">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Service</p>
                          <p className="mt-2 text-sm font-semibold text-stone-900">{serviceName || 'Walk service'}</p>
                        </div>
                        <div className="rounded-[1rem] bg-white p-4 shadow-sm">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Paid at</p>
                          <p className="mt-2 text-sm font-semibold text-stone-900">{invoice.paid_at ? formatDateTimeInTimeZone(invoice.paid_at, timeZone) : 'Not yet paid'}</p>
                        </div>
                      </div>
                      {invoice.notes && (
                        <div className="mt-4 rounded-[1rem] border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-600">
                          Notes: {invoice.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 lg:max-w-xs lg:justify-end">
                      {invoice.status !== 'paid' && invoice.status !== 'voided' && (
                        <form action={sendInvoiceReminderAction.bind(null, tenantSlug)}>
                          <input type="hidden" name="invoice_id" value={invoice.id} />
                          <Button type="submit" variant="outline" size="sm" className="rounded-xl border-stone-300 bg-white">
                            Log reminder
                          </Button>
                        </form>
                      )}
                      {invoice.status !== 'sent' && invoice.status !== 'voided' && (
                        <form action={updateInvoiceStatusAction.bind(null, tenantSlug)}>
                          <input type="hidden" name="invoice_id" value={invoice.id} />
                          <input type="hidden" name="status" value="sent" />
                          <Button type="submit" variant="outline" size="sm" className="rounded-xl border-stone-300 bg-white">
                            Mark sent
                          </Button>
                        </form>
                      )}
                      {invoice.status !== 'overdue' && invoice.status !== 'paid' && invoice.status !== 'voided' && (
                        <form action={updateInvoiceStatusAction.bind(null, tenantSlug)}>
                          <input type="hidden" name="invoice_id" value={invoice.id} />
                          <input type="hidden" name="status" value="overdue" />
                          <Button type="submit" variant="outline" size="sm" className="rounded-xl border-stone-300 bg-white">
                            Mark overdue
                          </Button>
                        </form>
                      )}
                      {invoice.status !== 'paid' && invoice.status !== 'voided' && (
                        <form action={updateInvoiceStatusAction.bind(null, tenantSlug)}>
                          <input type="hidden" name="invoice_id" value={invoice.id} />
                          <input type="hidden" name="status" value="paid" />
                          <Button type="submit" size="sm" className="rounded-xl bg-[#003fb1] text-white hover:bg-[#1a56db]">
                            Mark paid
                          </Button>
                        </form>
                      )}
                      {invoice.status !== 'voided' && (
                        <form action={updateInvoiceStatusAction.bind(null, tenantSlug)}>
                          <input type="hidden" name="invoice_id" value={invoice.id} />
                          <input type="hidden" name="status" value="voided" />
                          <Button type="submit" variant="outline" size="sm" className="rounded-xl border-stone-300 bg-white">
                            Void
                          </Button>
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
