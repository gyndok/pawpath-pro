import { requirePlatformAdmin, getAdminStats } from '@/lib/actions/admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PawPrint, Users, DollarSign, TrendingUp, Clock } from 'lucide-react'

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'pawpathpro.com'

function planColor(tier: string) {
  return { starter: 'bg-blue-100 text-blue-700', pro: 'bg-violet-100 text-violet-700', agency: 'bg-amber-100 text-amber-700' }[tier] ?? 'bg-gray-100 text-gray-700'
}

export default async function AdminPage() {
  await requirePlatformAdmin()
  const { tenants, totalCount, activeCount, mrr, trialCount } = await getAdminStats()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PawPrint className="h-6 w-6 text-violet-600" />
            <span className="font-bold text-lg">PawPath Pro</span>
            <Badge variant="secondary" className="ml-2">Platform Admin</Badge>
          </div>
          <span className="text-sm text-gray-500">app.{APP_DOMAIN}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Platform Overview</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                <Users className="h-4 w-4" /> Total Tenants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Active Tenants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{activeCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                <Clock className="h-4 w-4" /> In Trial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">{trialCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> MRR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-violet-600">${mrr.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tenant table */}
        <Card>
          <CardHeader>
            <CardTitle>All Tenants</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Business</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Subdomain</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Plan</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Trial Ends</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">
                        No tenants yet. Share the signup link!
                      </td>
                    </tr>
                  )}
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{tenant.business_name}</td>
                      <td className="py-3 px-4">
                        <a
                          href={`https://${tenant.slug}.${APP_DOMAIN}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-600 hover:underline font-mono text-xs"
                        >
                          {tenant.slug}.{APP_DOMAIN}
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${planColor(tenant.plan_tier)}`}>
                          {tenant.plan_tier}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {tenant.is_active ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500 text-xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {new Date(tenant.trial_ends_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {new Date(tenant.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
