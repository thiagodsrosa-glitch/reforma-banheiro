'use client'

import { useState } from 'react'

interface Props {
  categorias: string[]
}

const SECOES = [
  { id: 'resumo', label: 'Resumo Executivo', desc: 'Totais financeiros, progresso geral e contagem de orçamentos', icon: '📊' },
  { id: 'etapas', label: 'Etapas da Reforma', desc: 'Status e progresso (%) de cada etapa da obra', icon: '🏗️' },
  { id: 'orcamentos', label: 'Orçamentos', desc: 'Lista completa com fornecedor, valor, status e aprovação', icon: '📋' },
  { id: 'gastos', label: 'Gastos e Pagamentos', desc: 'Todas as despesas realizadas com categoria e data', icon: '💰' },
  { id: 'categorias', label: 'Análise por Categoria', desc: 'Comparativo: orçado × aprovado × gasto × saldo por categoria', icon: '📈' },
]

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'PENDING', label: 'Somente Pendentes' },
  { value: 'APPROVED', label: 'Somente Aprovados' },
  { value: 'REJECTED', label: 'Somente Rejeitados' },
]

export default function RelatorioBuilder({ categorias }: Props) {
  const [secoesSel, setSecoesSel] = useState<string[]>(['resumo', 'etapas', 'orcamentos', 'gastos', 'categorias'])
  const [status, setStatus] = useState('todos')
  const [categoria, setCategoria] = useState('todas')
  const [carregando, setCarregando] = useState(false)

  function toggleSecao(id: string) {
    setSecoesSel((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  function selecionarTodos() { setSecoesSel(SECOES.map((s) => s.id)) }
  function limparTodos() { setSecoesSel([]) }

  async function baixarExcel() {
    if (secoesSel.length === 0) return
    setCarregando(true)
    try {
      const params = new URLSearchParams({
        secoes: secoesSel.join(','),
        status,
        categoria,
      })
      const res = await fetch(`/api/relatorio?${params}`)
      if (!res.ok) throw new Error('Erro ao gerar relatório')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-reforma-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setCarregando(false)
    }
  }

  function imprimir() {
    if (secoesSel.length === 0) return
    const params = new URLSearchParams({ secoes: secoesSel.join(','), status, categoria })
    window.open(`/dashboard/relatorio/imprimir?${params}`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Seções */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Seções do Relatório</h2>
            <p className="text-xs text-gray-500 mt-0.5">Escolha o que deseja incluir</p>
          </div>
          <div className="flex gap-2">
            <button onClick={selecionarTodos} className="text-xs text-blue-600 hover:underline">Selecionar todos</button>
            <span className="text-gray-300">|</span>
            <button onClick={limparTodos} className="text-xs text-gray-400 hover:underline">Limpar</button>
          </div>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {SECOES.map((s) => {
            const ativo = secoesSel.includes(s.id)
            return (
              <label
                key={s.id}
                className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors ${ativo ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={() => toggleSecao(s.id)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-2xl">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${ativo ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    {s.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </div>
                {ativo && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                    Incluído
                  </span>
                )}
              </label>
            )
          })}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Status dos Orçamentos
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Categoria
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Prévia */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Prévia do relatório
        </p>
        {secoesSel.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma seção selecionada.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {SECOES.filter((s) => secoesSel.includes(s.id)).map((s) => (
              <span key={s.id} className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300">
                <span>{s.icon}</span> {s.label}
              </span>
            ))}
          </div>
        )}
        {status !== 'todos' && (
          <p className="text-xs text-gray-500 mt-2">
            Filtro: {STATUS_OPTIONS.find((o) => o.value === status)?.label}
          </p>
        )}
        {categoria !== 'todas' && (
          <p className="text-xs text-gray-500 mt-1">Categoria: {categoria}</p>
        )}
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={baixarExcel}
          disabled={secoesSel.length === 0 || carregando}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl px-6 py-3.5 transition-colors"
        >
          {carregando ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Gerando planilha…
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Baixar Excel (.xlsx)
            </>
          )}
        </button>
        <button
          onClick={imprimir}
          disabled={secoesSel.length === 0}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl px-6 py-3.5 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir / Salvar PDF
        </button>
      </div>
    </div>
  )
}
