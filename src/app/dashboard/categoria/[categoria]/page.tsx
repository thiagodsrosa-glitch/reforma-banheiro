import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CategoriaClient from './CategoriaClient'

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default async function CategoriaPage({ params }: { params: Promise<{ categoria: string }> }) {
  const { categoria } = await params
  const cat = decodeURIComponent(categoria)

  const [budgets, expenses] = await Promise.all([
    prisma.budget.findMany({
      where: { category: cat },
      include: { user: { select: { name: true } }, stage: { select: { title: true } } },
      orderBy: { value: 'asc' },
    }),
    prisma.expense.findMany({
      where: { category: cat },
      include: { user: { select: { name: true } } },
      orderBy: { date: 'desc' },
    }),
  ])

  if (budgets.length === 0 && expenses.length === 0) notFound()

  const totalBudget = budgets.reduce((s, b) => s + b.value, 0)
  const totalApproved = budgets.filter(b => b.status === 'APPROVED').reduce((s, b) => s + b.value, 0)
  const totalSpent = expenses.reduce((s, e) => s + e.value, 0)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">{cat}</h1>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total orçado</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{fmt(totalBudget)}</p>
          <p className="text-xs text-gray-400">{budgets.length} proposta(s)</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Aprovado</p>
          <p className="text-xl font-bold text-green-700 mt-1">{fmt(totalApproved)}</p>
          <p className="text-xs text-gray-400">{budgets.filter(b => b.status === 'APPROVED').length} aprovado(s)</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Gasto real</p>
          <p className="text-xl font-bold text-blue-700 mt-1">{fmt(totalSpent)}</p>
          <p className="text-xs text-gray-400">{expenses.length} lançamento(s)</p>
        </div>
      </div>

      {/* Orçamentos com sugestão IA */}
      <CategoriaClient
        categoria={cat}
        orcamentos={budgets.map(b => ({
          id: b.id,
          supplier: b.supplier,
          description: b.description,
          value: b.value,
          category: b.category,
          status: b.status,
          notes: b.notes,
          fileUrl: b.fileUrl,
          stageName: b.stage?.title ?? null,
          createdByName: b.user.name,
          approvedByName: b.approvedByName,
          approvedAt: b.approvedAt?.toISOString() ?? null,
          createdAt: b.createdAt.toISOString(),
        }))}
        gastos={expenses.map(e => ({
          id: e.id,
          description: e.description,
          value: e.value,
          date: e.date.toISOString(),
          notes: e.notes,
          receiptUrl: e.receiptUrl,
          createdByName: e.user.name,
          createdAt: e.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
