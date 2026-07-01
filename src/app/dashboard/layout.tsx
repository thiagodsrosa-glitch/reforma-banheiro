import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'ADMIN' && session.role !== 'OBSERVADOR') redirect('/equipe')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={session.name} role={session.role === 'OBSERVADOR' ? 'OBSERVADOR' : 'ADMIN'} />
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
        {/* pt-14 compensa o header fixo do mobile */}
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 min-h-full">{children}</div>
      </main>
    </div>
  )
}
