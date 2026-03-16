'use client'

import { useActionState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { signActiveWaiverAction } from '@/lib/actions/client-waiver'

export function WaiverSignCard({
  waiverTitle,
  waiverBody,
  isSigned,
  signatureName,
  signedAt,
}: {
  waiverTitle: string
  waiverBody: string
  isSigned: boolean
  signatureName: string
  signedAt: string | null
}) {
  const params = useParams<{ tenant: string }>()
  const [state, formAction, isPending] = useActionState(signActiveWaiverAction.bind(null, params.tenant), {})

  return (
    <Card className="border-stone-200">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{waiverTitle}</CardTitle>
            <CardDescription>
              {isSigned && signedAt ? `Signed on ${new Date(signedAt).toLocaleString()}` : 'Please review and sign before your first scheduled service.'}
            </CardDescription>
          </div>
          <Badge variant="secondary">{isSigned ? 'Signed' : 'Needs signature'}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="max-h-80 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700">
          {waiverBody}
        </div>

        {isSigned ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4" />
              Signature on file
            </div>
            <p className="mt-2">Signature name: {signatureName}</p>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="signature_name" className="text-sm font-medium text-stone-800">Type your full legal name</label>
              <Input id="signature_name" name="signature_name" defaultValue={signatureName} required />
            </div>

            {state.error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {state.error}
              </div>
            )}

            {state.success && (
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                Your signature was recorded successfully.
              </div>
            )}

            <Button type="submit" className="bg-[#c66a2b] hover:bg-[#ad5821]" disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing…</> : 'Sign waiver'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
