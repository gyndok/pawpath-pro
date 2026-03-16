import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireTenantClient } from '@/lib/tenant-session'

export default async function PortalPetsPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params
  const { tenant, clientProfile, supabase } = await requireTenantClient(tenantSlug)

  const { data: pets } = await supabase
    .from('pets')
    .select('id, name, breed, species, medications, allergies, behavior_notes, special_notes, vet_name, vet_phone, microchip')
    .eq('tenant_id', tenant.id)
    .eq('client_id', clientProfile.id)
    .order('created_at', { ascending: true })

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">My Pets</h1>
          <p className="text-sm text-stone-500">Pet information currently on file for {tenant.business_name}.</p>
        </div>
        <Badge variant="secondary">{pets?.length ?? 0} pets</Badge>
      </div>

      {!pets?.length ? (
        <Card className="overflow-hidden border-stone-200">
          <Image src="/assets/portal/empty-state-no-pets.png" alt="No pets on file" width={1200} height={900} className="h-auto w-full" />
          <CardContent className="pt-0">
            <p className="text-sm text-stone-500">No pet profile has been added yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pets.map((pet) => (
            <Card key={pet.id} className="border-stone-200">
              <CardHeader>
                <CardTitle>{pet.name}</CardTitle>
                <CardDescription>{pet.breed || 'Breed not provided'} · {pet.species}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 text-sm text-stone-600">
                  <div>
                    <p className="font-medium text-stone-900">Health notes</p>
                    <p>Medications: {pet.medications || 'None listed'}</p>
                    <p>Allergies: {pet.allergies || 'None listed'}</p>
                    <p>Microchip: {pet.microchip || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">Vet</p>
                    <p>{pet.vet_name || 'No vet on file'}</p>
                    <p>{pet.vet_phone || 'No vet phone on file'}</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-stone-600">
                  <div>
                    <p className="font-medium text-stone-900">Behavior notes</p>
                    <p>{pet.behavior_notes || 'No behavior notes provided.'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">Handling notes</p>
                    <p>{pet.special_notes || 'No special handling notes provided.'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
