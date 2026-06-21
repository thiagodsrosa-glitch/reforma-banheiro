import { prisma } from '@/lib/prisma'
import SimuladorClient from './SimuladorClient'

export default async function SimuladorPage() {
  const budgets = await prisma.budget.findMany({
    include: { stage: { select: { title: true } } },
    orderBy: [{ category: 'asc' }, { value: 'asc' }],
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Simulador de Projeção</h1>
          <p className="text-gray-500 text-sm mt-1">
            Monte cenários combinando orçamentos e compare o total antes de decidir
          </p>
        </div>
        <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</a>
      </div>
      <SimuladorClient budgets={budgets.map(b => ({
        id: b.id,
        supplier: b.supplier,
        description: b.description,
        value: b.value,
        category: b.category,
        status: b.status,
        stage: b.stage?.title ?? null,
        notes: b.notes,
      }))} />
    </div>
  )
}
