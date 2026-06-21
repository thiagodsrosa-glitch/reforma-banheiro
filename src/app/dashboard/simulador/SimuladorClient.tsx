'use client'

import { useState, useMemo } from 'react'

interface Budget {
  id: string
  supplier: string
  description: string
  value: number
  category: string
  status: string
  stage: string | null
  notes: string | null
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-600',
}
const STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Aprovado',
  PENDING: 'Pendente',
  REJECTED: 'Rejeitado',
}

const SCENARIO_COLORS = [
  { bg: 'bg-blue-600', light: 'bg-blue-50 border-blue-200 text-blue-700', label: 'A' },
  { bg: 'bg-purple-600', light: 'bg-purple-50 border-purple-200 text-purple-700', label: 'B' },
  { bg: 'bg-orange-500', light: 'bg-orange-50 border-orange-200 text-orange-700', label: 'C' },
]

export default function SimuladorClient({ budgets }: { budgets: Budget[] }) {
  // scenarios: { A: Set<id>, B: Set<id>, C: Set<id> }
  const [scenarios, setScenarios] = useState<Record<string, Set<string>>>({
    A: new Set(), B: new Set(), C: new Set(),
  })
  const [activeScenario, setActiveScenario] = useState<'A' | 'B' | 'C'>('A')
  const [filterCat, setFilterCat] = useState('Todas')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [scenarioNames, setScenarioNames] = useState({ A: 'Cenário A', B: 'Cenário B', C: 'Cenário C' })

  const categories = useMemo(() => ['Todas', ...Array.from(new Set(budgets.map(b => b.category))).sort()], [budgets])
  const statuses = ['Todos', 'APPROVED', 'PENDING', 'REJECTED']

  const filtered = budgets.filter(b =>
    (filterCat === 'Todas' || b.category === filterCat) &&
    (filterStatus === 'Todos' || b.status === filterStatus)
  )

  // Group by category
  const grouped = useMemo(() => {
    const g: Record<string, Budget[]> = {}
    filtered.forEach(b => { if (!g[b.category]) g[b.category] = []; g[b.category].push(b) })
    return g
  }, [filtered])

  function toggleItem(id: string, scenario: 'A' | 'B' | 'C') {
    setScenarios(prev => {
      const next = { ...prev, [scenario]: new Set(prev[scenario]) }
      if (next[scenario].has(id)) next[scenario].delete(id)
      else next[scenario].add(id)
      return next
    })
  }

  function getScenarioOf(id: string): string | null {
    for (const [s, set] of Object.entries(scenarios)) {
      if (set.has(id)) return s
    }
    return null
  }

  function scenarioTotal(s: 'A' | 'B' | 'C') {
    return budgets.filter(b => scenarios[s].has(b.id)).reduce((sum, b) => sum + b.value, 0)
  }

  function clearScenario(s: 'A' | 'B' | 'C') {
    setScenarios(prev => ({ ...prev, [s]: new Set() }))
  }

  const hasAny = Object.values(scenarios).some(s => s.size > 0)

  return (
    <div className="space-y-4">
      {/* Painel de cenários */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(['A', 'B', 'C'] as const).map((s, i) => {
          const col = SCENARIO_COLORS[i]
          const total = scenarioTotal(s)
          const count = scenarios[s].size
          const isActive = activeScenario === s
          return (
            <button
              key={s}
              onClick={() => setActiveScenario(s)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${isActive ? `border-current ${col.light}` : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-lg ${col.bg} text-white text-xs font-bold flex items-center justify-center`}>
                    {col.label}
                  </span>
                  <input
                    value={scenarioNames[s]}
                    onChange={e => setScenarioNames(p => ({ ...p, [s]: e.target.value }))}
                    onClick={ev => ev.stopPropagation()}
                    className="font-semibold text-sm bg-transparent border-none outline-none w-32"
                  />
                </div>
                {count > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); clearScenario(s) }}
                    className="text-xs text-gray-400 hover:text-red-500">
                    Limpar
                  </button>
                )}
              </div>
              <p className="text-xl font-bold text-gray-900">{fmt(total)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{count} item(ns) selecionado(s)</p>
            </button>
          )
        })}
      </div>

      {/* Comparativo quando há mais de 1 cenário preenchido */}
      {hasAny && (
        <div className="bg-gray-900 text-white rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Comparativo de cenários</p>
          <div className="grid grid-cols-3 gap-4">
            {(['A', 'B', 'C'] as const).map((s, i) => {
              const col = SCENARIO_COLORS[i]
              const total = scenarioTotal(s)
              const items = budgets.filter(b => scenarios[s].has(b.id))
              if (items.length === 0) return (
                <div key={s} className="opacity-30 text-center">
                  <p className="text-sm">{scenarioNames[s]}</p>
                  <p className="text-lg font-bold">—</p>
                </div>
              )
              return (
                <div key={s} className="text-center">
                  <p className="text-xs text-gray-400">{scenarioNames[s]}</p>
                  <p className="text-2xl font-bold mt-1">{fmt(total)}</p>
                  <div className="mt-2 space-y-1">
                    {items.map(b => (
                      <p key={b.id} className="text-xs text-gray-400 truncate">{b.description || b.supplier}</p>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          {/* Menor valor */}
          {(['A', 'B', 'C'] as const).filter(s => scenarios[s].size > 0).length > 1 && (() => {
            const ativos = (['A', 'B', 'C'] as const).filter(s => scenarios[s].size > 0)
            const min = ativos.reduce((m, s) => scenarioTotal(s) < scenarioTotal(m) ? s : m)
            return (
              <div className="mt-3 pt-3 border-t border-gray-700 text-center">
                <span className="text-xs text-green-400">
                  ✓ Menor custo: <strong>{scenarioNames[min]}</strong> — {fmt(scenarioTotal(min))}
                  {ativos.length === 2 && ` (economia de ${fmt(Math.abs(scenarioTotal(ativos[0]) - scenarioTotal(ativos[1])))})`}
                </span>
              </div>
            )
          })()}
        </div>
      )}

      {/* Filtros + lista */}
      <div className="bg-white rounded-xl border border-gray-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Adicionando ao:</span>
            {(['A', 'B', 'C'] as const).map((s, i) => (
              <button key={s} onClick={() => setActiveScenario(s)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${activeScenario === s ? `${SCENARIO_COLORS[i].bg} text-white` : 'bg-gray-100 text-gray-600'}`}>
                {scenarioNames[s]}
              </button>
            ))}
          </div>
          <div className="flex gap-2 ml-auto flex-wrap">
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500">
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500">
              {statuses.map(s => <option key={s} value={s}>{s === 'Todos' ? 'Todos os status' : STATUS_LABELS[s]}</option>)}
            </select>
          </div>
        </div>

        {/* Orçamentos por categoria */}
        <div className="divide-y divide-gray-50">
          {Object.keys(grouped).length === 0 && (
            <p className="p-8 text-center text-gray-400 text-sm">Nenhum orçamento encontrado.</p>
          )}
          {Object.entries(grouped).map(([cat, items]) => {
            const catTotal = items.reduce((s, b) => s + b.value, 0)
            return (
              <div key={cat}>
                <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{cat}</span>
                  <span className="text-xs text-gray-400">{items.length} orçamento(s) · total {fmt(catTotal)}</span>
                </div>
                {items.map(b => {
                  const scenOf = getScenarioOf(b.id)
                  const scIdx = scenOf ? ['A','B','C'].indexOf(scenOf) : -1
                  const col = scIdx >= 0 ? SCENARIO_COLORS[scIdx] : null
                  return (
                    <div key={b.id}
                      onClick={() => toggleItem(b.id, activeScenario)}
                      className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${col ? `${col.light} border-l-4` : 'hover:bg-gray-50 border-l-4 border-transparent'}`}>
                      {/* Checkbox visual */}
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${col ? `${col.bg} border-transparent` : 'border-gray-300'}`}>
                        {col && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-900 truncate">{b.description || b.supplier}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status]}`}>
                            {STATUS_LABELS[b.status]}
                          </span>
                          {col && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${col.light}`}>
                              {scenarioNames[scenOf as 'A'|'B'|'C']}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {b.supplier}{b.stage ? ` · ${b.stage}` : ''}
                        </p>
                      </div>
                      <p className="font-bold text-gray-900 text-sm flex-shrink-0">{fmt(b.value)}</p>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
