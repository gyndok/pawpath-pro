import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarClock, ClipboardCheck, HeartPulse, MapPinned, PawPrint, ShieldCheck, Sparkles, Wallet } from 'lucide-react'
import {
  demoBookingPets,
  demoBookings,
  demoClients,
  demoClientProfile,
  demoInvoices,
  demoPets,
  demoServices,
  isDemoTenantSlug,
  requireDemoRole,
} from '@/lib/demo'
import { requireTenantWalker } from '@/lib/tenant-session'

function clientStatusTone(openInvoices: number) {
  if (openInvoices > 0) return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}

export default async function WalkerClientsPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params
  type ClientRow = {
    id: string
    full_name: string
    phone: string | null
    address: string | null
    emergency_contact_name: string | null
    emergency_contact_phone: string | null
  }
  type PetRow = {
    id: string
    client_id: string
    name: string
    breed: string | null
    medications: string | null
    allergies: string | null
    behavior_notes: string | null
    special_notes: string | null
    vet_name: string | null
    vet_phone: string | null
    microchip: string | null
    species: string
    weight_lbs: number | null
  }
  type BookingRow = {
    id: string
    client_id: string
    service_id: string
    scheduled_at: string
    status: string
    notes: string | null
  }
  type InvoiceRow = {
    id: string
    client_id: string
    amount: number
    status: string
    due_date: string | null
    paid_at: string | null
    notes: string | null
    created_at: string
    walk_id: string | null
  }
  type BookingPetRow = { booking_id: string; pet_id: string }
  type ServiceRow = { id: string; name: string }

  let businessName = 'PawPath Pro'
  let clients: ClientRow[] = demoClients.map((client) => ({
    id: client.id,
    full_name: client.full_name,
    phone: client.phone,
    address: client.address,
    emergency_contact_name: client.emergency_contact_name,
    emergency_contact_phone: client.emergency_contact_phone,
  }))
  let pets: PetRow[] = demoPets
  let bookings: BookingRow[] = demoBookings.map((booking) => ({
    id: booking.id,
    client_id: booking.client_id,
    service_id: booking.service_id,
    scheduled_at: booking.scheduled_at,
    status: booking.status,
    notes: booking.notes,
  }))
  let invoices: InvoiceRow[] = demoInvoices
  let bookingPets: BookingPetRow[] = demoBookingPets
  let services: ServiceRow[] = demoServices.map((service) => ({ id: service.id, name: service.name }))
  let signedClientIds = new Set<string>([demoClientProfile.id])

  if (isDemoTenantSlug(tenantSlug)) {
    await requireDemoRole('walker', tenantSlug)
    businessName = 'Maple & Main Dog Walking'
  } else {
    const { tenant, supabase } = await requireTenantWalker(tenantSlug)
    businessName = tenant.business_name

    const [
      clientsResult,
      petsResult,
      bookingsResult,
      invoicesResult,
      bookingPetsResult,
      servicesResult,
      waiverResult,
    ] = await Promise.all([
      supabase.from('client_profiles').select('id, full_name, phone, address, emergency_contact_name, emergency_contact_phone').eq('tenant_id', tenant.id).order('created_at', { ascending: true }),
      supabase.from('pets').select('id, client_id, name, breed, medications, allergies, behavior_notes, special_notes, vet_name, vet_phone, microchip, species, weight_lbs').eq('tenant_id', tenant.id),
      supabase.from('bookings').select('id, client_id, service_id, scheduled_at, status, notes').eq('tenant_id', tenant.id).order('scheduled_at', { ascending: false }),
      supabase.from('invoices').select('id, client_id, amount, status, due_date, paid_at, notes, created_at, walk_id').eq('tenant_id', tenant.id),
      supabase.from('booking_pets').select('booking_id, pet_id').eq('tenant_id', tenant.id),
      supabase.from('services').select('id, name').eq('tenant_id', tenant.id),
      supabase.from('waivers').select('id').eq('tenant_id', tenant.id).eq('is_active', true).order('version', { ascending: false }).limit(1).maybeSingle(),
    ])

    clients = clientsResult.data ?? []
    pets = (petsResult.data ?? []).map((pet) => ({
      ...pet,
      weight_lbs: pet.weight_lbs ? Number(pet.weight_lbs) : null,
    }))
    bookings = bookingsResult.data ?? []
    invoices = (invoicesResult.data ?? []).map((invoice) => ({ ...invoice, amount: Number(invoice.amount) }))
    bookingPets = bookingPetsResult.data ?? []
    services = servicesResult.data ?? []

    if (waiverResult.data?.id) {
      const waiverSignatures = await supabase
        .from('waiver_signatures')
        .select('client_id')
        .eq('tenant_id', tenant.id)
        .eq('waiver_id', waiverResult.data.id)

      signedClientIds = new Set((waiverSignatures.data ?? []).map((signature) => signature.client_id))
    } else {
      signedClientIds = new Set()
    }
  }

  const serviceById = new Map(services.map((service) => [service.id, service.name]))
  const petById = new Map(pets.map((pet) => [pet.id, pet]))
  const openInvoiceCount = invoices.filter((invoice) => !['paid', 'voided'].includes(invoice.status)).length

  const summary = [
    {
      label: 'Active clients',
      value: clients.length,
      detail: `${businessName} currently has ${pets.length} pets on file`,
      icon: ShieldCheck,
      tint: 'text-blue-700',
    },
    {
      label: 'Signed waivers',
      value: signedClientIds.size,
      detail: `${Math.max(clients.length - signedClientIds.size, 0)} still need review or signature`,
      icon: ClipboardCheck,
      tint: 'text-emerald-700',
    },
    {
      label: 'Open balances',
      value: openInvoiceCount,
      detail: openInvoiceCount ? 'Collections follow-up needed' : 'All client accounts are current',
      icon: Wallet,
      tint: 'text-amber-700',
    },
  ]

  return (
    <div className="kinetic-shell max-w-7xl p-6 lg:p-8">
      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <section className="kinetic-card rounded-[2rem] p-8">
          <Badge className="kinetic-pill mb-4 px-4 py-2 shadow-none">
            Client relationships
          </Badge>
          <h1 className="section-title text-4xl">
            Keep every household, pet profile, waiver, and next visit organized in one operator view.
          </h1>
          <p className="editorial-subtitle mt-5 max-w-2xl">
            This is the working directory for {businessName}: client readiness, emergency context, pet handling notes, and billing health all side by side.
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
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#dbe1ff]">Directory health</p>
              <h2 className="font-[var(--font-display)] text-2xl font-bold tracking-tight">
                {clients.length ? 'You have live client records ready for scheduling and care.' : 'Client records will appear here as owners onboard.'}
              </h2>
            </div>
          </div>

          <div className="mt-6 rounded-[1.6rem] border border-white/12 bg-white/8 p-5">
            <p className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-white">
              {clients[0]?.full_name || 'No client yet'}
            </p>
            <p className="mt-2 text-sm text-[#dbe1ff]">
              {clients[0]?.address || 'Address will appear once the first client profile is on file.'}
            </p>
            <p className="mt-4 text-sm leading-6 text-[#dbe1ff]">
              Use this page to confirm waiver status, pet handling notes, emergency contacts, and upcoming visit logistics before you step out the door.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.2rem] bg-white/8 p-4">
              <p className="text-sm text-[#dbe1ff]">Pets on file</p>
              <p className="mt-2 flex items-center gap-2 text-lg font-black tracking-tight text-white">
                <PawPrint className="h-4 w-4" />
                {pets.length} total
              </p>
            </div>
            <div className="rounded-[1.2rem] bg-white/8 p-4">
              <p className="text-sm text-[#dbe1ff]">Upcoming visits</p>
              <p className="mt-2 flex items-center gap-2 text-lg font-black tracking-tight text-white">
                <CalendarClock className="h-4 w-4" />
                {bookings.filter((booking) => ['pending', 'approved'].includes(booking.status)).length} queued
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 space-y-5">
        {clients.map((client) => {
          const clientPets = pets.filter((pet) => pet.client_id === client.id)
          const clientBookings = bookings.filter((booking) => booking.client_id === client.id)
          const nextVisit = clientBookings
            .filter((booking) => ['pending', 'approved'].includes(booking.status))
            .sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at))[0]
          const clientInvoices = invoices.filter((invoice) => invoice.client_id === client.id)
          const openInvoices = clientInvoices.filter((invoice) => !['paid', 'voided'].includes(invoice.status))

          return (
            <Card key={client.id} className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">{client.full_name}</CardTitle>
                    <CardDescription className="mt-2 text-sm leading-6 text-stone-600">
                      {client.phone || 'No phone on file'} · {client.address || 'No address on file'}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={signedClientIds.has(client.id) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {signedClientIds.has(client.id) ? 'Waiver signed' : 'Waiver missing'}
                    </Badge>
                    <Badge className={clientStatusTone(openInvoices.length)}>
                      {openInvoices.length ? `${openInvoices.length} open invoice${openInvoices.length === 1 ? '' : 's'}` : 'Current on billing'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
                <div className="space-y-4">
                  <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-500">
                      <HeartPulse className="h-3.5 w-3.5 text-red-600" />
                      Emergency contact
                    </p>
                    <p className="mt-3 text-sm font-semibold text-stone-900">{client.emergency_contact_name || 'No emergency contact'}</p>
                    <p className="mt-1 text-sm text-stone-600">{client.emergency_contact_phone || 'No phone on file'}</p>
                  </div>

                  <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-500">
                      <PawPrint className="h-3.5 w-3.5 text-blue-700" />
                      Pets and handling notes
                    </p>
                    <div className="mt-4 space-y-3">
                      {clientPets.map((pet) => (
                        <div key={pet.id} className="rounded-[1rem] bg-white p-4 shadow-sm">
                          <p className="font-semibold text-stone-900">{pet.name} · {pet.breed || pet.species}</p>
                          <p className="mt-2 text-sm leading-6 text-stone-600">Behavior: {pet.behavior_notes || 'No behavior notes provided.'}</p>
                          <p className="text-sm leading-6 text-stone-600">Allergies: {pet.allergies || 'None listed'}</p>
                          <p className="text-sm leading-6 text-stone-600">Vet: {pet.vet_name || 'No vet on file'}{pet.vet_phone ? ` · ${pet.vet_phone}` : ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-500">
                      <MapPinned className="h-3.5 w-3.5 text-[#9d4300]" />
                      Upcoming logistics
                    </p>
                    {nextVisit ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[1rem] bg-white p-4 shadow-sm sm:col-span-2">
                          <p className="text-sm font-semibold text-stone-900">{serviceById.get(nextVisit.service_id) || 'Walk service'}</p>
                          <p className="mt-2 text-sm text-stone-600">{new Date(nextVisit.scheduled_at).toLocaleString()}</p>
                          <p className="mt-2 text-sm text-stone-600">Status: <span className="capitalize">{nextVisit.status}</span></p>
                          {nextVisit.notes && <p className="mt-2 text-sm leading-6 text-stone-600">Notes: {nextVisit.notes}</p>}
                        </div>
                        <div className="rounded-[1rem] bg-white p-4 shadow-sm">
                          <p className="text-sm font-semibold text-stone-900">Pets on visit</p>
                          <p className="mt-2 text-sm leading-6 text-stone-600">
                            {bookingPets
                              .filter((bookingPet) => bookingPet.booking_id === nextVisit.id)
                              .map((bookingPet) => petById.get(bookingPet.pet_id)?.name)
                              .filter(Boolean)
                              .join(', ') || clientPets.map((pet) => pet.name).join(', ')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm leading-6 text-stone-500">No pending or approved visits right now.</p>
                    )}
                  </div>

                  <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-500">
                      <Wallet className="h-3.5 w-3.5 text-emerald-700" />
                      Accounting snapshot
                    </p>
                    <div className="mt-4 space-y-3">
                      {clientInvoices.length ? clientInvoices.slice(0, 3).map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between rounded-[1rem] bg-white px-4 py-3 shadow-sm">
                          <div>
                            <p className="text-sm font-semibold text-stone-900">${Number(invoice.amount).toFixed(2)}</p>
                            <p className="text-xs text-stone-500">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'No due date'}</p>
                          </div>
                          <Badge variant="secondary" className="capitalize">{invoice.status}</Badge>
                        </div>
                      )) : (
                        <div className="rounded-[1rem] bg-white px-4 py-3 shadow-sm text-sm text-stone-500">No invoices yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {isDemoTenantSlug(tenantSlug) && (
        <Card className="mt-6 border-stone-200 bg-[#fff6ed]">
          <CardHeader>
            <CardTitle>Demo walker path</CardTitle>
            <CardDescription>This is the operator view to show your daughter how client records, waivers, logistics, and billing come together.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-stone-700 md:grid-cols-2">
            <p>1. Open Clients to review pet notes, waiver status, and next-visit logistics.</p>
            <p>2. Open Schedule to approve requests and complete a visit report.</p>
            <p>3. Open Billing to show invoice tracking, reminders, and collections.</p>
            <p>4. Open Settings to show service setup and waiver template management.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
