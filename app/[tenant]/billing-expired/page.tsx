'use client'

import Link from 'next/link'
import { AlertTriangle, PawPrint } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTenant } from '@/lib/context/tenant-context'

export default function BillingExpiredPage() {
  const { tenant } = useTenant()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-amber-100 p-4">
            <AlertTriangle className="h-10 w-10 text-amber-600" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <PawPrint className="h-5 w-5 text-violet-600" />
          <span className="font-bold">{tenant.business_name}</span>
        </div>
        <h1 className="text-xl font-bold mb-2">Subscription Expired</h1>
        <p className="text-gray-600 mb-6 text-sm">
          The subscription for this business has expired. If you are the business owner,
          please log in to reactivate your plan. If you are a client, please contact your walker directly.
        </p>
        <div className="space-y-3">
          <Link href={`/${tenant.slug}/login`}>
            <Button className="w-full">Walker Login — Reactivate</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
