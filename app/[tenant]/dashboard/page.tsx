import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Dog, DollarSign, MessageSquare, PawPrint, Clock } from 'lucide-react'

// Placeholder stat cards for day-at-a-glance
const PLACEHOLDER_STATS = [
  { label: "Today's Walks", value: '—', sub: 'No walks scheduled yet', icon: PawPrint, color: 'text-violet-600' },
  { label: 'Upcoming',      value: '—', sub: 'This week',               icon: Calendar,     color: 'text-blue-600'   },
  { label: 'Unread Messages', value: '—', sub: 'From clients',          icon: MessageSquare, color: 'text-green-600'  },
  { label: 'Unpaid Invoices', value: '—', sub: 'Pending payment',       icon: DollarSign,   color: 'text-amber-600'  },
]

export default async function DashboardPage() {

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{today}</p>
      </div>

      {/* Day-at-a-glance stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {PLACEHOLDER_STATS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-400">{stat.value}</div>
              <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's walks placeholder */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-violet-600" />
            Today&apos;s Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <PawPrint className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No walks scheduled today</p>
            <p className="text-sm text-gray-400 mt-1">
              Walks will appear here once clients start booking.
            </p>
            <div className="mt-4">
              <Badge variant="secondary">Phase 1 Scaffold — full schedule in Phase 3</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending approvals placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dog className="h-5 w-5 text-amber-500" />
            Walk Requests Pending Approval
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-gray-400 text-sm">No pending requests</p>
            <div className="mt-3">
              <Badge variant="secondary">Full booking system ships in Phase 3</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
