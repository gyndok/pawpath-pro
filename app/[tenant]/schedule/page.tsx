import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updateBookingStatusAction } from '@/lib/actions/walker-bookings'
import { requireTenantWalker } from '@/lib/tenant-session'

export default async function WalkerSchedulePage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params
  const { tenant, supabase } = await requireTenantWalker(tenantSlug)

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, scheduled_at, status, notes, client_profiles(full_name), services(name)')
    .eq('tenant_id', tenant.id)
    .order('scheduled_at', { ascending: true })

  const pendingBookings = (bookings ?? []).filter((booking) => booking.status === 'pending')
  const upcomingBookings = (bookings ?? []).filter((booking) => ['approved', 'completed'].includes(booking.status))

  return (
    <div className="max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <p className="text-sm text-stone-500">Review incoming booking requests and upcoming visits.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle>Pending booking requests</CardTitle>
            <CardDescription>Approve or decline requests from client portal submissions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!pendingBookings.length ? (
              <p className="text-sm text-stone-500">No pending requests right now.</p>
            ) : (
              pendingBookings.map((booking) => {
                const client = Array.isArray(booking.client_profiles) ? booking.client_profiles[0] : booking.client_profiles
                const service = Array.isArray(booking.services) ? booking.services[0] : booking.services

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
            <CardTitle>Upcoming and completed bookings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!upcomingBookings.length ? (
              <p className="text-sm text-stone-500">No approved or completed bookings yet.</p>
            ) : (
              upcomingBookings.map((booking) => {
                const client = Array.isArray(booking.client_profiles) ? booking.client_profiles[0] : booking.client_profiles
                const service = Array.isArray(booking.services) ? booking.services[0] : booking.services

                return (
                  <div key={booking.id} className="rounded-xl border border-stone-200 p-4 text-sm text-stone-600">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-stone-900">{service?.name || 'Walk service'}</p>
                        <p>{client?.full_name || 'Client'} · {new Date(booking.scheduled_at).toLocaleString()}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">{booking.status}</Badge>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
