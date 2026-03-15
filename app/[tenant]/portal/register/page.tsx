'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useTenant } from '@/lib/context/tenant-context'

export default function ClientRegisterPage() {
  const { tenant } = useTenant()

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-sm text-center">
        <Card>
          <CardHeader>
            <CardTitle>Create a Client Account</CardTitle>
            <CardDescription>Join {tenant.business_name} as a client</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-8 space-y-3">
              <p className="text-gray-500 text-sm">
                Client self-registration will be available in Phase 3.
                Ask your walker to set up your account.
              </p>
              <Badge variant="secondary">Coming in Phase 3</Badge>
            </div>
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="login" className="text-violet-600 hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
