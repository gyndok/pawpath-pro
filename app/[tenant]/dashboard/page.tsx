import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, Calendar, Clock, Dog, DollarSign, PawPrint, ShieldCheck, Sparkles, Wallet } from 'lucide-react'
import { demoBookings, demoClients, demoInvoices, demoServices, demoWaiver, isDemoTenantSlug, requireDemoRole } from '@/lib/demo'
import { DEFAULT_TIME_ZONE, formatDateInTimeZone, formatDateKeyInTimeZone, formatDateTimeInTimeZone } from '@/lib/datetime'
import { requireTenantWalker } from '@/lib/tenant-session'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params
  let tenantName = 'PawPath Pro'
  let bookings: Array<{ id: string; client_id: string; service_id: string; scheduled_at: string; status: string; notes: string | null }> = []
  let services: Array<{ id: string; name: string }> = []
  let clients: Array<{ id: string; full_name: string }> = []
  let invoices: Array<{ id: string; amount: number; status: string; due_date: string | null }> = []
  let waiverSignedCount = 1
  let timeZone = DEFAULT_TIME_ZONE

  if (isDemoTenantSlug(tenantSlug)) {
    await requireDemoRole('walker', tenantSlug)
    tenantName = 'Maple & Main Dog Walking'
    timeZone = DEFAULT_TIME_ZONE
    bookings = demoBookings
    services = demoServices.map((service) => ({ id: service.id, name: service.name }))
    clients = demoClients.map((client) => ({ id: client.id, full_name: client.full_name }))
    invoices = demoInvoices.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount,
      status: invoice.status,
      due_date: invoice.due_date,
    }))
  } else {
    const { tenant, supabase } = await requireTenantWalker(tenantSlug)
    tenantName = tenant.business_name
    timeZone = tenant.time_zone

    const results = await Promise.all([
      supabase
        .from('bookings')
        .select('id, client_id, service_id, scheduled_at, status, notes')
        .eq('tenant_id', tenant.id)
        .order('scheduled_at', { ascending: true }),
      supabase
        .from('services')
        .select('id, name')
        .eq('tenant_id', tenant.id),
      supabase
        .from('client_profiles')
        .select('id, full_name')
        .eq('tenant_id', tenant.id),
      supabase
        .from('invoices')
        .select('id, amount, status, due_date')
        .eq('tenant_id', tenant.id),
      supabase
        .from('waivers')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    bookings = results[0].data ?? []
    services = results[1].data ?? []
    clients = results[2].data ?? []
    invoices = (results[3].data ?? []).map((invoice) => ({ ...invoice, amount: Number(invoice.amount) }))

    const activeWaiverId = results[4].data?.id
    if (activeWaiverId) {
      const signatures = await supabase
        .from('waiver_signatures')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('waiver_id', activeWaiverId)

      waiverSignedCount = signatures.count ?? 0
    } else {
      waiverSignedCount = 0
    }
  }

  const now = new Date()
  const todayKey = formatDateKeyInTimeZone(now, timeZone)

  const serviceById = new Map(services.map((service) => [service.id, service.name]))
  const clientById = new Map(clients.map((client) => [client.id, client.full_name]))
  const bookingList = bookings

  const todaysWalks = bookingList.filter((booking) => formatDateKeyInTimeZone(booking.scheduled_at, timeZone) === todayKey)
  const upcomingWalks = bookingList.filter((booking) => new Date(booking.scheduled_at) >= now && booking.status === 'approved')
  const pendingBookings = bookingList.filter((booking) => booking.status === 'pending')
  const unpaidInvoices = invoices.filter((invoice) => !['paid', 'voided'].includes(invoice.status))
  const overdueInvoices = unpaidInvoices.filter((invoice) => {
    if (invoice.status === 'overdue') return true
    if (!invoice.due_date) return false
    return new Date(`${invoice.due_date}T23:59:59`) < now
  })
  const totalCollected = invoices.filter((invoice) => invoice.status === 'paid').reduce((sum, invoice) => sum + invoice.amount, 0)
  const openReceivables = unpaidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0)
  const clientCount = clients.length
  const nextWalk = [...upcomingWalks].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0] ?? null

  const stats = [
    { label: "Today's Walks", value: String(todaysWalks.length), sub: todaysWalks.length ? 'Scheduled for today' : 'No walks on today\'s calendar', icon: PawPrint, color: 'text-violet-600' },
    { label: 'Upcoming', value: String(upcomingWalks.length), sub: 'Approved upcoming walks', icon: Calendar, color: 'text-blue-600' },
    { label: 'Pending Requests', value: String(pendingBookings.length), sub: 'Awaiting approval', icon: Dog, color: 'text-amber-600' },
    { label: 'Unpaid Invoices', value: String(unpaidInvoices.length), sub: overdueInvoices.length ? `${overdueInvoices.length} overdue` : 'All current invoices tracked', icon: DollarSign, color: 'text-green-600' },
  ]

  const today = formatDateInTimeZone(new Date(), timeZone, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="kinetic-shell max-w-7xl p-6 lg:p-8">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="kinetic-card rounded-[2rem] p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <Badge className="kinetic-pill mb-4 px-4 py-2 shadow-none">
                Walker operations
              </Badge>
              <h1 className="section-title text-4xl">
                Keep the day moving without losing track of the business.
              </h1>
              <p className="editorial-subtitle mt-5 max-w-xl">
                {tenantName} now has a single place to manage client requests, deliver walk reports,
                and keep billing moving without bouncing between apps.
              </p>
            </div>

            <div className="kinetic-card-soft rounded-[1.6rem] border border-[rgba(115,118,134,0.16)] px-5 py-4 text-right">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.26em] text-[#9d4300]">Today</p>
              <p className="mt-2 font-[var(--font-display)] text-lg font-bold tracking-tight text-stone-950">{today}</p>
              <p className="mt-1 text-sm text-stone-500">Live overview for the active tenant workspace</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="kinetic-card-soft rounded-[1.4rem] border border-[rgba(115,118,134,0.14)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-stone-600">{stat.label}</p>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-stone-900 shadow-sm">
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-5 text-4xl font-black tracking-tight text-stone-950">{stat.value}</div>
                <p className="mt-2 text-sm leading-6 text-stone-500">{stat.sub}</p>
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
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#dbe1ff]">Next priority</p>
              <h2 className="font-[var(--font-display)] text-2xl font-bold tracking-tight">
                {nextWalk ? 'Your next approved walk is lined up.' : 'Your dashboard is ready for the next booking.'}
              </h2>
            </div>
          </div>

          <div className="mt-6 rounded-[1.6rem] border border-white/12 bg-white/8 p-5">
            {nextWalk ? (
              <>
                <p className="text-lg font-semibold text-white">
                  {serviceById.get(nextWalk.service_id) || 'Walk service'}
                </p>
                <p className="mt-2 text-sm text-[#dbe1ff]">
                  {clientById.get(nextWalk.client_id) || 'Client'} · {formatDateTimeInTimeZone(nextWalk.scheduled_at, timeZone)}
                </p>
                {nextWalk.notes && (
                  <p className="mt-4 text-sm leading-6 text-[#dbe1ff]">{nextWalk.notes}</p>
                )}
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-white">No approved walks yet.</p>
                <p className="mt-2 text-sm leading-6 text-[#dbe1ff]">
                  Publish services, set availability, and approve the next client request to start filling the calendar.
                </p>
              </>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.2rem] bg-white/8 p-4">
              <p className="text-sm text-[#dbe1ff]">Open receivables</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-white">${openReceivables.toFixed(2)}</p>
            </div>
            <div className="rounded-[1.2rem] bg-white/8 p-4">
              <p className="text-sm text-[#dbe1ff]">Clients with waiver on file</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-white">{waiverSignedCount}</p>
            </div>
          </div>
        </section>
      </div>

      {isDemoTenantSlug(tenantSlug) && (
        <Card className="mb-6 mt-6 border-stone-200 bg-[#fff6ed]">
          <CardHeader>
            <CardTitle>Walker demo walkthrough</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-stone-700 md:grid-cols-2">
            <p>Use this view as the “owner/operator home base” after a walker finishes onboarding.</p>
            <p>Then move through `Clients`, `Schedule`, `Billing`, and `Settings` to show the full business workflow.</p>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 font-[var(--font-display)] text-2xl tracking-tight">
              <Clock className="h-5 w-5 text-violet-600" />
              Today&apos;s Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!todaysWalks.length ? (
              <div className="kinetic-card-soft rounded-[1.35rem] border border-dashed border-[rgba(115,118,134,0.22)] p-5">
                <p className="text-sm font-semibold text-stone-900">No walks scheduled today.</p>
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  When bookings are approved, today&apos;s route will show up here with timing and client context.
                </p>
              </div>
            ) : (
              todaysWalks.map((booking) => (
                <div key={booking.id} className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-[var(--font-display)] text-xl font-bold tracking-tight text-stone-950">
                        {serviceById.get(booking.service_id) || 'Walk service'}
                      </p>
                      <p className="mt-2 text-sm text-stone-500">
                        {clientById.get(booking.client_id) || 'Client'} · {formatDateTimeInTimeZone(booking.scheduled_at, timeZone)}
                      </p>
                      {booking.notes && <p className="mt-3 text-sm leading-6 text-stone-600">{booking.notes}</p>}
                    </div>
                    <Badge variant="secondary" className="capitalize">{booking.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 font-[var(--font-display)] text-2xl tracking-tight">
              <Dog className="h-5 w-5 text-amber-500" />
              Walk Requests Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!pendingBookings.length ? (
              <div className="kinetic-card-soft rounded-[1.35rem] border border-dashed border-[rgba(115,118,134,0.22)] p-5">
                <p className="text-sm font-semibold text-stone-900">No pending requests.</p>
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  Incoming requests will appear here before they are approved and added to the active calendar.
                </p>
              </div>
            ) : (
              pendingBookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-[var(--font-display)] text-xl font-bold tracking-tight text-stone-950">
                        {serviceById.get(booking.service_id) || 'Walk service'}
                      </p>
                      <p className="mt-2 text-sm text-stone-500">
                        {clientById.get(booking.client_id) || 'Client'} · {formatDateTimeInTimeZone(booking.scheduled_at, timeZone)}
                      </p>
                    </div>
                    <Badge variant="secondary">pending</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">Client Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9d4300]">Active relationships</p>
              <p className="mt-3 text-4xl font-black tracking-tight text-stone-950">{clientCount}</p>
              <p className="mt-2 text-sm leading-6 text-stone-500">Clients currently on file for this tenant.</p>
            </div>
            {clients.slice(0, 3).map((client) => (
              <div key={client.id} className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-stone-900">{client.full_name}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      {bookingList.filter((booking) => booking.client_id === client.id && ['approved', 'completed'].includes(booking.status)).length} booked visits on record
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-stone-400" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">Financial Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
              <p className="text-sm text-stone-500">Collected</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-stone-950">${totalCollected.toFixed(2)}</p>
            </div>
            <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
              <p className="text-sm text-stone-500">Open receivables</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-stone-950">${openReceivables.toFixed(2)}</p>
            </div>
            <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
              <p className="text-sm text-stone-500">Overdue</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-stone-950">{overdueInvoices.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">Business Readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-stone-600">
            <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
              <div className="flex items-start gap-3">
                <Wallet className="mt-0.5 h-5 w-5 text-[#003fb1]" />
                <div>
                  <p className="font-semibold text-stone-900">Business setup</p>
                  <p className="mt-2 leading-6">{services.length} active services configured and ready for client booking.</p>
                </div>
              </div>
            </div>
            <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-[#00544c]" />
                <div>
                  <p className="font-semibold text-stone-900">Waiver readiness</p>
                  <p className="mt-2 leading-6">
                    {isDemoTenantSlug(tenantSlug)
                      ? `Current waiver template is active: ${demoWaiver.title}.`
                      : `${waiverSignedCount} clients have signed the current active waiver.`}
                  </p>
                </div>
              </div>
            </div>
            <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
              <div className="flex items-start gap-3">
                <DollarSign className="mt-0.5 h-5 w-5 text-[#9d4300]" />
                <div>
                  <p className="font-semibold text-stone-900">Collections workflow</p>
                  <p className="mt-2 leading-6">Invoices are being tracked across `sent`, `paid`, and `overdue` states so payment follow-through stays visible.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">Operational Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-stone-600">
            <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
              <p className="font-semibold text-stone-900">1. Client review</p>
              <p className="mt-2 leading-6">Check pet profiles, logistics, emergency contacts, and signed waivers before the first booking.</p>
            </div>
            <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
              <p className="font-semibold text-stone-900">2. Schedule operations</p>
              <p className="mt-2 leading-6">Approve incoming requests, review visit notes, and complete walk documentation from the schedule view.</p>
            </div>
            <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
              <p className="font-semibold text-stone-900">3. Billing follow-through</p>
              <p className="mt-2 leading-6">Track invoices, log reminders, and mark manual payments in the billing view.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
