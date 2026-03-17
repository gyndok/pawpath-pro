import { AuthCallbackClient } from '@/components/auth/auth-callback-client'

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{
    tenant?: string
    role?: string
    code?: string
    error?: string
    error_description?: string
  }>
}) {
  const params = await searchParams

  return (
    <AuthCallbackClient
      tenantSlug={params.tenant ?? null}
      role={params.role === 'client' ? 'client' : 'walker'}
      code={params.code ?? null}
      providerError={params.error_description ?? params.error ?? null}
    />
  )
}
