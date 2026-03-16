import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updateBookingStatusAction } from '@/lib/actions/walker-bookings'
import { completeWalkAction, generateInvoiceAction } from '@/lib/actions/walker-walks'
import { demoBookings, demoClients, demoInvoices, demoServices, demoWalkReports, demoWalks, isDemoTenantSlug, requireDemoRole } from '@/lib/demo'
import { requireTenantWalker } from '@/lib/tenant-session'

function toDateTimeLocal(value: string) {
  const date = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

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

  if (isDemoTenantSlug(tenantSlug)) {
    await requireDemoRole('walker', tenantSlug)
  } else {
    const { tenant, supabase } = await requireTenantWalker(tenantSlug)

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

  return (
    <div className="max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <p className="text-sm text-stone-500">Approve client requests, complete visits, and generate billing.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Pending booking requests</CardTitle>
              <CardDescription>Approve or decline requests from the client portal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!pendingBookings.length ? (
                <p className="text-sm text-stone-500">No pending requests right now.</p>
              ) : (
                pendingBookings.map((booking) => {
                  const client = clientById.get(booking.client_id)
                  const service = serviceById.get(booking.service_id)

                  return (
                    <div key={booking.id} className="rounded-xl border border-stone-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-stone-900">{service?.name || 'Walk service'}</p>
                          <p className="text-sm text-stone-500">{client?.full_name || 'Client'} · {new Date(booking.scheduled_at).toLocaleString()}</p>
                          {booking.notes && <p className="mt-2 text-sm text-stone-600">{booking.notes}</p>}
                        </div>
                        <Badge variant="secondary">pending</Badge>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <form action={updateBookingStatusAction.bind(null, tenantSlug)}>
                          <input type="hidden" name="booking_id" value={booking.id} />
                          <input type="hidden" name="status" value="approved" />
                          <Button type="submit" className="bg-[#c66a2b] hover:bg-[#ad5821]">Approve</Button>
                        </form>
                        <form action={updateBookingStatusAction.bind(null, tenantSlug)}>
                          <input type="hidden" name="booking_id" value={booking.id} />
                          <input type="hidden" name="status" value="declined" />
                          <Button type="submit" variant="outline">Decline</Button>
                        </form>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Completed visits</CardTitle>
              <CardDescription>Review delivered reports and invoice status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!completedBookings.length ? (
                <p className="text-sm text-stone-500">No completed bookings yet.</p>
              ) : (
                completedBookings.map((booking) => {
                  const client = clientById.get(booking.client_id)
                  const service = serviceById.get(booking.service_id)
                  const walk = walkByBookingId.get(booking.id)
                  const report = walk ? reportByWalkId.get(walk.id) : null
                  const invoice = walk ? invoiceByWalkId.get(walk.id) : null

                  return (
                    <div key={booking.id} className="rounded-xl border border-stone-200 p-4 text-sm text-stone-600">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-stone-900">{service?.name || 'Walk service'}</p>
                          <p>{client?.full_name || 'Client'} · {new Date(booking.scheduled_at).toLocaleString()}</p>
                        </div>
                        <Badge variant="secondary">completed</Badge>
                      </div>
                      <div className="mt-3 space-y-1">
                        <p>Walker note: {report?.walker_message || 'No report note saved.'}</p>
                        <p>Mood: {report?.mood || 'Not set'}</p>
                        <p>Invoice: {invoice ? `${invoice.status} · $${invoice.amount.toFixed(2)}` : 'Not generated yet'}</p>
                      </div>
                      {!invoice && walk && (
                        <div className="mt-4">
                          <form action={generateInvoiceAction.bind(null, tenantSlug)}>
                            <input type="hidden" name="booking_id" value={booking.id} />
                            <Button type="submit" variant="outline">Generate invoice</Button>
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

        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle>Approved bookings ready to complete</CardTitle>
            <CardDescription>Finish a visit, deliver the report, and create the invoice in one action.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!approvedBookings.length ? (
              <p className="text-sm text-stone-500">No approved bookings waiting for completion.</p>
            ) : (
              approvedBookings.map((booking) => {
                const client = clientById.get(booking.client_id)
                const service = serviceById.get(booking.service_id)
                const defaultStart = toDateTimeLocal(booking.scheduled_at)
                const defaultEnd = toDateTimeLocal(new Date(new Date(booking.scheduled_at).getTime() + ((service?.duration_minutes || 30) * 60000)).toISOString())

                return (
                  <form key={booking.id} action={completeWalkAction.bind(null, tenantSlug)} className="rounded-xl border border-stone-200 p-4">
                    <input type="hidden" name="booking_id" value={booking.id} />
                    <div className="mb-4">
                      <p className="font-medium text-stone-900">{service?.name || 'Walk service'}</p>
                      <p className="text-sm text-stone-500">{client?.full_name || 'Client'} · {new Date(booking.scheduled_at).toLocaleString()}</p>
                      {booking.notes && <p className="mt-2 text-sm text-stone-600">{booking.notes}</p>}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-1.5 text-sm">
                        <span className="font-medium text-stone-800">Started at</span>
                        <input type="datetime-local" name="started_at" defaultValue={defaultStart} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" required />
                      </label>
                      <label className="space-y-1.5 text-sm">
                        <span className="font-medium text-stone-800">Ended at</span>
                        <input type="datetime-local" name="ended_at" defaultValue={defaultEnd} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" required />
                      </label>
                      <label className="space-y-1.5 text-sm">
                        <span className="font-medium text-stone-800">Mood</span>
                        <select name="mood" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50">
                          <option value="">Select mood</option>
                          <option value="happy">Happy</option>
                          <option value="calm">Calm</option>
                          <option value="anxious">Anxious</option>
                          <option value="excited">Excited</option>
                          <option value="tired">Tired</option>
                        </select>
                      </label>
                      <label className="space-y-1.5 text-sm">
                        <span className="font-medium text-stone-800">Water provided</span>
                        <div className="flex h-9 items-center rounded-md border border-input px-3">
                          <input type="checkbox" name="water_provided" className="mr-2" />
                          <span>Yes</span>
                        </div>
                      </label>
                      <label className="space-y-1.5 text-sm">
                        <span className="font-medium text-stone-800">Pee count</span>
                        <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                          <input type="checkbox" name="potty_pee" />
                          <input type="number" name="potty_pee_count" min="0" step="1" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" placeholder="0" />
                        </div>
                      </label>
                      <label className="space-y-1.5 text-sm">
                        <span className="font-medium text-stone-800">Poo count</span>
                        <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                          <input type="checkbox" name="potty_poo" />
                          <input type="number" name="potty_poo_count" min="0" step="1" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" placeholder="0" />
                        </div>
                      </label>
                    </div>

                    <div className="mt-4 grid gap-4">
                      <label className="space-y-1.5 text-sm">
                        <span className="font-medium text-stone-800">Walker message</span>
                        <textarea name="walker_message" rows={3} className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" placeholder="Warm client-facing summary of the visit" />
                      </label>
                      <label className="space-y-1.5 text-sm">
                        <span className="font-medium text-stone-800">Behavior notes</span>
                        <textarea name="behavior_notes" rows={3} className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" placeholder="Leash behavior, playfulness, triggers, interactions" />
                      </label>
                      <label className="space-y-1.5 text-sm">
                        <span className="font-medium text-stone-800">Health notes</span>
                        <textarea name="health_notes" rows={3} className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" placeholder="Appetite, limping, medication reminders, anything notable" />
                      </label>
                    </div>

                    <div className="mt-4">
                      <Button type="submit" className="bg-[#c66a2b] hover:bg-[#ad5821]">Complete walk and create invoice</Button>
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
