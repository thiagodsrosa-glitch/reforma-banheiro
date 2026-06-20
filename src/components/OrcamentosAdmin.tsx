'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Budget {
  id: string
  supplier: string
  description: string
  value: number
  category: string
  status: string
  fileUrl: string | null
  notes: string | null
  createdAt: Date
  user: { name: string }
  stage: { title: string } | null
}

interface Stage {
  id: string
  title: string
}

const CATEGORIES = ['Material', 'Mão de obra', 'Equipamento', 'Hidráulica', 'Elétrica', 'Revestimento', 'Pintura', 'Outro']

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
}
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-600',
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function OrcamentosAdmin({ budgets: initial, stages }: { budgets: Budget[]; stages: Stage[] }) {
  const router = useRouter()
  const [budgets, setBudgets] = useState(initial)
  const [updating, setUpdating] = useState<string | null>(null)

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    await fetch(`/api/orcamentos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)))
    setUpdating(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este orçamento?')) return
    await fetch(`/api/orcamentos/${id}`, { method: 'DELETE' })
    setBudgets((prev) => prev.filter((b) => b.id !== id))
  }

  const totalApproved = budgets
    .filter((b) => b.status === 'APPROVED')
    .reduce((sum, b) => sum + b.value, 0)
  const pending = budgets.filter((b) => b.status === 'PENDING').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {budgets.length} orçamento(s) · {pending} pendente(s) · Total aprovado: {fmt(totalApproved)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto -mx-0">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fornecedor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Etapa</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Enviado por</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {budgets.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{b.supplier}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{b.description}</p>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{b.category}</td>
                  <td className="px-4 py-4 text-gray-600">{b.stage?.title ?? '—'}</td>
                  <td className="px-4 py-4 text-right font-semibold text-gray-900">{fmt(b.value)}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[b.status]}`}>
                      {STATUS_LABELS[b.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-500">{b.user.name}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      {b.status === 'PENDING' && (
                        <>
                          <button
                            disabled={updating === b.id}
                            onClick={() => updateStatus(b.id, 'APPROVED')}
                            className="text-xs px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50"
                          >
                            Aprovar
                          </button>
                          <button
                            disabled={updating === b.id}
                            onClick={() => updateStatus(b.id, 'REJECTED')}
                            className="text-xs px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
                          >
                            Rejeitar
                          </button>
                        </>
                      )}
                      {b.fileUrl && (
                        <a
                          href={b.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100"
                        >
                          Ver arquivo
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(b.id)}
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
          {budgets.length === 0 && (
            <p className="text-center text-gray-400 py-12 text-sm">
              Nenhum orçamento cadastrado ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
