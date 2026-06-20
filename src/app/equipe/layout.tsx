import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

export default async function EquipeLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={session.name} role={session.role} />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">{children}</div>
      </main>
    </div>
  )
}
