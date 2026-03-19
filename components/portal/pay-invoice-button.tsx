'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PayInvoiceButton({
  invoiceId,
  tenantSlug,
  clientProfileId,
  amount,
}: {
  invoiceId: string
  tenantSlug: string
  clientProfileId: string
  amount: number
}) {
  const [loading, setLoading] = useState(false)

  async function handlePay() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/pay-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, tenantSlug, clientProfileId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to start payment')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePay}
      disabled={loading}
      size="sm"
      className="rounded-full bg-[#2f6f8f] px-4 text-white shadow-[0_14px_28px_rgba(47,111,143,0.2)] hover:bg-[#245a75]"
    >
      {loading ? (
        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</>
      ) : (
        `Pay $${amount.toFixed(2)}`
      )}
    </Button>
  )
}
