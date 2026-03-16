import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { demoBookings, demoClientProfile, demoWalkReports, demoWalks, isDemoTenantSlug, requireDemoRole } from '@/lib/demo'
import { requireTenantClient } from '@/lib/tenant-session'

export default async function PortalWalksPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params

  if (isDemoTenantSlug(tenantSlug)) {
    await requireDemoRole('client', tenantSlug)

    const deliveredWalks = demoBookings
      .filter((booking) => booking.client_id === demoClientProfile.id)
      .flatMap((booking) =>
        demoWalks
          .filter((walk) => walk.booking_id === booking.id)
          .map((walk) => ({
            bookingId: booking.id,
            scheduledAt: booking.scheduled_at,
            status: booking.status,
            startedAt: walk.started_at,
            endedAt: walk.ended_at,
            report: demoWalkReports.find((report) => report.walk_id === walk.id) ?? null,
          }))
      )

    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Walk Reports</h1>
          <p className="text-sm text-stone-500">Completed visits and delivered walk notes.</p>
        </div>

        {!deliveredWalks.length ? (
          <Card className="overflow-hidden border-stone-200">
            <Image src="/assets/portal/empty-state-no-walks.png" alt="No walk reports yet" width={1200} height={900} className="h-auto w-full" />
            <CardContent className="pt-0">
              <p className="text-sm text-stone-500">No delivered walk reports yet. They will appear here after completed visits.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {deliveredWalks.map((walk) => (
              <Card key={`${walk.bookingId}-${walk.startedAt ?? walk.scheduledAt}`} className="border-stone-200">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle>{new Date(walk.scheduledAt).toLocaleString()}</CardTitle>
                      <CardDescription>
                        {walk.startedAt ? `Started ${new Date(walk.startedAt).toLocaleTimeString()}` : 'Visit time not started yet'}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="capitalize">{walk.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-stone-600">
                  <div>
                    <p className="font-medium text-stone-900">Walker message</p>
                    <p>{walk.report?.walker_message || 'No personalized note yet.'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">Behavior notes</p>
                    <p>{walk.report?.behavior_notes || 'No behavior notes.'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">Health notes</p>
                    <p>{walk.report?.health_notes || 'No health notes.'}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  const { tenant, clientProfile, supabase } = await requireTenantClient(tenantSlug)

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, scheduled_at, status, walks(id, started_at, ended_at, walk_reports(id, walker_message, behavior_notes, health_notes, delivered_at))')
    .eq('tenant_id', tenant.id)
    .eq('client_id', clientProfile.id)
    .order('scheduled_at', { ascending: false })
    .limit(10)

  const deliveredWalks = (bookings ?? []).flatMap((booking) =>
    (booking.walks ?? []).map((walk) => ({
      bookingId: booking.id,
      scheduledAt: booking.scheduled_at,
      status: booking.status,
      startedAt: walk.started_at,
      endedAt: walk.ended_at,
      report: Array.isArray(walk.walk_reports) ? walk.walk_reports[0] : walk.walk_reports,
    }))
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Walk Reports</h1>
        <p className="text-sm text-stone-500">Completed visits and delivered walk notes.</p>
      </div>

      {!deliveredWalks.length ? (
        <Card className="overflow-hidden border-stone-200">
          <Image src="/assets/portal/empty-state-no-walks.png" alt="No walk reports yet" width={1200} height={900} className="h-auto w-full" />
          <CardContent className="pt-0">
            <p className="text-sm text-stone-500">No delivered walk reports yet. They will appear here after completed visits.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {deliveredWalks.map((walk) => (
            <Card key={`${walk.bookingId}-${walk.startedAt ?? walk.scheduledAt}`} className="border-stone-200">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{new Date(walk.scheduledAt).toLocaleString()}</CardTitle>
                    <CardDescription>
                      {walk.startedAt ? `Started ${new Date(walk.startedAt).toLocaleTimeString()}` : 'Visit time not started yet'}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="capitalize">{walk.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-stone-600">
                <div>
                  <p className="font-medium text-stone-900">Walker message</p>
                  <p>{walk.report?.walker_message || 'No personalized note yet.'}</p>
                </div>
                <div>
                  <p className="font-medium text-stone-900">Behavior notes</p>
                  <p>{walk.report?.behavior_notes || 'No behavior notes.'}</p>
                </div>
                <div>
                  <p className="font-medium text-stone-900">Health notes</p>
                  <p>{walk.report?.health_notes || 'No health notes.'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
