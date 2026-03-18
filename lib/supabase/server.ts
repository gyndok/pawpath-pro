import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Server-side Supabase client using the service role key (bypasses RLS)
// ONLY use this in server actions / API routes that need admin access
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
}

// Server-side Supabase client using user's session (respects RLS)
export async function createServerClient() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {},
      },
    }
  )

  if (accessToken) {
    const originalGetUser = client.auth.getUser.bind(client.auth)
    client.auth.getUser = ((jwt?: string) => originalGetUser(jwt ?? accessToken)) as typeof client.auth.getUser
  }

  return client
}
