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

const CATEGORIES = ['Alvenaria', 'Material', 'Mão de obra', 'Equipamento', 'Hidráulica', 'Elétrica', 'Revestimento', 'Pintura', 'Outro']

const FORM_VAZIO = { supplier: '', description: '', value: '', category: 'Material', stageId: '', fileUrl: '', notes: '' }

export default function OrcamentosAdmin({ budgets: initial, stages }: { budgets: Budget[]; stages: Stage[] }) {
  const [budgets, setBudgets] = useState(initial)
  const [updating, setUpdating] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('TODOS')
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState(FORM_VAZIO)

  async function handleNovoOrcamento(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    const res = await fetch('/api/orcamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, value: Number(form.value) }),
    })
    if (res.ok) {
      const budget = await res.json()
      setBudgets((prev) => [budget, ...prev])
      setShowForm(false)
      setForm(FORM_VAZIO)
    }
    setFormLoading(false)
  }

  // Posição de cada orçamento dentro do seu grupo de situação (1º, 2º, 3º)
  const positionByBudgetId: Record<string, number> = {}
  const totalBySituacao: Record<string, number> = {}
  budgets.forEach((b) => {
    const key = b.situacao?.trim() || b.id
    totalBySituacao[key] = (totalBySituacao[key] ?? 0) + 1
    positionByBudgetId[b.id] = totalBySituacao[key]
  })

  function getPosition(b: Budget) { return positionByBudgetId[b.id] ?? 1 }
  function getTotal(b: Budget) {
    const key = b.situacao?.trim() || b.id
    return totalBySituacao[key] ?? 1
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
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          + Lançar Orçamento
        </button>
      </div>

      {/* Modal novo orçamento */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-xl max-h-[95vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Lançar Orçamento</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleNovoOrcamento} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fornecedor *</label>
                <input required value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do fornecedor" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição *</label>
                <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descreva o que está sendo orçado..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$) *</label>
                  <input required type="number" step="0.01" min="0" value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0,00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Etapa</label>
                <select value={form.stageId} onChange={(e) => setForm({ ...form, stageId: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Geral (sem etapa específica)</option>
                  {stages.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link do arquivo (opcional)</label>
                <input type="url" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://drive.google.com/..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Informações adicionais..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
                  Cancelar
                </button>
                <button type="submit" disabled={formLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg py-2.5 text-sm font-medium">
                  {formLoading ? 'Enviando...' : 'Salvar Orçamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                const position = getPosition(b)
                const total = getTotal(b)
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
                          <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${total >= 3 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {position}/3
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
                                Este item tem {getTotal(b)} de 3 orçamentos necessários
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
