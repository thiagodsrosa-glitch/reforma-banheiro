import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Countdown from '@/components/Countdown'
import Link from 'next/link'

export default async function EquipePage() {
  const session = await getSession()
  const [stages, budgets] = await Promise.all([
    prisma.stage.findMany({ orderBy: { order: 'asc' } }),
    prisma.budget.findMany({ select: { category: true, value: true, status: true } }),
  ])

  const completedStages = stages.filter((s) => s.status === 'COMPLETED').length
  const inProgress = stages.find((s) => s.status === 'IN_PROGRESS')
  const overallProgress =
    stages.length > 0
      ? Math.round(stages.reduce((sum, s) => sum + s.progress, 0) / stages.length)
      : 0

  // Agrupa orçamentos por categoria (sem mostrar total geral)
  const byCategory = budgets.reduce((acc, b) => {
    if (!acc[b.category]) acc[b.category] = { count: 0, values: [] as number[], approved: 0 }
    acc[b.category].count++
    acc[b.category].values.push(b.value)
    if (b.status === 'APPROVED') acc[b.category].approved++
    return acc
  }, {} as Record<string, { count: number; values: number[]; approved: number }>)

  const categories = Object.entries(byCategory).sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {session?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">Reforma do Banheiro Masculino — Igreja Matriz</p>
      </div>

      <Countdown />

      {/* Cards de progresso */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Progresso Geral</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">{overallProgress}%</p>
          <div className="h-2 bg-blue-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${overallProgress}%` }} />
          </div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-5">
          <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Etapas Concluídas</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{completedStages}/{stages.length}</p>
          <p className="text-xs text-green-600 mt-1">etapas concluídas</p>
        </div>
      </div>

      {/* Orçamentos por categoria */}
      {categories.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Orçamentos por Categoria</h2>
              <p className="text-xs text-gray-500 mt-0.5">Mínimo de 3 orçamentos por categoria — justificativa obrigatória se impossível</p>
            </div>
            <Link href="/equipe/orcamentos" className="text-sm text-blue-600 hover:underline font-medium">
              + Novo →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {categories.map(([cat, data]) => {
              const abaixo = data.count < 3
              return (
                <Link
                  key={cat}
                  href="/equipe/orcamentos"
                  className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 text-sm">{cat}</p>
                      {abaixo && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                          ⚠️ {data.count}/3 orçamentos
                        </span>
                      )}
                      {!abaixo && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          ✓ {data.count} orçamentos
                        </span>
                      )}
                      {data.approved > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {data.approved} aprovado(s)
                        </span>
                      )}
                    </div>
                    {abaixo && (
                      <p className="text-xs text-orange-600 mt-0.5">Adicione mais {3 - data.count} orçamento(s) ou justifique</p>
                    )}
                  </div>
                  {/* Valores individuais — sem total */}
                  <div className="flex flex-wrap gap-1 justify-end max-w-[180px]">
                    {data.values.map((v, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)}
                      </span>
                    ))}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {categories.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-sm">Nenhum orçamento cadastrado ainda.</p>
          <Link href="/equipe/orcamentos" className="mt-2 inline-block text-blue-600 text-sm hover:underline">
            Cadastrar primeiro orçamento →
          </Link>
        </div>
      )}

      {/* Etapa em andamento */}
      {inProgress && (
        <div className="bg-white rounded-xl border border-blue-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <p className="text-sm font-semibold text-blue-700">ETAPA EM ANDAMENTO</p>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{inProgress.title}</h2>
          {inProgress.description && (
            <p className="text-gray-500 text-sm mt-1">{inProgress.description}</p>
          )}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${inProgress.progress}%` }} />
            </div>
            <span className="text-sm font-semibold text-gray-700">{inProgress.progress}%</span>
          </div>
        </div>
      )}

      {/* Cronograma */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Cronograma Completo</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {stages.map((stage) => {
            const statusMap: Record<string, { label: string; cls: string }> = {
              PENDING: { label: 'Pendente', cls: 'bg-gray-100 text-gray-600' },
              IN_PROGRESS: { label: 'Em andamento', cls: 'bg-blue-100 text-blue-700' },
              COMPLETED: { label: 'Concluída', cls: 'bg-green-100 text-green-700' },
            }
            const s = statusMap[stage.status]
            return (
              <div key={stage.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-7 h-7 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                  {stage.order}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{stage.title}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${s.cls}`}>{s.label}</span>
                <div className="w-28 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stage.progress}%` }} />
                  </div>
                  <span className="text-xs text-gray-400">{stage.progress}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
