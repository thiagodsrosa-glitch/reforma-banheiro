'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Globe, MapPin, RefreshCw, Trophy } from 'lucide-react'
import type { Apuracao, ResultadoApuracao } from '@/lib/tse'

const INTERVALO_MS = 30_000
const CORES = ['bg-blue-600', 'bg-red-600', 'bg-amber-500', 'bg-emerald-600', 'bg-purple-600', 'bg-gray-500']

const fmt = (n: number) => n.toLocaleString('pt-BR')
const pct = (n: number) => `${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
const hora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium' }) : '—'

function CardRegiao({ r }: { r: Apuracao }) {
  const Icone = r.abrangencia === 'zz' ? Globe : MapPin
  const finalizado = r.percentualSecoes >= 100
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icone className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">{r.nome}</h2>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              finalizado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {finalizado ? 'Apuração concluída' : 'Em apuração'}
          </span>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Seções totalizadas</span>
            <span className="font-semibold text-gray-900">{pct(r.percentualSecoes)}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${Math.min(100, r.percentualSecoes)}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {fmt(r.secoesTotalizadas)} de {fmt(r.secoesTotal)} seções · atualizado {hora(r.atualizadoEm)}
          </p>
        </div>
      </div>

      <ul className="p-5 space-y-4 flex-1">
        {r.candidatos.map((c, i) => (
          <li key={c.numero + c.nome}>
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate flex items-center gap-1.5">
                  {i === 0 && r.validos > 0 && <Trophy className="w-4 h-4 text-amber-500 shrink-0" />}
                  {c.nome}
                  {c.eleito && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Eleito</span>}
                  {!c.eleito && /2º turno/i.test(c.situacao) && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">2º turno</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {c.numero} · {c.partido}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-gray-900">{pct(c.percentual)}</p>
                <p className="text-xs text-gray-500">{fmt(c.votos)} votos</p>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full ${CORES[Math.min(i, CORES.length - 1)]} transition-all duration-700`}
                style={{ width: `${Math.min(100, c.percentual)}%` }}
              />
            </div>
          </li>
        ))}
        {r.candidatos.length === 0 && <li className="text-sm text-gray-500">Nenhum voto apurado ainda.</li>}
      </ul>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100 border-t border-gray-100 text-center">
        {[
          ['Comparecimento', r.comparecimento, r.percentualComparecimento],
          ['Abstenção', r.abstencao, r.percentualAbstencao],
          ['Brancos', r.brancos, r.percentualBrancos],
          ['Nulos', r.nulos, r.percentualNulos],
        ].map(([rotulo, valor, p]) => (
          <div key={rotulo as string} className="bg-white p-3">
            <p className="text-xs text-gray-500">{rotulo}</p>
            <p className="text-sm font-semibold text-gray-900">{fmt(valor as number)}</p>
            <p className="text-xs text-gray-500">{pct(p as number)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

async function buscarApuracao(demo: boolean): Promise<ResultadoApuracao> {
  const res = await fetch(`/api/apuracao${demo ? '?demo=1' : ''}`, { cache: 'no-store' })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? `Erro ${res.status}`)
  return json
}

function Painel() {
  const demo = useSearchParams().get('demo') === '1'
  const [dados, setDados] = useState<ResultadoApuracao | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  const carregar = useCallback(
    () =>
      buscarApuracao(demo)
        .then((json) => {
          setDados(json)
          setErro(null)
        })
        .catch((e) => setErro(e instanceof Error ? e.message : 'Falha ao atualizar'))
        .finally(() => setCarregando(false)),
    [demo],
  )

  const atualizar = () => {
    setCarregando(true)
    carregar()
  }

  useEffect(() => {
    const id = setInterval(carregar, INTERVALO_MS)
    const primeira = setTimeout(carregar, 0)
    return () => {
      clearInterval(id)
      clearTimeout(primeira)
    }
  }, [carregar])

  return (
    <main className="min-h-full max-w-6xl mx-auto px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Apuração — Presidente</h1>
          <p className="text-sm text-gray-500 mt-1">
            Resultados oficiais do TSE · Brasil e Exterior · atualização automática a cada 30s
            {dados?.demo && <span className="ml-2 font-semibold text-amber-600">(dados de demonstração)</span>}
          </p>
        </div>
        <button
          onClick={atualizar}
          disabled={carregando}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </header>

      {erro && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          Não foi possível atualizar: {erro}
          {dados && ' — exibindo os últimos dados recebidos.'}
        </div>
      )}

      {!dados && !erro && <p className="text-gray-500">Carregando apuração…</p>}

      {dados && (
        <div className="grid gap-6 lg:grid-cols-2">
          {dados.regioes.map((r) =>
            'erro' in r ? (
              <div key={r.abrangencia} className="bg-white border border-gray-200 rounded-2xl p-5">
                <h2 className="text-xl font-bold text-gray-900">{r.nome}</h2>
                <p className="text-sm text-gray-500 mt-2">Dados ainda indisponíveis ({r.erro}).</p>
              </div>
            ) : (
              <CardRegiao key={r.abrangencia} r={r} />
            ),
          )}
        </div>
      )}

      {dados && (
        <p className="text-xs text-gray-400 mt-6 text-center">
          Fonte: resultados.tse.jus.br · eleição {dados.eleicao} · consultado em {hora(dados.geradoEm)}
        </p>
      )}
    </main>
  )
}

export default function ApuracaoPage() {
  return (
    <Suspense>
      <Painel />
    </Suspense>
  )
}
