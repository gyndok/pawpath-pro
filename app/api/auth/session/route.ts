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
      userId?: string
      expiresIn?: number
    }

    const tenantSlug = body.tenantSlug?.trim()
    const role: AuthRole = body.role === 'client' ? 'client' : 'walker'

    if (!tenantSlug || !body.accessToken || !body.refreshToken) {
      return NextResponse.json({ error: 'Missing login data.' }, { status: 400 })
    }

    let userId = body.userId?.trim()
    let expiresIn = typeof body.expiresIn === 'number' ? body.expiresIn : 3600

    if (!userId) {
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

      userId = data.user.id
      expiresIn = data.session.expires_in
    }

    const result = await finalizeTenantLogin({
      tenantSlug,
      role,
      userId,
      session: {
        access_token: body.accessToken,
        refresh_token: body.refreshToken,
        expires_in: expiresIn,
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
