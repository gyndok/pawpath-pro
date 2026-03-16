import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Dog, DollarSign, PawPrint, Clock } from 'lucide-react'
import { demoBookings, demoClients, demoInvoices, demoServices, isDemoTenantSlug, requireDemoRole } from '@/lib/demo'
import { requireTenantWalker } from '@/lib/tenant-session'

function isSameDay(date: Date, other: Date) {
  return date.getFullYear() === other.getFullYear()
    && date.getMonth() === other.getMonth()
    && date.getDate() === other.getDate()
}

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

  if (isDemoTenantSlug(tenantSlug)) {
    await requireDemoRole('walker', tenantSlug)
    tenantName = 'Maple & Main Dog Walking'
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
    ])

    bookings = results[0].data ?? []
    services = results[1].data ?? []
    clients = results[2].data ?? []
    invoices = (results[3].data ?? []).map((invoice) => ({ ...invoice, amount: Number(invoice.amount) }))
  }

  const now = new Date()

  const serviceById = new Map(services.map((service) => [service.id, service.name]))
  const clientById = new Map(clients.map((client) => [client.id, client.full_name]))
  const bookingList = bookings

  const todaysWalks = bookingList.filter((booking) => isSameDay(new Date(booking.scheduled_at), now))
  const upcomingWalks = bookingList.filter((booking) => new Date(booking.scheduled_at) >= now && booking.status === 'approved')
  const pendingBookings = bookingList.filter((booking) => booking.status === 'pending')
  const unpaidInvoices = invoices.filter((invoice) => !['paid', 'voided'].includes(invoice.status))
  const overdueInvoices = unpaidInvoices.filter((invoice) => {
    if (invoice.status === 'overdue') return true
    if (!invoice.due_date) return false
    return new Date(`${invoice.due_date}T23:59:59`) < now
  })
  const totalCollected = invoices.filter((invoice) => invoice.status === 'paid').reduce((sum, invoice) => sum + invoice.amount, 0)
  const clientCount = clients.length

  const stats = [
    { label: "Today's Walks", value: String(todaysWalks.length), sub: todaysWalks.length ? 'Scheduled for today' : 'No walks on today\'s calendar', icon: PawPrint, color: 'text-violet-600' },
    { label: 'Upcoming', value: String(upcomingWalks.length), sub: 'Approved upcoming walks', icon: Calendar, color: 'text-blue-600' },
    { label: 'Pending Requests', value: String(pendingBookings.length), sub: 'Awaiting approval', icon: Dog, color: 'text-amber-600' },
    { label: 'Unpaid Invoices', value: String(unpaidInvoices.length), sub: overdueInvoices.length ? `${overdueInvoices.length} overdue` : 'All current invoices tracked', icon: DollarSign, color: 'text-green-600' },
  ]

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="max-w-6xl p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-stone-500">{tenantName}</p>
        </div>
        <p className="text-gray-500 text-sm mt-1">{today}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-stone-900">{stat.value}</div>
              <p className="text-xs text-stone-500 mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-4 border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-violet-600" />
            Today&apos;s Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!todaysWalks.length ? (
            <p className="text-sm text-stone-500">No walks scheduled today.</p>
          ) : (
            todaysWalks.map((booking) => (
              <div key={booking.id} className="rounded-xl border border-stone-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-stone-900">{serviceById.get(booking.service_id) || 'Walk service'}</p>
                    <p className="text-sm text-stone-500">{clientById.get(booking.client_id) || 'Client'} · {new Date(booking.scheduled_at).toLocaleString()}</p>
                    {booking.notes && <p className="mt-2 text-sm text-stone-600">{booking.notes}</p>}
                  </div>
                  <Badge variant="secondary" className="capitalize">{booking.status}</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dog className="h-5 w-5 text-amber-500" />
            Walk Requests Pending Approval
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pendingBookings.length ? (
            <p className="text-sm text-stone-500">No pending requests.</p>
          ) : (
            pendingBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="rounded-xl border border-stone-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-stone-900">{serviceById.get(booking.service_id) || 'Walk service'}</p>
                    <p className="text-sm text-stone-500">{clientById.get(booking.client_id) || 'Client'} · {new Date(booking.scheduled_at).toLocaleString()}</p>
                  </div>
                  <Badge variant="secondary">pending</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle>Client Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-2xl font-bold text-stone-900">{clientCount}</p>
              <p className="text-sm text-stone-500">Active client relationships on file</p>
            </div>
            {clients.slice(0, 3).map((client) => (
              <div key={client.id} className="rounded-xl border border-stone-200 p-4">
                <p className="font-medium text-stone-900">{client.full_name}</p>
                <p className="text-sm text-stone-500">
                  {(bookingList.filter((booking) => booking.client_id === client.id && ['approved', 'completed'].includes(booking.status)).length)} booked visits on record
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-stone-200 p-4">
              <p className="text-sm text-stone-500">Collected</p>
              <p className="mt-1 text-2xl font-bold text-stone-900">${totalCollected.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-stone-200 p-4">
              <p className="text-sm text-stone-500">Open receivables</p>
              <p className="mt-1 text-2xl font-bold text-stone-900">
                ${unpaidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0).toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 p-4">
              <p className="text-sm text-stone-500">Overdue</p>
              <p className="mt-1 text-2xl font-bold text-stone-900">{overdueInvoices.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
