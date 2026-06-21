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
        {session.role === 'ADMIN' && (
          <div className="lg:hidden fixed top-14 left-0 right-0 z-30 bg-purple-600 text-white text-xs text-center py-1.5 flex items-center justify-center gap-2">
            <span>Modo visualização equipe</span>
            <a href="/dashboard" className="underline font-semibold">← Voltar ao painel admin</a>
          </div>
        )}
        {session.role === 'ADMIN' && (
          <div className="hidden lg:flex items-center gap-2 bg-purple-50 border-b border-purple-100 px-8 py-2 text-sm text-purple-700">
            <span>👁 Visualizando como Equipe</span>
            <a href="/dashboard" className="ml-auto font-semibold hover:underline">← Voltar ao painel admin</a>
          </div>
        )}
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">{children}</div>
      </main>
    </div>
  )
}
