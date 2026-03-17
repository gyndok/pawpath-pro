'use client'

import { useState, useTransition } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function GoogleSignInButton({
  tenantSlug,
  role,
}: {
  tenantSlug: string
  role: 'walker' | 'client'
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      setError(null)

      const redirectTo = `${window.location.origin}/auth/callback?tenant=${encodeURIComponent(tenantSlug)}&role=${role}`
      const supabase = createBrowserClient()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.url) {
        window.location.assign(data.url)
      }
    })
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="w-full" onClick={handleClick} disabled={isPending}>
        {isPending ? 'Redirecting…' : 'Continue with Google'}
      </Button>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}
