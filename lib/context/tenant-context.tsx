'use client'

import { createContext, useContext } from 'react'
import type { Tenant } from '@/types/tenant'

interface TenantContextValue {
  tenant: Tenant
  brandColor: string
}

export const TenantContext = createContext<TenantContextValue | null>(null)

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used inside TenantProvider')
  return ctx
}

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: Tenant
  children: React.ReactNode
}) {
  return (
    <TenantContext.Provider value={{ tenant, brandColor: tenant.branding_primary_color }}>
      {children}
    </TenantContext.Provider>
  )
}
