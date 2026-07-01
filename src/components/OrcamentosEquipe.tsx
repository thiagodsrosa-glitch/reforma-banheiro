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
  createdAt: Date
  user: { name: string }
  stage: { title: string } | null
}

interface Stage {
  id: string
  title: string
}

const CATEGORIES = ['Alvenaria', 'Material', 'Mão de obra', 'Equipamento', 'Hidráulica', 'Elétrica', 'Revestimento', 'Pintura', 'Outro']

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Aguardando aprovação',
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

export default function OrcamentosEquipe({ budgets: initial, stages }: { budgets: Budget[]; stages: Stage[] }) {
  const [budgets, setBudgets] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    supplier: '',
    description: '',
    value: '',
    category: 'Material',
    stageId: '',
    fileUrl: '',
    notes: '',
    hasContract: false,
    hasEPI: false,
    justificativa: '',
  })

  // Conta quantos orçamentos já existem na categoria selecionada
  const countInCategory = budgets.filter(b => b.category === form.category).length
  const precisaJustificativa = countInCategory < 2 // menos de 2 já cadastrados = vai ser o 1º ou 2º

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/orcamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        notes: [form.notes, form.justificativa ? `[Justificativa] ${form.justificativa}` : ''].filter(Boolean).join(' | '),
      }),
    })
    const budget = await res.json()
    setBudgets((prev) => [budget, ...prev])
    setShowForm(false)
    setForm({ supplier: '', description: '', value: '', category: 'Material', stageId: '', fileUrl: '', notes: '', hasContract: false, hasEPI: false, justificativa: '' })
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-500 text-sm mt-1">Envie propostas de orçamento para aprovação</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          + Novo Orçamento
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-xl max-h-[95vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">Novo Orçamento</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor *</label>
                <input
                  required
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do fornecedor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descreva o que está sendo orçado..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Aviso e justificativa quando < 3 orçamentos na categoria */}
              {precisaJustificativa && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-orange-800">
                    ⚠️ Esta categoria tem apenas {countInCategory} orçamento(s) — mínimo é 3
                  </p>
                  <p className="text-xs text-orange-700">
                    Se não for possível obter 3 orçamentos, é obrigatório justificar (ex: "único fornecedor na região", "urgência", etc.)
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-orange-800 mb-1">Justificativa *</label>
                    <textarea
                      value={form.justificativa}
                      onChange={(e) => setForm({ ...form, justificativa: e.target.value })}
                      rows={2}
                      required={precisaJustificativa}
                      placeholder="Ex: Único fornecedor disponível na região para este serviço..."
                      className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
                <select
                  value={form.stageId}
                  onChange={(e) => setForm({ ...form, stageId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Geral (sem etapa específica)</option>
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link do arquivo (opcional)
                </label>
                <input
                  type="url"
                  value={form.fileUrl}
                  onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://drive.google.com/..."
                />
              </div>
              {/* Contrato e EPI */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">📄 Possui contrato?</p>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="hasContract" checked={form.hasContract === true} onChange={() => setForm({ ...form, hasContract: true })} className="accent-green-600" />
                      <span className="text-sm text-green-700 font-medium">Sim</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="hasContract" checked={form.hasContract === false} onChange={() => setForm({ ...form, hasContract: false })} className="accent-red-500" />
                      <span className="text-sm text-red-600 font-medium">Não</span>
                    </label>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">🦺 Possui EPI?</p>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="hasEPI" checked={form.hasEPI === true} onChange={() => setForm({ ...form, hasEPI: true })} className="accent-green-600" />
                      <span className="text-sm text-green-700 font-medium">Sim</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="hasEPI" checked={form.hasEPI === false} onChange={() => setForm({ ...form, hasEPI: false })} className="accent-red-500" />
                      <span className="text-sm text-red-600 font-medium">Não</span>
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Informações adicionais..."
                />
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
                  {loading ? 'Enviando...' : 'Enviar Orçamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {budgets.map((b) => (
          <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="font-semibold text-gray-900">{b.supplier}</p>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status]}`}>
                    {STATUS_LABELS[b.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{b.description}</p>
                <div className="flex gap-4 text-xs text-gray-400 mt-2">
                  <span>{b.category}</span>
                  {b.stage && <span>Etapa: {b.stage.title}</span>}
                  <span>por {b.user.name}</span>
                  <span>{new Date(b.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xl font-bold text-gray-900">{fmt(b.value)}</p>
                {b.fileUrl && (
                  <a
                    href={b.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Ver arquivo
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
        {budgets.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400">Nenhum orçamento cadastrado. Clique em &quot;Novo Orçamento&quot;.</p>
          </div>
        )}
      </div>
    </div>
  )
}
