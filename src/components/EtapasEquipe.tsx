'use client'

import { useState } from 'react'

interface StageUpdate {
  id: string
  content: string
  createdAt: Date
  user: { name: string }
}

interface Stage {
  id: string
  title: string
  description: string | null
  order: number
  status: string
  progress: number
  startDate: Date | null
  endDate: Date | null
  updates: StageUpdate[]
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
}

export default function EtapasEquipe({ stages: initial }: { stages: Stage[] }) {
  const [stages, setStages] = useState(initial)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updateText, setUpdateText] = useState('')
  const [sendingUpdate, setSendingUpdate] = useState<string | null>(null)

  async function sendUpdate(stageId: string) {
    if (!updateText.trim()) return
    setSendingUpdate(stageId)
    const res = await fetch(`/api/etapas/${stageId}/atualizacoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: updateText }),
    })
    const update = await res.json()
    setStages((prev) =>
      prev.map((s) =>
        s.id === stageId ? { ...s, updates: [update, ...s.updates] } : s
      )
    )
    setUpdateText('')
    setSendingUpdate(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Etapas da Reforma</h1>
        <p className="text-gray-500 text-sm mt-1">Acompanhe o progresso e adicione atualizações</p>
      </div>

      <div className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              className="w-full text-left p-5"
              onClick={() => setExpandedId(expandedId === stage.id ? null : stage.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {stage.order}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{stage.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[stage.status]}`}>
                      {STATUS_LABELS[stage.status]}
                    </span>
                  </div>
                  {stage.description && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{stage.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-24 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${stage.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{stage.progress}%</span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === stage.id ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            {expandedId === stage.id && (
              <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">
                {/* Dates */}
                {(stage.startDate || stage.endDate) && (
                  <div className="flex gap-6 text-sm text-gray-500">
                    {stage.startDate && (
                      <span>Início: {new Date(stage.startDate).toLocaleDateString('pt-BR')}</span>
                    )}
                    {stage.endDate && (
                      <span>Previsão: {new Date(stage.endDate).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                )}

                {/* Add update */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adicionar atualização
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      value={updateText}
                      onChange={(e) => setUpdateText(e.target.value)}
                      rows={2}
                      placeholder="Descreva o que foi feito, materiais chegaram, etc..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      disabled={!updateText.trim() || sendingUpdate === stage.id}
                      onClick={() => sendUpdate(stage.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300 self-end"
                    >
                      {sendingUpdate === stage.id ? '...' : 'Enviar'}
                    </button>
                  </div>
                </div>

                {/* Update history */}
                {stage.updates.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Atualizações recentes</p>
                    <div className="space-y-2">
                      {stage.updates.map((u) => (
                        <div key={u.id} className="flex gap-3 text-sm">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-500 flex-shrink-0 mt-0.5">
                            {u.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">{u.user.name}</span>
                            <span className="text-gray-400 text-xs ml-2">
                              {new Date(u.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <p className="text-gray-600 mt-0.5">{u.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {stages.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400">As etapas da reforma ainda não foram cadastradas.</p>
          </div>
        )}
      </div>
    </div>
  )
}
