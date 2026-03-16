import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

  return (
    <div className="max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <p className="text-sm text-stone-500">Client directory, waiver verification, pet logistics, and account status for {businessName}.</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardDescription>Active clients</CardDescription>
            <CardTitle>{clients.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardDescription>Pets on file</CardDescription>
            <CardTitle>{pets.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardDescription>Signed waivers</CardDescription>
            <CardTitle>{signedClientIds.size}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardDescription>Open balances</CardDescription>
            <CardTitle>{invoices.filter((invoice) => !['paid', 'voided'].includes(invoice.status)).length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-4">
        {clients.map((client) => {
          const clientPets = pets.filter((pet) => pet.client_id === client.id)
          const clientBookings = bookings.filter((booking) => booking.client_id === client.id)
          const nextVisit = clientBookings
            .filter((booking) => ['pending', 'approved'].includes(booking.status))
            .sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at))[0]
          const clientInvoices = invoices.filter((invoice) => invoice.client_id === client.id)
          const openInvoices = clientInvoices.filter((invoice) => !['paid', 'voided'].includes(invoice.status))

          return (
            <Card key={client.id} className="border-stone-200">
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle>{client.full_name}</CardTitle>
                    <CardDescription>
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
              <CardContent className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-4">
                  <div className="rounded-xl border border-stone-200 p-4">
                    <p className="text-sm font-medium text-stone-900">Emergency contact</p>
                    <p className="mt-1 text-sm text-stone-600">{client.emergency_contact_name || 'No emergency contact'} · {client.emergency_contact_phone || 'No phone on file'}</p>
                  </div>
                  <div className="rounded-xl border border-stone-200 p-4">
                    <p className="text-sm font-medium text-stone-900">Pets and handling notes</p>
                    <div className="mt-3 space-y-3 text-sm text-stone-600">
                      {clientPets.map((pet) => (
                        <div key={pet.id} className="rounded-lg bg-stone-50 p-3">
                          <p className="font-medium text-stone-900">{pet.name} · {pet.breed || pet.species}</p>
                          <p>Behavior: {pet.behavior_notes || 'No behavior notes provided.'}</p>
                          <p>Allergies: {pet.allergies || 'None listed'}</p>
                          <p>Vet: {pet.vet_name || 'No vet on file'} {pet.vet_phone ? `· ${pet.vet_phone}` : ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-stone-200 p-4">
                    <p className="text-sm font-medium text-stone-900">Upcoming logistics</p>
                    {nextVisit ? (
                      <div className="mt-2 text-sm text-stone-600">
                        <p>{serviceById.get(nextVisit.service_id) || 'Walk service'} · {new Date(nextVisit.scheduled_at).toLocaleString()}</p>
                        <p className="mt-1">Status: <span className="capitalize">{nextVisit.status}</span></p>
                        <p className="mt-1">
                          Pets: {bookingPets
                            .filter((bookingPet) => bookingPet.booking_id === nextVisit.id)
                            .map((bookingPet) => petById.get(bookingPet.pet_id)?.name)
                            .filter(Boolean)
                            .join(', ') || clientPets.map((pet) => pet.name).join(', ')}
                        </p>
                        {nextVisit.notes && <p className="mt-1">Notes: {nextVisit.notes}</p>}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-stone-500">No pending or approved visits right now.</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-stone-200 p-4">
                    <p className="text-sm font-medium text-stone-900">Accounting snapshot</p>
                    <div className="mt-2 space-y-2 text-sm text-stone-600">
                      {clientInvoices.length ? clientInvoices.slice(0, 3).map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
                          <span>${Number(invoice.amount).toFixed(2)}</span>
                          <Badge variant="secondary" className="capitalize">{invoice.status}</Badge>
                        </div>
                      )) : (
                        <p className="text-stone-500">No invoices yet.</p>
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
