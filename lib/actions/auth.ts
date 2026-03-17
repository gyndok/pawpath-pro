'use server'

import { DEMO_ROLE_COOKIE, isDemoTenantSlug } from '@/lib/demo'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type AuthState = {
  error?: string
}

export type AuthRole = 'walker' | 'client'

function normalizeRole(role: string | null): AuthRole {
  return role === 'client' ? 'client' : 'walker'
}

async function validateTenantMembership(
  tenantSlug: string,
  role: AuthRole,
  userId: string
): Promise<{ error?: string }> {
  const serviceClient = createServiceClient()

  if (role === 'walker') {
    const { data: walkerRow } = await serviceClient
      .from('tenant_walkers')
      .select('role, tenant_id')
      .eq('user_id', userId)
      .single()

    if (!walkerRow) {
      return { error: 'No walker account found for this business.' }
    }

    const { data: tenant } = await serviceClient
      .from('tenants')
      .select('id, slug')
      .eq('id', walkerRow.tenant_id)
      .eq('slug', tenantSlug)
      .single()

    if (!tenant) {
      return { error: 'This account does not belong to this business.' }
    }
  } else {
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

  return {}
}

async function setSessionCookies(session: {
  access_token: string
  refresh_token: string
  expires_in: number
}) {
  const cookieStore = await cookies()
  cookieStore.set('sb-access-token', session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: session.expires_in,
    path: '/',
  })
  cookieStore.set('sb-refresh-token', session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
}

function getDestination(tenantSlug: string, role: AuthRole) {
  return role === 'walker'
    ? `/${tenantSlug}/dashboard`
    : `/${tenantSlug}/portal`
}

export async function finalizeTenantLogin(params: {
  tenantSlug: string
  role: AuthRole
  userId: string
  session: {
    access_token: string
    refresh_token: string
    expires_in: number
  }
}): Promise<{ error?: string; destination?: string }> {
  const membership = await validateTenantMembership(params.tenantSlug, params.role, params.userId)
  if (membership.error) return membership

  await setSessionCookies(params.session)

  return {
    destination: getDestination(params.tenantSlug, params.role),
  }
}

export async function loginAction(
  tenantSlug: string,
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (isDemoTenantSlug(tenantSlug)) {
    const role = normalizeRole((formData.get('role') as string) || 'walker')
    const cookieStore = await cookies()
    cookieStore.set(DEMO_ROLE_COOKIE, role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    })

    redirect(role === 'walker' ? `/${tenantSlug}/dashboard` : `/${tenantSlug}/portal`)
  }

  const email    = formData.get('email') as string
  const password = formData.get('password') as string
  const role     = normalizeRole((formData.get('role') as string) || 'walker')

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

  const result = await finalizeTenantLogin({
    tenantSlug,
    role,
    userId: data.user.id,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
    },
  })

  if (result.error || !result.destination) {
    return { error: result.error || 'Unable to complete login.' }
  }

  redirect(result.destination)
}

export async function startDemoSessionAction(tenantSlug: string, formData: FormData) {
  if (!isDemoTenantSlug(tenantSlug)) {
    redirect(`/${tenantSlug}`)
  }

  const role = ((formData.get('role') as string) || 'client') === 'walker' ? 'walker' : 'client'
  const cookieStore = await cookies()
  cookieStore.set(DEMO_ROLE_COOKIE, role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })

  redirect(role === 'walker' ? `/${tenantSlug}/dashboard` : `/${tenantSlug}/portal`)
}

export async function logoutAction(tenantSlug: string) {
  const cookieStore = await cookies()
  cookieStore.delete('sb-access-token')
  cookieStore.delete('sb-refresh-token')
  cookieStore.delete(DEMO_ROLE_COOKIE)
  redirect(`/${tenantSlug}/login`)
}
