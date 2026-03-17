import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { finalizeTenantLogin, type AuthRole } from '@/lib/actions/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      tenantSlug?: string
      role?: string
      accessToken?: string
      refreshToken?: string
    }

    const tenantSlug = body.tenantSlug?.trim()
    const role: AuthRole = body.role === 'client' ? 'client' : 'walker'

    if (!tenantSlug || !body.accessToken || !body.refreshToken) {
      return NextResponse.json({ error: 'Missing login data.' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    const { data, error } = await supabase.auth.setSession({
      access_token: body.accessToken,
      refresh_token: body.refreshToken,
    })

    if (error || !data.session || !data.user) {
      return NextResponse.json({ error: 'Unable to establish session.' }, { status: 401 })
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
      return NextResponse.json({ error: result.error || 'Unable to complete login.' }, { status: 403 })
    }

    return NextResponse.json({ destination: result.destination })
  } catch {
    return NextResponse.json({ error: 'Unexpected login error.' }, { status: 500 })
  }
}
