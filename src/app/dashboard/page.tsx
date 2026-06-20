import { prisma } from '@/lib/prisma'
import DashboardCharts from '@/components/DashboardCharts'

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default async function DashboardPage() {
  const [stages, budgets, expenses, messages, users] = await Promise.all([
    prisma.stage.findMany({ orderBy: { order: 'asc' } }),
    prisma.budget.findMany(),
    prisma.expense.findMany(),
    prisma.whatsAppMessage.count({ where: { processed: false } }),
    prisma.user.count(),
  ])

  const totalSpent = expenses.reduce((sum, e) => sum + e.value, 0)
  const totalApprovedBudget = budgets
    .filter((b) => b.status === 'APPROVED')
    .reduce((sum, b) => sum + b.value, 0)
  const pendingBudgets = budgets.filter((b) => b.status === 'PENDING').length
  const completedStages = stages.filter((s) => s.status === 'COMPLETED').length
  const overallProgress =
    stages.length > 0
      ? Math.round(stages.reduce((sum, s) => sum + s.progress, 0) / stages.length)
      : 0

  const expensesByCategory = expenses.reduce(
    (acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.value
      return acc
    },
    {} as Record<string, number>
  )

  const categoryData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
  }))

  const stagesData = stages.map((s) => ({
    name: s.title.length > 18 ? s.title.slice(0, 18) + '…' : s.title,
    progresso: s.progress,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral da reforma</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Progresso Geral"
          value={`${overallProgress}%`}
          sub={`${completedStages}/${stages.length} etapas concluídas`}
          color="blue"
        />
        <StatCard
          label="Total Gasto"
          value={fmt(totalSpent)}
          sub={`Orçado aprovado: ${fmt(totalApprovedBudget)}`}
          color="green"
        />
        <StatCard
          label="Orçamentos Pendentes"
          value={String(pendingBudgets)}
          sub="Aguardando aprovação"
          color="yellow"
        />
        <StatCard
          label="Msgs WhatsApp"
          value={String(messages)}
          sub={`${users} usuários ativos`}
          color="purple"
        />
      </div>

      {/* Charts */}
      <DashboardCharts categoryData={categoryData} stagesData={stagesData} />

      {/* Stages Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Etapas da Reforma</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {stages.map((stage) => (
            <div key={stage.id} className="px-6 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{stage.title}</p>
                {stage.description && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{stage.description}</p>
                )}
              </div>
              <StatusBadge status={stage.status} />
              <div className="w-32">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${stage.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{stage.progress}%</span>
                </div>
              </div>
            </div>
          ))}
          {stages.length === 0 && (
            <p className="px-6 py-8 text-center text-gray-400 text-sm">
              Nenhuma etapa cadastrada ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub: string
  color: 'blue' | 'green' | 'yellow' | 'purple'
}) {
  const colors = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    yellow: 'bg-yellow-50 border-yellow-100',
    purple: 'bg-purple-50 border-purple-100',
  }
  const textColors = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    yellow: 'text-yellow-700',
    purple: 'text-purple-700',
  }
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${textColors[color]}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pendente', className: 'bg-gray-100 text-gray-600' },
    IN_PROGRESS: { label: 'Em andamento', className: 'bg-blue-100 text-blue-700' },
    COMPLETED: { label: 'Concluída', className: 'bg-green-100 text-green-700' },
  }
  const { label, className } = map[status] ?? map.PENDING
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${className}`}>
      {label}
    </span>
  )
}
