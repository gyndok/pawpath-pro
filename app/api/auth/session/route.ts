import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prepareTenantLogin, type AuthRole } from '@/lib/actions/auth'

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const formData = await request.formData()
      const tenantSlug = String(formData.get('tenantSlug') || '').trim()
      const role: AuthRole = String(formData.get('role') || '') === 'client' ? 'client' : 'walker'
      const accessToken = String(formData.get('accessToken') || '').trim()
      const refreshToken = String(formData.get('refreshToken') || '').trim()
      let userId = String(formData.get('userId') || '').trim()
      let expiresIn = Number(String(formData.get('expiresIn') || '3600'))

      if (!tenantSlug || !accessToken || !refreshToken) {
        return NextResponse.redirect(new URL('/?error=missing_login_data', request.url), { status: 303 })
      }

      if (!userId) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } }
        )

        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error || !data.session || !data.user) {
          return NextResponse.redirect(new URL('/?error=unable_to_establish_session', request.url), { status: 303 })
        }

        userId = data.user.id
        expiresIn = data.session.expires_in
      }

      const result = await prepareTenantLogin({
        tenantSlug,
        role,
        userId,
      })

      const destination = result.destination || `/${tenantSlug}/${role === 'client' ? 'portal/login' : 'login'}`
      const url = new URL(result.error ? `/${tenantSlug}/${role === 'client' ? 'portal/login' : 'login'}` : destination, request.url)

      if (result.error) {
        url.searchParams.set('error', result.error)
      }

      const response = NextResponse.redirect(url, { status: 303 })
      response.cookies.set('sb-access-token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expiresIn,
        path: '/',
      })
      response.cookies.set('sb-refresh-token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })

      return response
    }

    const body = await request.json() as {
          tenantSlug?: string
          role?: string
          accessToken?: string
          refreshToken?: string
          userId?: string
          expiresIn?: number
          redirectMode?: boolean
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

    const result = await prepareTenantLogin({
      tenantSlug,
      role,
      userId,
    })

    if (result.error || !result.destination) {
      return NextResponse.json({ error: result.error || 'Unable to complete login.' }, { status: 403 })
    }

    const response = NextResponse.json({ destination: result.destination })
    response.cookies.set('sb-access-token', body.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn,
      path: '/',
    })
    response.cookies.set('sb-refresh-token', body.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Unexpected login error.' }, { status: 500 })
  }
}
