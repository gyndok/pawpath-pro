'use client'

import { useActionState } from 'react'
import { useParams } from 'next/navigation'
import { FileSignature, Loader2, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { signActiveWaiverAction } from '@/lib/actions/client-waiver'
import { formatDateTimeInTimeZone } from '@/lib/datetime'

export function WaiverSignCard({
  waiverTitle,
  waiverBody,
  isSigned,
  signatureName,
  signedAt,
  timeZone,
}: {
  waiverTitle: string
  waiverBody: string
  isSigned: boolean
  signatureName: string
  signedAt: string | null
  timeZone: string
}) {
  const params = useParams<{ tenant: string }>()
  const [state, formAction, isPending] = useActionState(signActiveWaiverAction.bind(null, params.tenant), {})

  return (
    <Card className="kinetic-card rounded-[32px] border-0 shadow-[0_30px_70px_rgba(18,52,70,0.08)]">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#d9eef7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#1d5671]">
              <FileSignature className="h-3.5 w-3.5" />
              Service agreement
            </div>
            <CardTitle className="text-2xl text-[#143042]">{waiverTitle}</CardTitle>
            <CardDescription className="mt-1 text-sm leading-6 text-[#4f6b7a]">
              {isSigned && signedAt ? `Signed on ${formatDateTimeInTimeZone(signedAt, timeZone)}` : 'Please review and sign before your first scheduled service.'}
            </CardDescription>
          </div>
          <Badge className={isSigned ? 'rounded-full bg-[#e7f2ee] px-3 py-1 text-[#1e6150] hover:bg-[#e7f2ee]' : 'rounded-full bg-[#fff1e6] px-3 py-1 text-[#9a5a22] hover:bg-[#fff1e6]'}>
            {isSigned ? 'Signed' : 'Needs signature'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="max-h-80 overflow-y-auto rounded-[24px] border border-[#d7e4eb] bg-white p-5 text-sm leading-7 text-[#365262] shadow-sm">
          {waiverBody}
        </div>

        {isSigned ? (
          <div className="rounded-[24px] border border-green-200 bg-white p-5 text-sm text-green-700 shadow-sm">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4" />
              Signature on file
            </div>
            <p className="mt-2">Signature name: {signatureName}</p>
          </div>
        ) : (
          <form action={formAction} className="space-y-4 rounded-[24px] border border-[#d7e4eb] bg-white p-5 shadow-sm">
            <div className="space-y-1.5">
              <label htmlFor="signature_name" className="text-sm font-medium text-[#143042]">Type your full legal name</label>
              <Input id="signature_name" name="signature_name" defaultValue={signatureName} required className="h-11 rounded-2xl border-[#d7e4eb] bg-[#fbfdfe] text-[#143042] shadow-none focus-visible:border-[#2f6f8f] focus-visible:ring-[#d9eef7]" />
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

            <Button type="submit" className="h-11 rounded-full bg-[#2f6f8f] px-5 text-white hover:bg-[#245a75]" disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing…</> : 'Sign waiver'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
