'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Loader2, Send, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { submitInquiryAction, type InquiryState } from '@/lib/actions/inquiry'

export function InquiryForm({
  tenantId,
  businessName,
}: {
  tenantId: string
  businessName: string
}) {
  const [state, formAction, isPending] = useActionState<InquiryState, FormData>(
    submitInquiryAction.bind(null, tenantId),
    {}
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state.success])

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" name="name" placeholder="Jordan Lee" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="jordandogs@example.com" required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" placeholder="(555) 555-1212" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pet_info">Tell us about your dog</Label>
          <Input id="pet_info" name="pet_info" placeholder="Age, breed, energy level, routine" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">What kind of help do you need?</Label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Weekday lunch walks, occasional weekend drop-ins, meds, meet-and-greet availability..."
          className="flex min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>

      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          {businessName} received your inquiry. Expect a follow-up soon.
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        Send inquiry
      </Button>
    </form>
  )
}
