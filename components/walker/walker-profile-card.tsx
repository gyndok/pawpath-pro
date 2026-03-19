'use client'

import { useActionState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProfilePhoto } from '@/components/shared/profile-photo'
import { type WalkerProfileState, updateWalkerPhotoAction } from '@/lib/actions/walker-profile'

export function WalkerProfileCard({
  tenantSlug,
  businessName,
  photoUrl,
}: {
  tenantSlug: string
  businessName: string
  photoUrl: string | null
}) {
  const [state, formAction, isPending] = useActionState<WalkerProfileState, FormData>(
    updateWalkerPhotoAction.bind(null, tenantSlug),
    {}
  )

  return (
    <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="font-[var(--font-display)] text-2xl tracking-tight">Walker profile photo</CardTitle>
        <CardDescription className="mt-2 text-sm leading-6 text-stone-600">Set the photo that appears in the dashboard and owner-facing portal.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-5 md:grid-cols-[120px_1fr]">
          <div className="overflow-hidden rounded-[1.6rem] border border-[rgba(115,118,134,0.15)] bg-white shadow-sm">
            <ProfilePhoto
              src={photoUrl}
              alt={`${businessName} walker photo`}
              name={businessName}
              className="h-28 w-28"
              fallbackClassName="text-xl"
              fallback={<Camera className="h-9 w-9 text-[#b45a21]" />}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="walker_photo_url">Photo URL</Label>
              <Input
                id="walker_photo_url"
                name="photo_url"
                defaultValue={photoUrl ?? ''}
                placeholder="https://example.com/walker-photo.jpg"
              />
              <p className="text-xs text-stone-500">Use a public image URL for now. This can become an upload workflow later.</p>
            </div>

            {state.error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</div>}
            {state.success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Walker photo updated.</div>}

            <Button type="submit" variant="outline" disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Save walker photo'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
