'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PawPrint, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { signupAction, checkSlugAvailability } from '@/lib/actions/signup'
import type { SignupState } from '@/lib/actions/signup'

const PLANS = [
  { id: 'starter', name: 'Starter', price: '$29/mo', desc: '1 walker, 30 clients' },
  { id: 'pro',     name: 'Pro',     price: '$59/mo', desc: 'Unlimited clients + custom domain', popular: true },
  { id: 'agency',  name: 'Agency',  price: '$99/mo', desc: 'Up to 5 walkers' },
]

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'pawpathpro.com'

export default function SignupPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<SignupState, FormData>(signupAction, {})
  const [selectedPlan, setSelectedPlan] = useState<string>('pro')
  const [slug, setSlug] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [slugError, setSlugError] = useState('')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Redirect on success
  useEffect(() => {
    if (state.success && state.tenantSlug) {
      router.push(`/signup/success?slug=${state.tenantSlug}`)
    }
  }, [state, router])

  const handleSlugChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlug(normalized)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!normalized) { setSlugStatus('idle'); return }

    setSlugStatus('checking')
    debounceRef.current = setTimeout(async () => {
      const result = await checkSlugAvailability(normalized)
      if (result.error) {
        setSlugStatus('invalid')
        setSlugError(result.error)
      } else if (result.available) {
        setSlugStatus('available')
        setSlugError('')
      } else {
        setSlugStatus('taken')
        setSlugError('That subdomain is already taken.')
      }
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <PawPrint className="h-7 w-7 text-violet-600" />
        <span className="text-xl font-bold">PawPath Pro</span>
      </Link>

      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Start your free trial</CardTitle>
            <CardDescription>14 days free · No credit card required</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form action={formAction} className="space-y-6">
              {/* Plan selection */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Choose your plan</Label>
                <div className="grid grid-cols-3 gap-3">
                  {PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative rounded-lg border-2 p-3 text-left transition-all ${
                        selectedPlan === plan.id
                          ? 'border-violet-600 bg-violet-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {plan.popular && (
                        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs bg-violet-600">Popular</Badge>
                      )}
                      <div className="font-semibold text-sm">{plan.name}</div>
                      <div className="text-violet-600 font-bold text-sm">{plan.price}</div>
                      <div className="text-xs text-gray-500 mt-1">{plan.desc}</div>
                    </button>
                  ))}
                </div>
                <input type="hidden" name="plan" value={selectedPlan} />
              </div>

              {/* Business name */}
              <div className="space-y-1.5">
                <Label htmlFor="business_name">Business name</Label>
                <Input
                  id="business_name"
                  name="business_name"
                  placeholder="Sarah's Dog Walking"
                  required
                />
              </div>

              {/* Subdomain */}
              <div className="space-y-1.5">
                <Label htmlFor="slug">Your subdomain</Label>
                <div className="flex items-center">
                  <Input
                    id="slug"
                    name="slug"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="sarahswalks"
                    className="rounded-r-none"
                    required
                  />
                  <span className="flex items-center h-9 border border-l-0 rounded-r-md px-3 bg-gray-50 text-sm text-gray-500 whitespace-nowrap">
                    .{APP_DOMAIN}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs h-4">
                  {slugStatus === 'checking' && (
                    <><Loader2 className="h-3 w-3 animate-spin text-gray-400" /> <span className="text-gray-500">Checking availability…</span></>
                  )}
                  {slugStatus === 'available' && (
                    <><CheckCircle className="h-3 w-3 text-green-500" /> <span className="text-green-600">{slug}.{APP_DOMAIN} is available</span></>
                  )}
                  {(slugStatus === 'taken' || slugStatus === 'invalid') && (
                    <><XCircle className="h-3 w-3 text-red-500" /> <span className="text-red-600">{slugError}</span></>
                  )}
                </div>
              </div>

              {/* Email + password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" placeholder="8+ characters" required minLength={8} />
                </div>
              </div>

              {/* Error */}
              {state.error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {state.error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700"
                disabled={isPending || slugStatus === 'taken' || slugStatus === 'invalid'}
              >
                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating your account…</> : 'Start Free Trial'}
              </Button>

              <p className="text-center text-xs text-gray-500">
                By signing up you agree to our Terms of Service and Privacy Policy.
                <br />Already have an account?{' '}
                <Link href="/" className="text-violet-600 hover:underline">Sign in</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
