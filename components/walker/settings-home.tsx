'use client'

import { useActionState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createServiceAction } from '@/lib/actions/walker-services'

type ServiceSummary = {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  base_price: number
  is_active: boolean
}

export function WalkerSettingsHome({
  services,
  activeWaiverTitle,
}: {
  services: ServiceSummary[]
  activeWaiverTitle: string | null
}) {
  const params = useParams<{ tenant: string }>()
  const [state, formAction, isPending] = useActionState(createServiceAction.bind(null, params.tenant), {})

  return (
    <div className="max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-stone-500">Configure the services clients can request.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle>Add a service</CardTitle>
            <CardDescription>Create the walk types that appear in the client portal booking flow.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Service name</Label>
                <Input id="name" name="name" placeholder="30-minute midday walk" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <textarea id="description" name="description" rows={4} className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" placeholder="Ideal for lunchtime potty breaks and neighborhood walks." />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                  <Input id="duration_minutes" name="duration_minutes" type="number" min="1" step="1" placeholder="30" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="base_price">Base price ($)</Label>
                  <Input id="base_price" name="base_price" type="number" min="1" step="0.01" placeholder="25.00" required />
                </div>
              </div>

              {state.error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</div>}
              {state.success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Service added successfully.</div>}

              <Button type="submit" className="bg-[#c66a2b] hover:bg-[#ad5821]" disabled={isPending}>
                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Add service'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Active services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!services.length ? (
                <p className="text-sm text-stone-500">No services configured yet.</p>
              ) : (
                services.map((service) => (
                  <div key={service.id} className="rounded-xl border border-stone-200 p-4 text-sm text-stone-600">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-stone-900">{service.name}</p>
                        <p>{service.duration_minutes} minutes · ${service.base_price.toFixed(2)}</p>
                      </div>
                      <Badge variant="secondary">{service.is_active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    {service.description && <p className="mt-2">{service.description}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Waiver template</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-stone-600">
              <p>Current active waiver:</p>
              <p className="mt-2 font-medium text-stone-900">{activeWaiverTitle || 'No active waiver configured'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
