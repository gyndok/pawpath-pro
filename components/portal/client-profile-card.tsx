'use client'

import { useActionState } from 'react'
import { Loader2, Sparkles, UserRound } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProfilePhoto } from '@/components/shared/profile-photo'
import { type ClientProfileState, updateClientProfilePhotoAction } from '@/lib/actions/client-profile'

export function ClientProfileCard({
  tenantSlug,
  fullName,
  photoUrl,
}: {
  tenantSlug: string
  fullName: string
  photoUrl: string | null
}) {
  const [state, formAction, isPending] = useActionState<ClientProfileState, FormData>(
    updateClientProfilePhotoAction.bind(null, tenantSlug),
    {}
  )

  return (
    <Card className="kinetic-card rounded-[32px] border-0 shadow-[0_30px_70px_rgba(18,52,70,0.08)]">
      <CardHeader className="space-y-3 pb-4">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#d9eef7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#1d5671]">
          <Sparkles className="h-3.5 w-3.5" />
          Client-facing identity
        </div>
        <CardTitle className="text-2xl text-[#143042]">Owner profile photo</CardTitle>
        <CardDescription className="max-w-2xl text-sm leading-6 text-[#4f6b7a]">
          Add a recognizable photo so the portal feels more personal and the walker can quickly match the account to the right household.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-6 md:grid-cols-[132px_1fr]">
          <div className="overflow-hidden rounded-[28px] border border-[#d7e4eb] bg-white shadow-[0_18px_34px_rgba(18,52,70,0.08)]">
            <ProfilePhoto
              src={photoUrl}
              alt={`${fullName} profile photo`}
              name={fullName}
              className="h-[132px] w-[132px]"
              fallbackClassName="text-xl"
              fallback={<UserRound className="h-9 w-9 text-[#2f6f8f]" />}
            />
          </div>

          <div className="space-y-4 rounded-[28px] border border-[#d7e4eb] bg-white p-5 shadow-sm">
            <div className="space-y-1.5">
              <Label htmlFor="client_photo_url" className="text-sm font-semibold text-[#143042]">Photo URL</Label>
              <Input
                id="client_photo_url"
                name="photo_url"
                defaultValue={photoUrl ?? ''}
                placeholder="https://example.com/owner-photo.jpg"
                className="h-11 rounded-2xl border-[#d7e4eb] bg-[#fbfdfe] text-[#143042] shadow-none focus-visible:border-[#2f6f8f] focus-visible:ring-[#d9eef7]"
              />
              <p className="text-xs text-[#6d8796]">Use a public image URL for now. We can add direct uploads later.</p>
            </div>

            {state.error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</div>}
            {state.success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Owner photo updated.</div>}

            <Button type="submit" className="h-11 rounded-full bg-[#2f6f8f] px-5 text-white hover:bg-[#245a75]" disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Save owner photo'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
