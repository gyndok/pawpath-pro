'use client'

import { createContext, useContext } from 'react'
import type { Tenant } from '@/types/tenant'

interface TenantContextValue {
  tenant: Tenant
  brandColor: string
  clientProfile?: {
    full_name: string
    photo_url: string | null
  } | null
  walkerProfile?: {
    photo_url: string | null
  } | null
}

export const TenantContext = createContext<TenantContextValue | null>(null)

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used inside TenantProvider')
  return ctx
}

export function TenantProvider({
  tenant,
  clientProfile,
  walkerProfile,
  children,
}: {
  tenant: Tenant
  clientProfile?: TenantContextValue['clientProfile']
  walkerProfile?: TenantContextValue['walkerProfile']
  children: React.ReactNode
}) {
  return (
    <TenantContext.Provider value={{ tenant, brandColor: tenant.branding_primary_color, clientProfile, walkerProfile }}>
      {children}
    </TenantContext.Provider>
  )
}
