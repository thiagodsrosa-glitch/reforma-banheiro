'use client'

import { useState } from 'react'

interface Expense {
  id: string
  description: string
  value: number
  category: string
  supplierName: string | null
  date: string
  requestedAt: string | null
  authorizedAt: string | null
  paidAt: string | null
  receiptUrl: string | null
  notes: string | null
  user: { name: string }
  stage: { title: string } | null
}

const fmtDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function GastosAdmin({ expenses: initial }: { expenses: Expense[] }) {
  const [expenses, setExpenses] = useState(initial)

  const total = expenses.reduce((sum, e) => sum + e.value, 0)

  async function handleDelete(id: string) {
    if (!confirm('Excluir este gasto?')) return
    await fetch(`/api/gastos/${id}`, { method: 'DELETE' })
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
        <p className="text-gray-500 text-sm mt-1">
          {expenses.length} lançamento(s) · Total: {fmt(total)}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Descrição</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fornecedor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Categoria</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Solicitação</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Autorização</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pagamento</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Lançado por</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 text-sm">{e.description}</p>
                    {e.stage && <p className="text-xs text-gray-400">{e.stage.title}</p>}
                    {e.notes && <p className="text-xs text-gray-400 italic truncate max-w-[200px]">{e.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-medium">{e.supplierName ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{e.category}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(e.value)}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {fmtDate(e.requestedAt ?? e.date)}
                    <p className="text-gray-400">{e.user.name}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {e.authorizedAt
                      ? <span className="text-green-700 font-medium">{fmtDate(e.authorizedAt)}</span>
                      : <span className="text-yellow-600">Pendente</span>}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {e.paidAt
                      ? <span className="text-blue-700 font-medium">{fmtDate(e.paidAt)}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{e.user.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {e.receiptUrl && (
                        <a href={e.receiptUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                          🧾
                        </a>
                      )}
                      <button onClick={() => handleDelete(e.id)}
                        className="text-gray-300 hover:text-red-500 text-xs px-1">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {expenses.length === 0 && (
            <p className="text-center text-gray-400 py-12 text-sm">Nenhum gasto lançado ainda.</p>
          )}
        </div>
      </div>
    </div>
  )
}
