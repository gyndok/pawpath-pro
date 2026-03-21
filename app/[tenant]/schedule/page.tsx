import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Camera, CheckCircle2, Clock3, ClipboardList, Droplets, MapPinned, ReceiptText, Route, Sparkles, TimerReset } from 'lucide-react'
import { updateBookingStatusAction } from '@/lib/actions/walker-bookings'
import { completeWalkAction, generateInvoiceAction } from '@/lib/actions/walker-walks'
import { demoBookings, demoClients, demoInvoices, demoServices, demoWalkReports, demoWalks, isDemoTenantSlug, requireDemoRole } from '@/lib/demo'
import {
  DEFAULT_TIME_ZONE,
  formatDateInTimeZone,
  formatDateTimeInTimeZone,
  formatTimeInTimeZone,
  toDateInputInTimeZone,
  toTimeInputInTimeZone,
} from '@/lib/datetime'
import { requireTenantWalker } from '@/lib/tenant-session'

export default async function WalkerSchedulePage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params
  type BookingRow = { id: string; client_id: string; service_id: string; scheduled_at: string; status: string; notes: string | null }
  type ServiceRow = { id: string; name: string; base_price: number; duration_minutes: number }
  type ClientRow = { id: string; full_name: string }
  type WalkRow = { id: string; booking_id: string; status: string; started_at: string | null; ended_at: string | null }
  type ReportRow = { walk_id: string; walker_message: string | null; mood: string | null; delivered_at: string | null }
  type InvoiceRow = { id: string; walk_id: string | null; amount: number; status: string }

  let bookings: BookingRow[] = demoBookings.map((booking) => ({
    id: booking.id,
    client_id: booking.client_id,
    service_id: booking.service_id,
    scheduled_at: booking.scheduled_at,
    status: booking.status,
    notes: booking.notes,
  }))
  let services: ServiceRow[] = demoServices
  let clients: ClientRow[] = demoClients.map((client) => ({ id: client.id, full_name: client.full_name }))
  let walks: WalkRow[] = demoWalks
  let reports: ReportRow[] = demoWalkReports
  let invoices: InvoiceRow[] = demoInvoices.map((invoice) => ({
    id: invoice.id,
    walk_id: invoice.walk_id,
    amount: invoice.amount,
    status: invoice.status,
  }))
  let timeZone = DEFAULT_TIME_ZONE

  if (isDemoTenantSlug(tenantSlug)) {
    await requireDemoRole('walker', tenantSlug)
  } else {
    const { tenant, supabase } = await requireTenantWalker(tenantSlug)
    timeZone = tenant.time_zone

    const results = await Promise.all([
      supabase
        .from('bookings')
        .select('id, client_id, service_id, scheduled_at, status, notes')
        .eq('tenant_id', tenant.id)
        .order('scheduled_at', { ascending: true }),
      supabase
        .from('services')
        .select('id, name, base_price, duration_minutes')
        .eq('tenant_id', tenant.id),
      supabase
        .from('client_profiles')
        .select('id, full_name')
        .eq('tenant_id', tenant.id),
      supabase
        .from('walks')
        .select('id, booking_id, status, started_at, ended_at')
        .eq('tenant_id', tenant.id),
      supabase
        .from('walk_reports')
        .select('walk_id, walker_message, mood, delivered_at')
        .eq('tenant_id', tenant.id),
      supabase
        .from('invoices')
        .select('id, walk_id, amount, status')
        .eq('tenant_id', tenant.id),
    ])

    bookings = results[0].data ?? []
    services = (results[1].data ?? []).map((service) => ({ ...service, base_price: Number(service.base_price) }))
    clients = results[2].data ?? []
    walks = results[3].data ?? []
    reports = results[4].data ?? []
    invoices = (results[5].data ?? []).map((invoice) => ({ ...invoice, amount: Number(invoice.amount) }))
  }

  const serviceById = new Map(services.map((service) => [service.id, service]))
  const clientById = new Map(clients.map((client) => [client.id, client]))
  const walkByBookingId = new Map(walks.map((walk) => [walk.booking_id, walk]))
  const reportByWalkId = new Map(reports.map((report) => [report.walk_id, report]))
  const invoiceByWalkId = new Map(invoices.map((invoice) => [invoice.walk_id, invoice]))

  const pendingBookings = bookings.filter((booking) => booking.status === 'pending')
  const approvedBookings = bookings.filter((booking) => booking.status === 'approved')
  const completedBookings = bookings.filter((booking) => booking.status === 'completed')

  const metrics = [
    {
      label: 'Pending approvals',
      value: pendingBookings.length,
      detail: pendingBookings.length ? 'Needs review before it hits the calendar' : 'Nothing waiting on you',
      icon: ClipboardList,
      tint: 'text-amber-700',
    },
    {
      label: 'Walks ready to run',
      value: approvedBookings.length,
      detail: approvedBookings.length ? 'Approved visits waiting for execution' : 'No approved visits in queue',
      icon: Route,
      tint: 'text-blue-700',
    },
    {
      label: 'Completed visits',
      value: completedBookings.length,
      detail: completedBookings.length ? 'Reports and invoices can be reviewed below' : 'No finished walks yet',
      icon: CheckCircle2,
      tint: 'text-emerald-700',
    },
  ]

  const nextApprovedWalk = [...approvedBookings].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0] ?? null

  return (
    <div className="kinetic-shell max-w-7xl p-6 lg:p-8">
      <div className="grid gap-6 xl:grid-cols-[1.22fr_0.78fr]">
        <section className="kinetic-card rounded-[2rem] p-8">
          <Badge className="kinetic-pill mb-4 px-4 py-2 shadow-none">
            Walk execution
          </Badge>
          <h1 className="section-title text-4xl">
            Run the day from one control room, then send a polished report when the walk is done.
          </h1>
          <p className="editorial-subtitle mt-5 max-w-2xl">
            Review incoming requests, finish approved visits, and push the client-facing report and invoice out without switching tools.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-stone-600">{metric.label}</p>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <metric.icon className={`h-4 w-4 ${metric.tint}`} />
                  </div>
                </div>
                <div className="mt-5 text-4xl font-black tracking-tight text-stone-950">{metric.value}</div>
                <p className="mt-2 text-sm leading-6 text-stone-500">{metric.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="kinetic-card rounded-[2rem] bg-[#003fb1] p-7 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/14">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#dbe1ff]">Next up</p>
              <h2 className="font-[var(--font-display)] text-2xl font-bold tracking-tight">
                {nextApprovedWalk ? 'You already have a live-ready walk in queue.' : 'The board is clear for the next request.'}
              </h2>
            </div>
          </div>

          <div className="mt-6 rounded-[1.6rem] border border-white/12 bg-white/8 p-5">
            {nextApprovedWalk ? (
              <>
                <p className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-white">
                  {serviceById.get(nextApprovedWalk.service_id)?.name || 'Walk service'}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#dbe1ff]">
                  <span>{clientById.get(nextApprovedWalk.client_id)?.full_name || 'Client'}</span>
                  <span className="opacity-70">·</span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1">
                    {formatDateInTimeZone(nextApprovedWalk.scheduled_at, timeZone)}
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1">
                    {formatTimeInTimeZone(nextApprovedWalk.scheduled_at, timeZone)}
                  </span>
                </div>
                {nextApprovedWalk.notes && (
                  <p className="mt-4 text-sm leading-6 text-[#dbe1ff]">{nextApprovedWalk.notes}</p>
                )}
              </>
            ) : (
              <>
                <p className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-white">No approved walk is waiting.</p>
                <p className="mt-2 text-sm leading-6 text-[#dbe1ff]">
                  The moment a client request is approved, this panel becomes the quick-launch point for the day&apos;s active execution flow.
                </p>
              </>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.2rem] bg-white/8 p-4">
              <p className="text-sm text-[#dbe1ff]">Quick photo moment</p>
              <p className="mt-2 flex items-center gap-2 text-lg font-black tracking-tight text-white">
                <Camera className="h-4 w-4" />
                Field-ready reporting
              </p>
            </div>
            <div className="rounded-[1.2rem] bg-white/8 p-4">
              <p className="text-sm text-[#dbe1ff]">Invoice handoff</p>
              <p className="mt-2 flex items-center gap-2 text-lg font-black tracking-tight text-white">
                <ReceiptText className="h-4 w-4" />
                Billing follows completion
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-6">
          <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">Pending booking requests</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-stone-600">
                Review the client, confirm the logistics, and either release the walk to the live calendar or decline it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!pendingBookings.length ? (
                <div className="kinetic-card-soft rounded-[1.35rem] border border-dashed border-[rgba(115,118,134,0.22)] p-5">
                  <p className="text-sm font-semibold text-stone-900">No pending requests right now.</p>
                  <p className="mt-2 text-sm leading-6 text-stone-500">New owner requests will appear here with service, time, and visit notes.</p>
                </div>
              ) : (
                pendingBookings.map((booking) => {
                  const client = clientById.get(booking.client_id)
                  const service = serviceById.get(booking.service_id)

                  return (
                    <div key={booking.id} className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-[var(--font-display)] text-xl font-bold tracking-tight text-stone-950">
                            {service?.name || 'Walk service'}
                          </p>
                          <p className="mt-2 text-sm text-stone-500">
                            {client?.full_name || 'Client'} · {formatDateTimeInTimeZone(booking.scheduled_at, timeZone)}
                          </p>
                          {booking.notes && <p className="mt-3 text-sm leading-6 text-stone-600">{booking.notes}</p>}
                        </div>
                        <Badge className="kinetic-pill px-3 py-1 shadow-none">Pending</Badge>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <form action={updateBookingStatusAction.bind(null, tenantSlug)}>
                          <input type="hidden" name="booking_id" value={booking.id} />
                          <input type="hidden" name="status" value="approved" />
                          <Button type="submit" className="rounded-xl bg-[#003fb1] text-white hover:bg-[#1a56db]">
                            Approve request
                          </Button>
                        </form>
                        <form action={updateBookingStatusAction.bind(null, tenantSlug)}>
                          <input type="hidden" name="booking_id" value={booking.id} />
                          <input type="hidden" name="status" value="declined" />
                          <Button type="submit" variant="outline" className="rounded-xl border-stone-300 bg-white">
                            Decline
                          </Button>
                        </form>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">Completed visits</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-stone-600">
                Review what the client received, confirm invoice status, and backfill billing if needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!completedBookings.length ? (
                <div className="kinetic-card-soft rounded-[1.35rem] border border-dashed border-[rgba(115,118,134,0.22)] p-5">
                  <p className="text-sm font-semibold text-stone-900">No completed bookings yet.</p>
                  <p className="mt-2 text-sm leading-6 text-stone-500">When a walk is closed out, the report summary and invoice state will show up here.</p>
                </div>
              ) : (
                completedBookings.map((booking) => {
                  const client = clientById.get(booking.client_id)
                  const service = serviceById.get(booking.service_id)
                  const walk = walkByBookingId.get(booking.id)
                  const report = walk ? reportByWalkId.get(walk.id) : null
                  const invoice = walk ? invoiceByWalkId.get(walk.id) : null

                  return (
                    <div key={booking.id} className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-[var(--font-display)] text-xl font-bold tracking-tight text-stone-950">
                            {service?.name || 'Walk service'}
                          </p>
                          <p className="mt-2 text-sm text-stone-500">
                            {client?.full_name || 'Client'} · {formatDateTimeInTimeZone(booking.scheduled_at, timeZone)}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-[#eef3ff] text-[#003fb1]">Completed</Badge>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-[1rem] bg-white p-4 shadow-sm">
                          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-500">
                            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                            Mood
                          </p>
                          <p className="mt-2 text-sm font-semibold text-stone-900">{report?.mood || 'Not set'}</p>
                        </div>
                        <div className="rounded-[1rem] bg-white p-4 shadow-sm">
                          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-500">
                            <TimerReset className="h-3.5 w-3.5 text-blue-700" />
                            Report
                          </p>
                          <p className="mt-2 text-sm font-semibold text-stone-900">{report?.walker_message || 'No report note saved.'}</p>
                        </div>
                        <div className="rounded-[1rem] bg-white p-4 shadow-sm">
                          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-500">
                            <ReceiptText className="h-3.5 w-3.5 text-emerald-700" />
                            Invoice
                          </p>
                          <p className="mt-2 text-sm font-semibold text-stone-900">
                            {invoice ? `${invoice.status} · $${invoice.amount.toFixed(2)}` : 'Not generated yet'}
                          </p>
                        </div>
                      </div>

                      {!invoice && walk && (
                        <div className="mt-4">
                          <form action={generateInvoiceAction.bind(null, tenantSlug)}>
                            <input type="hidden" name="booking_id" value={booking.id} />
                            <Button type="submit" variant="outline" className="rounded-xl border-stone-300 bg-white">
                              Generate invoice
                            </Button>
                          </form>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">Approved bookings ready to complete</CardTitle>
            <CardDescription className="mt-2 text-sm leading-6 text-stone-600">
              This is the live execution surface: mark the timing, capture potty and water details, and send a client-ready summary.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!approvedBookings.length ? (
              <div className="kinetic-card-soft rounded-[1.35rem] border border-dashed border-[rgba(115,118,134,0.22)] p-6">
                <p className="text-sm font-semibold text-stone-900">No approved bookings waiting for completion.</p>
                <p className="mt-2 text-sm leading-6 text-stone-500">Once a request is approved, the full walk execution form will appear here.</p>
              </div>
            ) : (
              approvedBookings.map((booking) => {
                const client = clientById.get(booking.client_id)
                const service = serviceById.get(booking.service_id)
                const defaultStartAt = booking.scheduled_at
                const defaultEndAt = new Date(
                  new Date(booking.scheduled_at).getTime() + ((service?.duration_minutes || 30) * 60000)
                ).toISOString()
                const defaultStartDate = toDateInputInTimeZone(defaultStartAt, timeZone)
                const defaultStartTime = toTimeInputInTimeZone(defaultStartAt, timeZone)
                const defaultEndDate = toDateInputInTimeZone(defaultEndAt, timeZone)
                const defaultEndTime = toTimeInputInTimeZone(defaultEndAt, timeZone)

                return (
                  <form key={booking.id} action={completeWalkAction.bind(null, tenantSlug)} className="kinetic-card-soft rounded-[1.55rem] border border-[rgba(115,118,134,0.15)] p-6">
                    <input type="hidden" name="booking_id" value={booking.id} />

                    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                      <div className="space-y-5">
                        <div className="rounded-[1.6rem] bg-[#003fb1] p-5 text-white">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#dbe1ff]">Walk in progress</p>
                              <p className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-tight">
                                {service?.name || 'Walk service'}
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#dbe1ff]">
                                <span>{client?.full_name || 'Client'}</span>
                                <span className="opacity-70">·</span>
                                <span className="rounded-full bg-white/10 px-2.5 py-1">
                                  {formatDateInTimeZone(booking.scheduled_at, timeZone)}
                                </span>
                                <span className="rounded-full bg-white/10 px-2.5 py-1">
                                  {formatTimeInTimeZone(booking.scheduled_at, timeZone)}
                                </span>
                              </div>
                            </div>
                            <div className="rounded-2xl bg-white/12 p-3">
                              <MapPinned className="h-5 w-5" />
                            </div>
                          </div>
                          {booking.notes && <p className="mt-4 text-sm leading-6 text-[#dbe1ff]">{booking.notes}</p>}
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2 text-sm">
                            <span className="flex items-center gap-2 font-semibold text-stone-800">
                              <Clock3 className="h-4 w-4 text-blue-700" />
                              Started at
                            </span>
                            <div className="grid gap-3">
                              <input
                                type="date"
                                name="started_at_date"
                                defaultValue={defaultStartDate}
                                className="flex h-11 w-full min-w-0 rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                required
                              />
                              <input
                                type="time"
                                name="started_at_time"
                                defaultValue={defaultStartTime}
                                className="flex h-11 w-full min-w-0 rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <span className="flex items-center gap-2 font-semibold text-stone-800">
                              <Calendar className="h-4 w-4 text-blue-700" />
                              Ended at
                            </span>
                            <div className="grid gap-3">
                              <input
                                type="date"
                                name="ended_at_date"
                                defaultValue={defaultEndDate}
                                className="flex h-11 w-full min-w-0 rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                required
                              />
                              <input
                                type="time"
                                name="ended_at_time"
                                defaultValue={defaultEndTime}
                                className="flex h-11 w-full min-w-0 rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="space-y-2 text-sm">
                            <span className="flex items-center gap-2 font-semibold text-stone-800">
                              <Sparkles className="h-4 w-4 text-amber-600" />
                              Mood
                            </span>
                            <select
                              name="mood"
                              className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                              <option value="">Select mood</option>
                              <option value="happy">Happy</option>
                              <option value="calm">Calm</option>
                              <option value="anxious">Anxious</option>
                              <option value="excited">Excited</option>
                              <option value="tired">Tired</option>
                            </select>
                          </label>

                          <label className="space-y-2 text-sm">
                            <span className="flex items-center gap-2 font-semibold text-stone-800">
                              <Droplets className="h-4 w-4 text-cyan-700" />
                              Water provided
                            </span>
                            <div className="flex h-11 items-center rounded-xl border border-input bg-white px-3">
                              <input type="checkbox" name="water_provided" className="mr-2" />
                              <span>Yes</span>
                            </div>
                          </label>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="space-y-2 text-sm">
                            <span className="font-semibold text-stone-800">Pee count</span>
                            <div className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-[1.2rem] border border-stone-200 bg-white px-3 py-3">
                              <input type="checkbox" name="potty_pee" />
                              <input
                                type="number"
                                name="potty_pee_count"
                                min="0"
                                step="1"
                                className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                placeholder="0"
                              />
                            </div>
                          </label>

                          <label className="space-y-2 text-sm">
                            <span className="font-semibold text-stone-800">Poo count</span>
                            <div className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-[1.2rem] border border-stone-200 bg-white px-3 py-3">
                              <input type="checkbox" name="potty_poo" />
                              <input
                                type="number"
                                name="potty_poo_count"
                                min="0"
                                step="1"
                                className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                placeholder="0"
                              />
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="kinetic-card rounded-[1.4rem] border border-[rgba(115,118,134,0.15)] bg-white p-4">
                          <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#9d4300]">Client-facing report</p>
                          <p className="mt-3 text-sm leading-6 text-stone-500">Keep this warm and readable. The owner should understand exactly how the walk went at a glance.</p>
                        </div>

                        <label className="space-y-2 text-sm">
                          <span className="font-semibold text-stone-800">Walker message</span>
                          <textarea
                            name="walker_message"
                            rows={4}
                            className="flex min-h-28 w-full rounded-[1.2rem] border border-input bg-white px-4 py-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            placeholder="Warm client-facing summary of the visit"
                          />
                        </label>

                        <label className="space-y-2 text-sm">
                          <span className="font-semibold text-stone-800">Behavior notes</span>
                          <textarea
                            name="behavior_notes"
                            rows={4}
                            className="flex min-h-28 w-full rounded-[1.2rem] border border-input bg-white px-4 py-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            placeholder="Leash behavior, playfulness, triggers, interactions"
                          />
                        </label>

                        <label className="space-y-2 text-sm">
                          <span className="font-semibold text-stone-800">Health notes</span>
                          <textarea
                            name="health_notes"
                            rows={4}
                            className="flex min-h-28 w-full rounded-[1.2rem] border border-input bg-white px-4 py-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            placeholder="Appetite, limping, medication reminders, anything notable"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[1.3rem] bg-[#eef3ff] px-4 py-4">
                      <div className="text-sm text-stone-600">
                        <p className="font-semibold text-stone-900">Finish walk, deliver report, and create invoice</p>
                        <p className="mt-1">This action closes the visit and advances billing in one step.</p>
                      </div>
                      <Button type="submit" className="rounded-xl bg-[#003fb1] text-white hover:bg-[#1a56db]">
                        Complete walk and create invoice
                      </Button>
                    </div>
                  </form>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
