'use client'

import { useActionState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PawPrint, Loader2 } from 'lucide-react'
import { DemoBanner } from '@/components/demo/demo-banner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { loginAction, startDemoSessionAction } from '@/lib/actions/auth'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import type { AuthState } from '@/lib/actions/auth'

export default function LoginPage() {
  const params = useParams<{ tenant: string }>()
  const tenantSlug = params.tenant

  // Bind tenantSlug as first argument; useActionState supplies (prevState, formData)
  const boundLoginAction = loginAction.bind(null, tenantSlug)
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    boundLoginAction,
    {}
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <PawPrint className="h-7 w-7 text-violet-600" />
          <span className="font-bold text-xl">PawPath Pro</span>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Walker Login</CardTitle>
            <CardDescription>Sign in to your walker dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {tenantSlug === 'demo' && (
              <div className="mb-4">
                <DemoBanner tenantSlug={tenantSlug} compact />
              </div>
            )}

            {tenantSlug === 'demo' && (
              <form action={startDemoSessionAction.bind(null, tenantSlug)} className="mb-4">
                <input type="hidden" name="role" value="walker" />
                <Button type="submit" variant="outline" className="w-full border-[#c66a2b] text-[#b45a21]">
                  Enter Walker Demo
                </Button>
              </form>
            )}

            <form action={formAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="walker@example.com" required autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="Your password" required autoComplete="current-password" />
              </div>

              {state.error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {state.error}
                </div>
              )}

              <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={isPending}>
                {isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</>
                ) : 'Sign In'}
              </Button>
            </form>

            {tenantSlug !== 'demo' && (
              <>
                <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-wide text-stone-400">
                  <div className="h-px flex-1 bg-stone-200" />
                  <span>or</span>
                  <div className="h-px flex-1 bg-stone-200" />
                </div>
                <GoogleSignInButton tenantSlug={tenantSlug} role="walker" />
              </>
            )}

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Are you a client?{' '}
                <Link href={`/${tenantSlug}/portal`} className="text-violet-600 hover:underline">
                  Client portal →
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
