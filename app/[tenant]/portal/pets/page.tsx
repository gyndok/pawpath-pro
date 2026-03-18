import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ClientProfileCard } from '@/components/portal/client-profile-card'
import { PetManager } from '@/components/portal/pet-manager'
import { demoClientProfile, demoPets, isDemoTenantSlug, requireDemoRole } from '@/lib/demo'
import { requireTenantClient } from '@/lib/tenant-session'

export default async function PortalPetsPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params

  if (isDemoTenantSlug(tenantSlug)) {
    await requireDemoRole('client', tenantSlug)
    const pets = demoPets.filter((pet) => pet.client_id === demoClientProfile.id)

    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">My Pets</h1>
            <p className="text-sm text-stone-500">Pet information currently on file for Maple & Main Dog Walking.</p>
          </div>
          <Badge variant="secondary">{pets.length} pets</Badge>
        </div>

        <div className="mb-6">
          <ClientProfileCard
            tenantSlug={tenantSlug}
            fullName={demoClientProfile.full_name}
            photoUrl={demoClientProfile.photo_url}
          />
        </div>

        <PetManager tenantSlug={tenantSlug} pets={pets} />
      </div>
    )
  }

  const { tenant, clientProfile, supabase } = await requireTenantClient(tenantSlug)

  const { data: pets } = await supabase
    .from('pets')
    .select('id, name, photo_url, breed, species, medications, allergies, behavior_notes, special_notes, vet_name, vet_phone, microchip, weight_lbs')
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

      {!pets?.length && (
        <Card className="mb-6 overflow-hidden border-stone-200">
          <Image src="/assets/portal/empty-state-no-pets.png" alt="No pets on file" width={1200} height={900} className="h-auto w-full" />
          <CardContent className="pt-0">
            <p className="text-sm text-stone-500">No pet profile has been added yet. Add your first pet below.</p>
          </CardContent>
        </Card>
      )}

      <div className="mb-6">
        <ClientProfileCard
          tenantSlug={tenantSlug}
          fullName={clientProfile.full_name}
          photoUrl={clientProfile.photo_url ?? null}
        />
      </div>

      <PetManager
        tenantSlug={tenantSlug}
        pets={(pets ?? []).map((pet) => ({
          ...pet,
          weight_lbs: pet.weight_lbs ? Number(pet.weight_lbs) : null,
        }))}
      />
    </div>
  )
}
