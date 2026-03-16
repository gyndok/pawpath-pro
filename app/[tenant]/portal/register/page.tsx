'use client'

import { useActionState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerClientAction } from '@/lib/actions/client-register'
import { useTenant } from '@/lib/context/tenant-context'

export default function ClientRegisterPage() {
  const params = useParams<{ tenant: string }>()
  const { tenant } = useTenant()
  const [state, formAction, isPending] = useActionState(
    registerClientAction.bind(null, params.tenant),
    {}
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Create a Client Account</CardTitle>
              <CardDescription>Join {tenant.business_name} and complete your intake in one step.</CardDescription>
            </div>
            <Badge variant="secondary">Client onboarding</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-8">
            {params.tenant === 'demo' && (
              <section className="rounded-xl border border-[#f2d2b5] bg-[#fff6ed] p-4 text-sm text-stone-700">
                This demo onboarding flow signs you into the seeded client account after submission so you can explore the portal immediately.
              </section>
            )}

            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Owner Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input id="full_name" name="full_name" placeholder="Jordan Lee" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" placeholder="8+ characters" required minLength={8} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="(555) 555-1212" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Home address</Label>
                <Input id="address" name="address" placeholder="123 Oak Street, Houston, TX 77001" />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Emergency Contact</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="emergency_contact_name">Emergency contact name</Label>
                  <Input id="emergency_contact_name" name="emergency_contact_name" placeholder="Alex Morgan" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="emergency_contact_phone">Emergency contact phone</Label>
                  <Input id="emergency_contact_phone" name="emergency_contact_phone" type="tel" placeholder="(555) 222-3344" />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Pet Information Sheet</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pet_name">Pet name</Label>
                  <Input id="pet_name" name="pet_name" placeholder="Mochi" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="breed">Breed</Label>
                  <Input id="breed" name="breed" placeholder="Mini Goldendoodle" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dob">Birthday</Label>
                  <Input id="dob" name="dob" type="date" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="weight_lbs">Weight (lbs)</Label>
                  <Input id="weight_lbs" name="weight_lbs" type="number" min="0" step="0.1" placeholder="28" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vet_name">Vet name</Label>
                  <Input id="vet_name" name="vet_name" placeholder="Dr. Kim" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vet_clinic">Vet clinic</Label>
                  <Input id="vet_clinic" name="vet_clinic" placeholder="Houston Pet Clinic" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vet_phone">Vet phone</Label>
                  <Input id="vet_phone" name="vet_phone" type="tel" placeholder="(555) 987-6543" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="microchip">Microchip #</Label>
                  <Input id="microchip" name="microchip" placeholder="981020004567891" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="medications">Medications</Label>
                  <textarea id="medications" name="medications" rows={4} className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" placeholder="Medication name, dosage, schedule" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="allergies">Allergies / medical conditions</Label>
                  <textarea id="allergies" name="allergies" rows={4} className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" placeholder="Food allergies, heat sensitivity, medical history" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="behavior_notes">Behavior profile</Label>
                  <textarea id="behavior_notes" name="behavior_notes" rows={4} className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" placeholder="Reactivity, leash manners, triggers, recall cues" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="special_notes">Special handling notes</Label>
                  <textarea id="special_notes" name="special_notes" rows={4} className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" placeholder="Preferred routes, harness setup, off-limit areas, feeding notes" />
                </div>
              </div>
            </section>

            {params.tenant === 'demo' && (
              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Payment Setup</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="card_number">Card number</Label>
                    <Input id="card_number" name="card_number" placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="card_zip">Billing ZIP</Label>
                    <Input id="card_zip" name="card_zip" placeholder="77007" defaultValue="77007" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="card_expiry">Expiry</Label>
                    <Input id="card_expiry" name="card_expiry" placeholder="08/28" defaultValue="08/28" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="card_cvc">CVC</Label>
                    <Input id="card_cvc" name="card_cvc" placeholder="424" defaultValue="424" />
                  </div>
                </div>
                <p className="text-xs text-stone-500">Demo only: this simulates storing a card on file for invoicing and autopay.</p>
              </section>
            )}

            <section className="space-y-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#c66a2b]" />
                <div>
                  <h2 className="font-semibold">Service agreement and liability acknowledgements</h2>
                  <p className="text-sm text-stone-500">
                    This stores a digital onboarding acknowledgment now and can map to a fuller legal waiver template as the product expands.
                  </p>
                </div>
              </div>
              <label className="flex items-start gap-3 text-sm text-stone-700">
                <input type="checkbox" name="accepts_waiver" className="mt-1" required />
                <span>I understand dog walking involves inherent risks and I accept the service agreement and liability waiver for services provided by {tenant.business_name}.</span>
              </label>
              <label className="flex items-start gap-3 text-sm text-stone-700">
                <input type="checkbox" name="authorizes_emergency_care" className="mt-1" required />
                <span>I authorize emergency veterinary treatment if I cannot be reached and understand I am responsible for related costs.</span>
              </label>
              <label className="flex items-start gap-3 text-sm text-stone-700">
                <input type="checkbox" name="disclosed_behavior" className="mt-1" required />
                <span>I have disclosed any bite history, aggression, reactivity, medication needs, and other safety-relevant behavioral information.</span>
              </label>
            </section>

            {state.error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {state.error}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <Link href="login" className="text-violet-600 hover:underline">Sign in</Link>
              </p>
              <Button type="submit" className="bg-[#c66a2b] hover:bg-[#ad5821]" disabled={isPending}>
                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…</> : 'Create Client Account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
