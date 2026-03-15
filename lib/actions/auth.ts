'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type AuthState = {
  error?: string
}

export async function loginAction(
  tenantSlug: string,
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email    = formData.get('email') as string
  const password = formData.get('password') as string
  const role     = (formData.get('role') as string) || 'walker'

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  // Sign in with Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.session) {
    return { error: 'Invalid email or password.' }
  }

  const userId = data.user.id
  const serviceClient = createServiceClient()

  // Verify user belongs to this tenant in the correct role
  if (role === 'walker') {
    const { data: walkerRow } = await serviceClient
      .from('tenant_walkers')
      .select('role, tenant_id')
      .eq('user_id', userId)
      .single()

    if (!walkerRow) {
      return { error: 'No walker account found for this business.' }
    }

    // Verify the tenant slug matches
    const { data: tenant } = await serviceClient
      .from('tenants')
      .select('id, slug')
      .eq('id', walkerRow.tenant_id)
      .eq('slug', tenantSlug)
      .single()

    if (!tenant) {
      return { error: 'This account does not belong to this business.' }
    }
  } else if (role === 'client') {
    // Look up tenant first, then check client profile
    const { data: tenant } = await serviceClient
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single()

    if (!tenant) return { error: 'Business not found.' }

    const { data: clientProfile } = await serviceClient
      .from('client_profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('tenant_id', tenant.id)
      .single()

    if (!clientProfile) {
      return { error: 'No client account found for this business.' }
    }
  }

  // Set session cookies
  const cookieStore = await cookies()
  cookieStore.set('sb-access-token', data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: data.session.expires_in,
    path: '/',
  })
  cookieStore.set('sb-refresh-token', data.session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  // Redirect to appropriate dashboard
  const destination = role === 'walker'
    ? `/${tenantSlug}/dashboard`
    : `/${tenantSlug}/portal`

  redirect(destination)
}

export async function logoutAction(tenantSlug: string) {
  const cookieStore = await cookies()
  cookieStore.delete('sb-access-token')
  cookieStore.delete('sb-refresh-token')
  redirect(`/${tenantSlug}/login`)
}
