import { prisma } from '@/lib/prisma'
import RelatorioBuilder from '@/components/RelatorioBuilder'

export default async function RelatorioPage() {
  const [budgets, expenses] = await Promise.all([
    prisma.budget.findMany({ select: { category: true } }),
    prisma.expense.findMany({ select: { category: true } }),
  ])

  const categorias = Array.from(
    new Set([...budgets.map((b) => b.category), ...expenses.map((e) => e.category)])
  ).sort()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Relatórios</h1>
        <p className="text-gray-500 text-sm mt-1">
          Selecione as seções, aplique filtros e baixe em Excel ou imprima.
        </p>
      </div>
      <RelatorioBuilder categorias={categorias} />
    </div>
  )
}
