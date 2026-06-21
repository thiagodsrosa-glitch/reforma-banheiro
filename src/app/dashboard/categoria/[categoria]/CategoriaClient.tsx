'use client'

import { useState } from 'react'

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const STATUS: Record<string, { label: string; color: string }> = {
  APPROVED: { label: 'Aprovado', color: 'bg-green-100 text-green-700' },
  PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  REJECTED: { label: 'Rejeitado', color: 'bg-red-100 text-red-600' },
}

interface Orcamento {
  id: string; supplier: string; description: string; value: number; category: string
  status: string; notes: string | null; fileUrl: string | null; stageName: string | null
  createdByName: string; approvedByName: string | null; approvedAt: string | null; createdAt: string
}
interface Gasto {
  id: string; description: string; value: number; date: string; notes: string | null
  receiptUrl: string | null; createdByName: string; createdAt: string
}
interface Sugestao {
  melhorOpcao: string; indice: number; valorMelhor: number; economia: number
  percentualEconomia: number; justificativa: string; alerta: string | null
}

export default function CategoriaClient({
  categoria, orcamentos, gastos
}: { categoria: string; orcamentos: Orcamento[]; gastos: Gasto[] }) {
  const [sugestao, setSugestao] = useState<Sugestao | null>(null)
  const [loadingSugestao, setLoadingSugestao] = useState(false)

  async function pedirSugestao() {
    setLoadingSugestao(true)
    try {
      const res = await fetch('/api/ai/sugestao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria, orcamentos }),
      })
      const data = await res.json()
      setSugestao(data)
    } catch { /* silencioso */ }
    finally { setLoadingSugestao(false) }
  }

  const temMultiplos = orcamentos.length > 1

  return (
    <div className="space-y-6">
      {/* Botão sugestão IA */}
      {orcamentos.length > 0 && (
        <div>
          {!sugestao ? (
            <button
              onClick={pedirSugestao}
              disabled={loadingSugestao}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loadingSugestao ? (
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Analisando com IA...</>
              ) : (
                <><span>✨</span> {temMultiplos ? 'Sugestão de melhor custo-benefício' : 'Análise da proposta'}</>
              )}
            </button>
          ) : (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-purple-700 text-lg">✨</span>
                    <p className="font-bold text-gray-900">Sugestão da IA</p>
                    {sugestao.economia > 0 && (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        Economia de {fmt(sugestao.economia)} ({sugestao.percentualEconomia}%)
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 font-medium mb-1">
                    Melhor opção: <span className="text-blue-700">{sugestao.melhorOpcao}</span> — {fmt(sugestao.valorMelhor)}
                  </p>
                  <p className="text-sm text-gray-600">{sugestao.justificativa}</p>
                  {sugestao.alerta && (
                    <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2 mt-2">
                      ⚠️ {sugestao.alerta}
                    </p>
                  )}
                </div>
                <button onClick={() => setSugestao(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de orçamentos */}
      {orcamentos.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Propostas / Orçamentos</h2>
            <span className="text-xs text-gray-400">{orcamentos.length} proposta(s)</span>
          </div>
          <div className="divide-y divide-gray-50">
            {orcamentos.map((o, i) => {
              const isMelhor = sugestao && sugestao.indice === i + 1
              return (
                <div key={o.id} className={`p-5 ${isMelhor ? 'bg-green-50 border-l-4 border-green-500' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">{o.description || o.supplier}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS[o.status]?.color}`}>
                          {STATUS[o.status]?.label}
                        </span>
                        {isMelhor && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-bold">✓ Sugerido pela IA</span>}
                      </div>
                      <p className="text-sm text-gray-500">{o.supplier}</p>
                      {o.stageName && <p className="text-xs text-gray-400 mt-0.5">Etapa: {o.stageName}</p>}
                      {o.notes && <p className="text-xs text-gray-400 mt-1 italic">{o.notes}</p>}
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                        <span>Cadastrado por <strong className="text-gray-600">{o.createdByName}</strong> em {new Date(o.createdAt).toLocaleDateString('pt-BR')}</span>
                        {o.approvedByName && (
                          <span className="text-green-600">
                            Aprovado por <strong>{o.approvedByName}</strong>
                            {o.approvedAt && ` em ${new Date(o.approvedAt).toLocaleDateString('pt-BR')}`}
                          </span>
                        )}
                      </div>
                      {o.fileUrl && (
                        <a href={o.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline">
                          📄 Ver contrato/arquivo
                        </a>
                      )}
                    </div>
                    <p className="text-xl font-bold text-gray-900 flex-shrink-0">{fmt(o.value)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Gastos realizados */}
      {gastos.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Gastos Realizados</h2>
            <span className="text-xs text-gray-400">{gastos.length} lançamento(s)</span>
          </div>
          <div className="divide-y divide-gray-50">
            {gastos.map(g => (
              <div key={g.id} className="p-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{g.description}</p>
                  {g.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{g.notes}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(g.date).toLocaleDateString('pt-BR')} · por <strong className="text-gray-600">{g.createdByName}</strong>
                  </p>
                  {g.receiptUrl && (
                    <a href={g.receiptUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 hover:underline">
                      🧾 Ver comprovante
                    </a>
                  )}
                </div>
                <p className="font-bold text-gray-900 flex-shrink-0">{fmt(g.value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
