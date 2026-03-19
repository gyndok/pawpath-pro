import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { HeartPulse, PawPrint, Sparkles } from 'lucide-react'
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
      <div className="kinetic-shell mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-6 xl:grid-cols-[1.16fr_0.84fr]">
          <section className="kinetic-card rounded-[2rem] p-8">
            <Badge className="kinetic-pill mb-4 px-4 py-2 shadow-none">Pet profiles</Badge>
            <h1 className="section-title text-4xl">Keep every pet profile current before the leash ever comes off the hook.</h1>
            <p className="editorial-subtitle mt-5 max-w-2xl">
              Allergies, meds, behavior notes, and vet contacts all live here so the walker has the full care picture before every visit.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
                <p className="text-sm font-semibold text-stone-600">Pets on file</p>
                <p className="mt-5 text-4xl font-black tracking-tight text-stone-950">{pets.length}</p>
                <p className="mt-2 text-sm leading-6 text-stone-500">Profiles ready for booking and reporting.</p>
              </div>
              <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
                <p className="text-sm font-semibold text-stone-600">Care details</p>
                <p className="mt-5 flex items-center gap-2 text-xl font-black tracking-tight text-stone-950">
                  <HeartPulse className="h-4 w-4 text-red-600" />
                  Live health notes
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-500">Medication, allergies, and vet info stay attached to each pet.</p>
              </div>
              <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
                <p className="text-sm font-semibold text-stone-600">Walker-ready</p>
                <p className="mt-5 flex items-center gap-2 text-xl font-black tracking-tight text-stone-950">
                  <PawPrint className="h-4 w-4 text-blue-700" />
                  Visit context
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-500">Handling notes and temperament stay visible before every walk.</p>
              </div>
            </div>
          </section>

          <section className="kinetic-card rounded-[2rem] bg-[#003fb1] p-7 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/14">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#dbe1ff]">Care overview</p>
                <h2 className="font-[var(--font-display)] text-2xl font-bold tracking-tight">Your pet records are part of the service experience, not a side form.</h2>
              </div>
            </div>
            <div className="mt-6 rounded-[1.6rem] border border-white/12 bg-white/8 p-5">
              <p className="text-sm leading-6 text-[#dbe1ff]">
                Keep this area current whenever routines, triggers, medications, or veterinary details change. The walker sees this information before the next visit.
              </p>
            </div>
          </section>
        </div>

        <div className="mb-6 mt-6">
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
    <div className="kinetic-shell mx-auto max-w-7xl px-4 py-10">
      <div className="grid gap-6 xl:grid-cols-[1.16fr_0.84fr]">
        <section className="kinetic-card rounded-[2rem] p-8">
          <Badge className="kinetic-pill mb-4 px-4 py-2 shadow-none">Pet profiles</Badge>
          <h1 className="section-title text-4xl">Keep every pet profile current before the leash ever comes off the hook.</h1>
          <p className="editorial-subtitle mt-5 max-w-2xl">
            Pet information currently on file for {tenant.business_name}. This is the care layer that makes each walk feel informed and personal.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
              <p className="text-sm font-semibold text-stone-600">Pets on file</p>
              <p className="mt-5 text-4xl font-black tracking-tight text-stone-950">{pets?.length ?? 0}</p>
              <p className="mt-2 text-sm leading-6 text-stone-500">Profiles ready for scheduling and walk reports.</p>
            </div>
            <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
              <p className="text-sm font-semibold text-stone-600">Care details</p>
              <p className="mt-5 flex items-center gap-2 text-xl font-black tracking-tight text-stone-950">
                <HeartPulse className="h-4 w-4 text-red-600" />
                Health + allergy notes
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-500">Medication, allergies, and vet contacts stay attached to each profile.</p>
            </div>
            <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
              <p className="text-sm font-semibold text-stone-600">Walker-ready</p>
              <p className="mt-5 flex items-center gap-2 text-xl font-black tracking-tight text-stone-950">
                <PawPrint className="h-4 w-4 text-blue-700" />
                Handling context
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-500">Behavior and special notes travel with the pet to every visit.</p>
            </div>
          </div>
        </section>

        <section className="kinetic-card rounded-[2rem] bg-[#003fb1] p-7 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/14">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#dbe1ff]">Care overview</p>
              <h2 className="font-[var(--font-display)] text-2xl font-bold tracking-tight">The more complete this page is, the better the next walk goes.</h2>
            </div>
          </div>
          <div className="mt-6 rounded-[1.6rem] border border-white/12 bg-white/8 p-5">
            <p className="text-sm leading-6 text-[#dbe1ff]">
              Update routines, triggers, meds, and vet info whenever something changes. Your walker depends on this profile before the next booking.
            </p>
          </div>
        </section>
      </div>

      {!pets?.length && (
        <Card className="mb-6 mt-6 overflow-hidden border-stone-200">
          <Image src="/assets/portal/empty-state-no-pets.png" alt="No pets on file" width={1200} height={900} className="h-auto w-full" />
          <CardContent className="pt-0">
            <p className="text-sm text-stone-500">No pet profile has been added yet. Add your first pet below.</p>
          </CardContent>
        </Card>
      )}

      <div className="mb-6 mt-6">
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
