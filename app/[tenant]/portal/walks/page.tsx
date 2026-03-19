import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarClock, HeartPulse, MessageSquareQuote, Sparkles } from 'lucide-react'
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
      <div className="kinetic-shell mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-6 xl:grid-cols-[1.14fr_0.86fr]">
          <section className="kinetic-card rounded-[2rem] p-8">
            <Badge className="kinetic-pill mb-4 px-4 py-2 shadow-none">Walk reports</Badge>
            <h1 className="section-title text-4xl">Every completed visit becomes a story, not just a status update.</h1>
            <p className="editorial-subtitle mt-5 max-w-2xl">
              Review delivered notes, behavior highlights, and care observations after each completed walk.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
                <p className="text-sm font-semibold text-stone-600">Delivered visits</p>
                <p className="mt-5 text-4xl font-black tracking-tight text-stone-950">{deliveredWalks.length}</p>
                <p className="mt-2 text-sm leading-6 text-stone-500">Reports visible in the client timeline.</p>
              </div>
              <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
                <p className="text-sm font-semibold text-stone-600">Walker notes</p>
                <p className="mt-5 flex items-center gap-2 text-xl font-black tracking-tight text-stone-950">
                  <MessageSquareQuote className="h-4 w-4 text-blue-700" />
                  Personalized updates
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-500">Warm notes from the field stay easy to revisit.</p>
              </div>
              <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
                <p className="text-sm font-semibold text-stone-600">Care observations</p>
                <p className="mt-5 flex items-center gap-2 text-xl font-black tracking-tight text-stone-950">
                  <HeartPulse className="h-4 w-4 text-red-600" />
                  Behavior + health
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-500">Behavior and health notes stay grouped with the visit.</p>
              </div>
            </div>
          </section>

          <section className="kinetic-card rounded-[2rem] bg-[#003fb1] p-7 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/14">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#dbe1ff]">Visit recap</p>
                <h2 className="font-[var(--font-display)] text-2xl font-bold tracking-tight">
                  {deliveredWalks.length ? 'Your recent walks are saved and easy to revisit.' : 'Reports will appear here after the first completed visit.'}
                </h2>
              </div>
            </div>
            <div className="mt-6 rounded-[1.6rem] border border-white/12 bg-white/8 p-5">
              <p className="text-sm leading-6 text-[#dbe1ff]">
                Each report combines timing, notes, and care context so you can quickly remember how the visit went without chasing texts or photos.
              </p>
            </div>
          </section>
        </div>

        {!deliveredWalks.length ? (
          <Card className="mt-6 overflow-hidden border-stone-200">
            <Image src="/assets/portal/empty-state-no-walks.png" alt="No walk reports yet" width={1200} height={900} className="h-auto w-full" />
            <CardContent className="pt-0">
              <p className="text-sm text-stone-500">No delivered walk reports yet. They will appear here after completed visits.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 space-y-4">
            {deliveredWalks.map((walk) => (
              <Card key={`${walk.bookingId}-${walk.startedAt ?? walk.scheduledAt}`} className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">{new Date(walk.scheduledAt).toLocaleString()}</CardTitle>
                      <CardDescription>
                        {walk.startedAt ? `Started ${new Date(walk.startedAt).toLocaleTimeString()}` : 'Visit time not started yet'}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="capitalize">{walk.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-3 text-sm text-stone-600">
                  <div className="kinetic-card-soft rounded-[1.2rem] border border-[rgba(115,118,134,0.15)] p-4">
                    <p className="flex items-center gap-2 font-medium text-stone-900">
                      <MessageSquareQuote className="h-4 w-4 text-blue-700" />
                      Walker message
                    </p>
                    <p>{walk.report?.walker_message || 'No personalized note yet.'}</p>
                  </div>
                  <div className="kinetic-card-soft rounded-[1.2rem] border border-[rgba(115,118,134,0.15)] p-4">
                    <p className="flex items-center gap-2 font-medium text-stone-900">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                      Behavior notes
                    </p>
                    <p>{walk.report?.behavior_notes || 'No behavior notes.'}</p>
                  </div>
                  <div className="kinetic-card-soft rounded-[1.2rem] border border-[rgba(115,118,134,0.15)] p-4">
                    <p className="flex items-center gap-2 font-medium text-stone-900">
                      <HeartPulse className="h-4 w-4 text-red-600" />
                      Health notes
                    </p>
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
    <div className="kinetic-shell mx-auto max-w-7xl px-4 py-10">
      <div className="grid gap-6 xl:grid-cols-[1.14fr_0.86fr]">
        <section className="kinetic-card rounded-[2rem] p-8">
          <Badge className="kinetic-pill mb-4 px-4 py-2 shadow-none">Walk reports</Badge>
          <h1 className="section-title text-4xl">Every completed visit becomes a story, not just a status update.</h1>
          <p className="editorial-subtitle mt-5 max-w-2xl">
            Completed visits and delivered walk notes for {tenant.business_name}. This is the running history of what happened on each service.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
              <p className="text-sm font-semibold text-stone-600">Delivered visits</p>
              <p className="mt-5 text-4xl font-black tracking-tight text-stone-950">{deliveredWalks.length}</p>
              <p className="mt-2 text-sm leading-6 text-stone-500">Reports visible in the client timeline.</p>
            </div>
            <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
              <p className="text-sm font-semibold text-stone-600">Walker notes</p>
              <p className="mt-5 flex items-center gap-2 text-xl font-black tracking-tight text-stone-950">
                <MessageSquareQuote className="h-4 w-4 text-blue-700" />
                Personalized updates
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-500">Warm notes from the field stay grouped with the visit.</p>
            </div>
            <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
              <p className="text-sm font-semibold text-stone-600">Visit timing</p>
              <p className="mt-5 flex items-center gap-2 text-xl font-black tracking-tight text-stone-950">
                <CalendarClock className="h-4 w-4 text-blue-700" />
                Tracked starts
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-500">Visit timing and notes stay bundled together for reference.</p>
            </div>
          </div>
        </section>

        <section className="kinetic-card rounded-[2rem] bg-[#003fb1] p-7 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/14">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#dbe1ff]">Visit recap</p>
              <h2 className="font-[var(--font-display)] text-2xl font-bold tracking-tight">
                {deliveredWalks.length ? 'Your recent walks are saved and easy to revisit.' : 'Reports will appear here after the first completed visit.'}
              </h2>
            </div>
          </div>
          <div className="mt-6 rounded-[1.6rem] border border-white/12 bg-white/8 p-5">
            <p className="text-sm leading-6 text-[#dbe1ff]">
              Each report combines timing, notes, and care observations so you can remember how a visit went without searching elsewhere.
            </p>
          </div>
        </section>
      </div>

      {!deliveredWalks.length ? (
        <Card className="mt-6 overflow-hidden border-stone-200">
          <Image src="/assets/portal/empty-state-no-walks.png" alt="No walk reports yet" width={1200} height={900} className="h-auto w-full" />
          <CardContent className="pt-0">
            <p className="text-sm text-stone-500">No delivered walk reports yet. They will appear here after completed visits.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {deliveredWalks.map((walk) => (
            <Card key={`${walk.bookingId}-${walk.startedAt ?? walk.scheduledAt}`} className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">{new Date(walk.scheduledAt).toLocaleString()}</CardTitle>
                    <CardDescription>
                      {walk.startedAt ? `Started ${new Date(walk.startedAt).toLocaleTimeString()}` : 'Visit time not started yet'}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="capitalize">{walk.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-3 text-sm text-stone-600">
                <div className="kinetic-card-soft rounded-[1.2rem] border border-[rgba(115,118,134,0.15)] p-4">
                  <p className="flex items-center gap-2 font-medium text-stone-900">
                    <MessageSquareQuote className="h-4 w-4 text-blue-700" />
                    Walker message
                  </p>
                  <p>{walk.report?.walker_message || 'No personalized note yet.'}</p>
                </div>
                <div className="kinetic-card-soft rounded-[1.2rem] border border-[rgba(115,118,134,0.15)] p-4">
                  <p className="flex items-center gap-2 font-medium text-stone-900">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    Behavior notes
                  </p>
                  <p>{walk.report?.behavior_notes || 'No behavior notes.'}</p>
                </div>
                <div className="kinetic-card-soft rounded-[1.2rem] border border-[rgba(115,118,134,0.15)] p-4">
                  <p className="flex items-center gap-2 font-medium text-stone-900">
                    <HeartPulse className="h-4 w-4 text-red-600" />
                    Health notes
                  </p>
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
