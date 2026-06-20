'use client'

import { useState } from 'react'

interface Expense {
  id: string
  description: string
  value: number
  category: string
  date: Date
  receiptUrl: string | null
  notes: string | null
  user: { name: string }
  stage: { title: string } | null
}

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
          <table className="w-full text-sm min-w-[650px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descrição</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Etapa</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lançado por</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{e.description}</p>
                    {e.notes && <p className="text-xs text-gray-500">{e.notes}</p>}
                  </td>
                  <td className="px-4 py-4 text-gray-600">{e.category}</td>
                  <td className="px-4 py-4 text-gray-600">{e.stage?.title ?? '—'}</td>
                  <td className="px-4 py-4 text-gray-500">
                    {new Date(e.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-gray-900">{fmt(e.value)}</td>
                  <td className="px-4 py-4 text-gray-500">{e.user.name}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      {e.receiptUrl && (
                        <a
                          href={e.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg"
                        >
                          Comprovante
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-xs px-2.5 py-1 text-gray-400 hover:text-red-500 rounded-lg"
                      >
                        ✕
                      </button>
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
