import { PortalHeader } from '@/components/portal/header'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader />
      <main>{children}</main>
    </div>
  )
}
