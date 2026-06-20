'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Stage {
  id: string
  title: string
  description: string | null
  order: number
  status: string
  progress: number
  startDate: Date | null
  endDate: Date | null
  _count: { budgets: number; expenses: number; updates: number }
}

export default function EtapasAdmin({ stages: initial }: { stages: Stage[] }) {
  const router = useRouter()
  const [stages, setStages] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    order: stages.length + 1,
    status: 'PENDING',
    progress: 0,
    startDate: '',
    endDate: '',
  })

  function openNew() {
    setForm({ title: '', description: '', order: stages.length + 1, status: 'PENDING', progress: 0, startDate: '', endDate: '' })
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(s: Stage) {
    setForm({
      title: s.title,
      description: s.description ?? '',
      order: s.order,
      status: s.status,
      progress: s.progress,
      startDate: s.startDate ? new Date(s.startDate).toISOString().split('T')[0] : '',
      endDate: s.endDate ? new Date(s.endDate).toISOString().split('T')[0] : '',
    })
    setEditingId(s.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const url = editingId ? `/api/etapas/${editingId}` : '/api/etapas'
    const method = editingId ? 'PUT' : 'POST'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    router.refresh()
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta etapa?')) return
    await fetch(`/api/etapas/${id}`, { method: 'DELETE' })
    setStages((prev) => prev.filter((s) => s.id !== id))
  }

  const statusLabels: Record<string, string> = {
    PENDING: 'Pendente',
    IN_PROGRESS: 'Em andamento',
    COMPLETED: 'Concluída',
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-600',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Etapas da Reforma</h1>
          <p className="text-gray-500 text-sm mt-1">{stages.length} etapa(s) cadastrada(s)</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <span>+</span> Nova Etapa
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-xl max-h-[95vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {editingId ? 'Editar Etapa' : 'Nova Etapa'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Demolição"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detalhes da etapa..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
                  <input
                    type="number"
                    min={1}
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PENDING">Pendente</option>
                    <option value="IN_PROGRESS">Em andamento</option>
                    <option value="COMPLETED">Concluída</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progresso: {form.progress}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.progress}
                  onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previsão de término</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg py-2.5 text-sm font-medium"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stages list */}
      <div className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-700 font-bold text-sm">
                {stage.order}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{stage.title}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[stage.status]}`}>
                    {statusLabels[stage.status]}
                  </span>
                </div>
                {stage.description && (
                  <p className="text-sm text-gray-500 mt-1">{stage.description}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-xs">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${stage.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{stage.progress}%</span>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  <span>{stage._count.budgets} orçamento(s)</span>
                  <span>{stage._count.expenses} gasto(s)</span>
                  <span>{stage._count.updates} atualização(ões)</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(stage)}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(stage.id)}
                  className="text-xs px-3 py-1.5 border border-red-100 rounded-lg text-red-500 hover:bg-red-50"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
        {stages.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400">Nenhuma etapa cadastrada. Clique em &quot;Nova Etapa&quot; para começar.</p>
          </div>
        )}
      </div>
    </div>
  )
}
