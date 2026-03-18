'use client'

import { useActionState } from 'react'
import { Loader2, UserRound } from 'lucide-react'
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
    <Card className="border-stone-200">
      <CardHeader>
        <CardTitle>Owner profile photo</CardTitle>
        <CardDescription>Add a photo for the client account so the portal feels more personal and the walker can quickly recognize the owner.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-5 md:grid-cols-[120px_1fr]">
          <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
            <ProfilePhoto
              src={photoUrl}
              alt={`${fullName} profile photo`}
              name={fullName}
              className="h-28 w-28"
              fallbackClassName="text-xl"
              fallback={<UserRound className="h-9 w-9 text-[#b45a21]" />}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="client_photo_url">Photo URL</Label>
              <Input
                id="client_photo_url"
                name="photo_url"
                defaultValue={photoUrl ?? ''}
                placeholder="https://example.com/owner-photo.jpg"
              />
              <p className="text-xs text-stone-500">Use a public image URL for now. We can add direct uploads later.</p>
            </div>

            {state.error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</div>}
            {state.success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Owner photo updated.</div>}

            <Button type="submit" variant="outline" disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Save owner photo'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
