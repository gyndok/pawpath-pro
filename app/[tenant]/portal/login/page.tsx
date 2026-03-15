'use client'

import { useActionState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { loginAction } from '@/lib/actions/auth'
import type { AuthState } from '@/lib/actions/auth'
import { useTenant } from '@/lib/context/tenant-context'

export default function ClientLoginPage() {
  const params = useParams<{ tenant: string }>()
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
