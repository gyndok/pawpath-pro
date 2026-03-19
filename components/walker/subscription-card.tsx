'use client'

import { useState } from 'react'
import { Loader2, CreditCard, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const PLAN_DETAILS = {
  starter: { name: 'Starter', price: '$29/mo', desc: '1 walker, up to 30 clients' },
  pro: { name: 'Pro', price: '$59/mo', desc: 'Unlimited clients, custom domain, CSV export' },
  agency: { name: 'Agency', price: '$99/mo', desc: 'Up to 5 walkers, all Pro features' },
} as const

type PlanTier = keyof typeof PLAN_DETAILS

export function SubscriptionCard({
  tenantId,
  planTier,
  stripeCustomerId,
  stripeSubscriptionId,
  trialEndsAt,
  isActive,
  checkoutStatus,
}: {
  tenantId: string
  planTier: PlanTier
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  trialEndsAt: string
  isActive: boolean
  checkoutStatus?: string
}) {
  const [loading, setLoading] = useState<string | null>(null)

  const trialEnd = new Date(trialEndsAt)
  const now = new Date()
  const trialActive = trialEnd > now
  const daysLeft = trialActive ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
  const plan = PLAN_DETAILS[planTier] || PLAN_DETAILS.starter

  const hasSubscription = Boolean(stripeSubscriptionId)

  async function handleCheckout(tier: PlanTier) {
    setLoading(tier)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, planTier: tier }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to start checkout')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading('portal')
    try {
      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to open billing portal')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card className="kinetic-card rounded-[1.8rem] border-stone-200 shadow-none">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 font-[var(--font-display)] text-2xl tracking-tight">
              <CreditCard className="h-5 w-5 text-[#003fb1]" />
              Subscription & Billing
            </CardTitle>
            <CardDescription className="mt-2 text-sm leading-6 text-stone-600">Manage your PawPath Pro plan and payment method.</CardDescription>
          </div>
          <Badge
            className={
              !isActive
                ? 'bg-red-100 text-red-700'
                : trialActive
                  ? 'bg-[#dbe1ff] text-[#003fb1]'
                  : 'bg-[#d7f6f1] text-[#00544c]'
            }
          >
            {!isActive ? 'Inactive' : trialActive ? `Trial (${daysLeft}d left)` : 'Active'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {checkoutStatus === 'success' && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            Subscription activated! Your plan is now active.
          </div>
        )}
        {checkoutStatus === 'cancelled' && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            Checkout was cancelled. You can try again anytime.
          </div>
        )}

        {/* Current plan summary */}
        <div className="kinetic-card-soft rounded-[1.35rem] border border-[rgba(115,118,134,0.15)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-stone-900">{plan.name} Plan</p>
              <p className="mt-1 text-sm text-stone-500">{plan.desc}</p>
            </div>
            <p className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-[#003fb1]">{plan.price}</p>
          </div>
        </div>

        {/* Actions */}
        {hasSubscription && stripeCustomerId ? (
          // Active subscription — show portal button
          <Button onClick={handlePortal} variant="outline" className="w-full" disabled={loading === 'portal'}>
            {loading === 'portal' ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening portal…</>
            ) : (
              <><ExternalLink className="mr-2 h-4 w-4" /> Manage subscription & payment method</>
            )}
          </Button>
        ) : (
          // No subscription yet — show plan selection + checkout
          <div className="space-y-3">
            <p className="text-sm text-stone-600">
              {trialActive
                ? 'Add a payment method now to ensure uninterrupted service when your trial ends.'
                : 'Your trial has expired. Subscribe to reactivate your account.'}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {(Object.entries(PLAN_DETAILS) as [PlanTier, typeof PLAN_DETAILS[PlanTier]][]).map(([tier, details]) => (
                <Button
                  key={tier}
                  onClick={() => handleCheckout(tier)}
                  disabled={loading !== null}
                  variant={tier === planTier ? 'default' : 'outline'}
                  className={tier === planTier ? 'bg-[#003fb1] text-white hover:bg-[#1a56db]' : 'border-stone-300 bg-white'}
                >
                  {loading === tier ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {details.name} — {details.price}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
