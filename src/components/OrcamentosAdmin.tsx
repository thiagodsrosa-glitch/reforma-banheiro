'use client'

import { useState } from 'react'

interface Budget {
  id: string
  supplier: string
  description: string
  value: number
  category: string
  status: string
  fileUrl: string | null
  notes: string | null
  sourceName: string | null
  situacao: string | null
  approvedByName: string | null
  approvedAt: string | null
  createdAt: string
  user: { name: string }
  stage: { title: string } | null
}

interface Stage { id: string; title: string }

const STATUS_LABELS: Record<string, string> = { PENDING: 'Pendente', APPROVED: 'Aprovado', REJECTED: 'Rejeitado' }
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-600',
}
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString('pt-BR') : null

type FilterType = 'TODOS' | 'PENDING' | 'APPROVED' | 'REJECTED'

export default function OrcamentosAdmin({ budgets: initial, stages }: { budgets: Budget[]; stages: Stage[] }) {
  const [budgets, setBudgets] = useState(initial)
  const [updating, setUpdating] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('TODOS')

  // Agrupa por situação para contar X/3
  const countBySituacao = budgets.reduce((acc, b) => {
    const key = b.situacao?.trim() || b.id // sem situação = cada um é individual
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  function getCount(b: Budget) {
    const key = b.situacao?.trim() || b.id
    return countBySituacao[key] ?? 1
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    await fetch(`/api/orcamentos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, status } : b))
    setUpdating(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este orçamento?')) return
    await fetch(`/api/orcamentos/${id}`, { method: 'DELETE' })
    setBudgets(prev => prev.filter(b => b.id !== id))
  }

  const displayed = filter === 'TODOS' ? budgets : budgets.filter(b => b.status === filter)
  const totalApproved = budgets.filter(b => b.status === 'APPROVED').reduce((s, b) => s + b.value, 0)

  const counts = { TODOS: budgets.length, PENDING: 0, APPROVED: 0, REJECTED: 0 }
  budgets.forEach(b => { counts[b.status as 'PENDING' | 'APPROVED' | 'REJECTED']++ })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {budgets.length} orçamento(s) · {counts.PENDING} pendente(s) · Total aprovado: {fmt(totalApproved)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {([['TODOS', 'Todos'], ['PENDING', 'Pendentes'], ['APPROVED', 'Aprovados'], ['REJECTED', 'Rejeitados']] as [FilterType, string][]).map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === v
              ? v === 'APPROVED' ? 'bg-green-600 text-white' : v === 'REJECTED' ? 'bg-red-600 text-white' : v === 'PENDING' ? 'bg-yellow-500 text-white' : 'bg-gray-900 text-white'
              : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {l} ({counts[v as keyof typeof counts] ?? counts.TODOS})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-8"></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Situação</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fornecedor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Categoria / Etapa</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Enviado por</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.map(b => {
                const isOpen = expanded === b.id
                const count = getCount(b)
                return (
                  <>
                    <tr key={b.id}
                      className={`hover:bg-blue-50 cursor-pointer transition-colors ${isOpen ? 'bg-blue-50' : ''}`}
                      onClick={() => setExpanded(isOpen ? null : b.id)}>
                      <td className="px-4 py-3 text-gray-400 text-center">
                        <span className="text-xs">{isOpen ? '▾' : '▸'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 text-sm leading-tight">{b.description}</p>
                        {b.situacao && (
                          <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            Situação: {b.situacao}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700 font-medium">{b.supplier || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-gray-600 text-sm">{b.category}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${count >= 3 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {count}/3
                          </span>
                        </div>
                        {b.stage && <p className="text-xs text-gray-400 mt-0.5">{b.stage.title}</p>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(b.value)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status]}`}>
                          {STATUS_LABELS[b.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {b.sourceName
                          ? <><span className="text-xs bg-green-50 text-green-700 border border-green-200 px-1 py-0.5 rounded">WhatsApp</span><p className="text-xs text-gray-700 mt-0.5">{b.sourceName}</p></>
                          : <p className="text-xs text-gray-600">{b.user.name}</p>}
                        <p className="text-xs text-gray-400">{fmtDate(b.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1.5 flex-wrap">
                          {b.status !== 'APPROVED' && (
                            <button disabled={updating === b.id} onClick={() => updateStatus(b.id, 'APPROVED')}
                              className="text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 disabled:opacity-50">
                              Aprovar
                            </button>
                          )}
                          {b.status !== 'REJECTED' && (
                            <button disabled={updating === b.id} onClick={() => updateStatus(b.id, 'REJECTED')}
                              className="text-xs px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50">
                              Rejeitar
                            </button>
                          )}
                          {b.status !== 'PENDING' && (
                            <button disabled={updating === b.id} onClick={() => updateStatus(b.id, 'PENDING')}
                              className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded hover:bg-yellow-100 disabled:opacity-50">
                              Pendente
                            </button>
                          )}
                          <button onClick={() => handleDelete(b.id)} className="text-gray-300 hover:text-red-500 text-xs px-1">✕</button>
                        </div>
                      </td>
                    </tr>

                    {/* Linha expandida com detalhes */}
                    {isOpen && (
                      <tr key={`${b.id}-detail`} className="bg-blue-50">
                        <td colSpan={8} className="px-6 pb-4 pt-0">
                          <div className="bg-white rounded-xl border border-blue-100 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Descrição completa</p>
                              <p className="text-gray-800">{b.description}</p>
                            </div>
                            {b.notes && (
                              <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Observações / IA</p>
                                <p className="text-gray-600 text-xs">{b.notes}</p>
                              </div>
                            )}
                            {b.approvedByName && (
                              <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                                  {b.status === 'APPROVED' ? 'Aprovado por' : 'Rejeitado por'}
                                </p>
                                <p className="text-gray-800 font-medium">{b.approvedByName}</p>
                                {b.approvedAt && <p className="text-xs text-gray-500">{fmtDate(b.approvedAt)}</p>}
                              </div>
                            )}
                            {b.fileUrl && (
                              <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Arquivo / Contrato</p>
                                <a href={b.fileUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-xs">📄 Ver arquivo</a>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Situação / Grupo</p>
                              <p className="text-gray-700">{b.situacao ?? '—'}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Este item tem {getCount(b)} de 3 orçamentos necessários
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
          {displayed.length === 0 && (
            <p className="text-center text-gray-400 py-12 text-sm">Nenhum orçamento encontrado.</p>
          )}
        </div>
      </div>
    </div>
  )
}
