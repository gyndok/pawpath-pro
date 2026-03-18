'use client'

import { useActionState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { DemoBanner } from '@/components/demo/demo-banner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { loginAction, startDemoSessionAction } from '@/lib/actions/auth'
import type { AuthState } from '@/lib/actions/auth'
import { useTenant } from '@/lib/context/tenant-context'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'

export default function ClientLoginPage() {
  const params = useParams<{ tenant: string }>()
  const searchParams = useSearchParams()
  const { tenant } = useTenant()

  // Bind tenant slug and role=client to the action
  const clientLogin = async (_prevState: AuthState, formData: FormData) => {
    formData.set('role', 'client')
    return loginAction(params.tenant, _prevState, formData)
  }

  const [state, formAction, isPending] = useActionState<AuthState, FormData>(clientLogin, {})

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Client Login</CardTitle>
            <CardDescription>Sign in to {tenant.business_name}</CardDescription>
          </CardHeader>
          <CardContent>
            {params.tenant === 'demo' && (
              <div className="mb-4">
                <DemoBanner tenantSlug={params.tenant} compact />
              </div>
            )}

            {params.tenant === 'demo' && (
              <form action={startDemoSessionAction.bind(null, params.tenant)} className="mb-4">
                <input type="hidden" name="role" value="client" />
                <Button type="submit" variant="outline" className="w-full border-[#c66a2b] text-[#b45a21]">
                  Enter Client Demo
                </Button>
              </form>
            )}

            {searchParams.get('registered') === '1' && (
              <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                Your account is ready. Sign in to view your portal.
              </div>
            )}
            {searchParams.get('error') && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {searchParams.get('error')}
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="Your password" required />
              </div>

              {state.error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {state.error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</> : 'Sign In'}
              </Button>
            </form>

            {params.tenant !== 'demo' && (
              <>
                <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-wide text-stone-400">
                  <div className="h-px flex-1 bg-stone-200" />
                  <span>or</span>
                  <div className="h-px flex-1 bg-stone-200" />
                </div>
                <GoogleSignInButton tenantSlug={params.tenant} role="client" />
              </>
            )}

            <p className="text-center text-sm text-gray-500 mt-4">
              New client?{' '}
              <Link href={`/${params.tenant}/portal/register`} className="text-violet-600 hover:underline">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
