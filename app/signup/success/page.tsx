import Link from 'next/link'
import { CheckCircle, PawPrint, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'pawpathpro.com'

export default async function SignupSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>
}) {
  const { slug } = await searchParams
  const loginUrl = slug ? `https://${APP_DOMAIN}/${slug}/login` : null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <PawPrint className="h-5 w-5 text-violet-600" />
          <span className="font-bold text-lg">PawPath Pro</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">You&apos;re all set!</h1>
        <p className="text-gray-600 mb-6">
          Your account has been created. Use the login link below to set up your business.
        </p>

        {slug && (
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Your login URL:</p>
            <p className="font-mono font-bold text-violet-700 break-all">
              {loginUrl}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {slug && (
            <Link href={`/${slug}/login`}>
              <Button className="w-full bg-violet-600 hover:bg-violet-700">
                Go to your dashboard <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
          <Link href="/">
            <Button variant="outline" className="w-full">Back to homepage</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
