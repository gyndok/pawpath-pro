'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'

export function AuthCallbackClient({
  tenantSlug,
  role,
  code,
  providerError,
}: {
  tenantSlug: string | null
  role: 'walker' | 'client'
  code: string | null
  providerError: string | null
}) {
  const [error, setError] = useState<string | null>(() => {
    if (providerError) return providerError
    const hasHashToken = typeof window !== 'undefined' && window.location.hash.includes('access_token=')
    if (!tenantSlug || (!code && !hasHashToken)) return 'Missing login context. Please start sign-in again.'
    return null
  })

  useEffect(() => {
    if (error || !tenantSlug) return

    let isActive = true

    const run = async () => {
      const supabase = createBrowserClient()
      let accessToken: string | null = null
      let refreshToken: string | null = null
      let userId: string | null = null
      let expiresIn: number | null = null

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!isActive) return

        if (error || !data.session || !data.user) {
          setError(error?.message || 'Unable to complete Google sign-in.')
          return
        }

        accessToken = data.session.access_token
        refreshToken = data.session.refresh_token
        userId = data.user.id
        expiresIn = data.session.expires_in
      } else {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
        accessToken = hashParams.get('access_token')
        refreshToken = hashParams.get('refresh_token')
        expiresIn = Number(hashParams.get('expires_in') || '3600')

        if (!accessToken || !refreshToken) {
          setError('Unable to complete Google sign-in.')
          return
        }

        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (!isActive) return

        if (error || !data.session || !data.user) {
          setError(error?.message || 'Unable to establish session.')
          return
        }

        userId = data.user.id
      }

      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }

      const form = document.createElement('form')
      form.method = 'POST'
      form.action = '/api/auth/session'
      form.style.display = 'none'

      const payload = {
        tenantSlug,
        role,
        accessToken,
        refreshToken,
        userId,
        expiresIn: String(expiresIn ?? 3600),
      }

      for (const [key, value] of Object.entries(payload)) {
        if (!value) continue
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      }

      document.body.appendChild(form)
      form.submit()
    }

    void run()

    return () => {
      isActive = false
    }
  }, [code, error, role, tenantSlug])

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-stone-900">Signing you in</h1>
        {error ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-red-700">{error}</p>
            <Link href="/" className="text-sm font-medium text-violet-700 hover:underline">
              Return to homepage
            </Link>
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-600">
            Finishing your Google sign-in and routing you to the correct dashboard.
          </p>
        )}
      </div>
    </div>
  )
}
