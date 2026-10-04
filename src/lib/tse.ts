// Leitura dos resultados oficiais de apuração do TSE (resultados.tse.jus.br)
// Arquivos "dados-simplificados": {base}/{ciclo}/{eleicao}/dados-simplificados/{abr}/{abr}-c{cargo}-e{eleicao}-r.json

const TSE_BASE = process.env.TSE_BASE_URL ?? 'https://resultados.tse.jus.br/oficial'
const TSE_CICLO = process.env.TSE_CICLO ?? 'ele2026'

export type Abrangencia = 'br' | 'zz'

export const ABRANGENCIAS: { cd: Abrangencia; nome: string }[] = [
  { cd: 'br', nome: 'Brasil' },
  { cd: 'zz', nome: 'Exterior' },
]

export interface Candidato {
  numero: string
  nome: string
  partido: string
  votos: number
  percentual: number
  situacao: string
  eleito: boolean
}

export interface Apuracao {
  abrangencia: Abrangencia
  nome: string
  secoesTotal: number
  secoesTotalizadas: number
  percentualSecoes: number
  eleitorado: number
  comparecimento: number
  percentualComparecimento: number
  abstencao: number
  percentualAbstencao: number
  brancos: number
  percentualBrancos: number
  nulos: number
  percentualNulos: number
  validos: number
  atualizadoEm: string | null
  candidatos: Candidato[]
}

export interface ResultadoApuracao {
  eleicao: string
  ciclo: string
  demo: boolean
  geradoEm: string
  regioes: (Apuracao | { abrangencia: Abrangencia; nome: string; erro: string })[]
}

const num = (v: unknown) => {
  if (v === undefined || v === null || v === '') return 0
  const n = Number(String(v).replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

const pad = (n: string | number, len: number) => String(n).padStart(len, '0')

// JSON bruto do TSE (campos abreviados, valores numéricos como string)
type Json = Record<string, unknown>

async function fetchJson(url: string): Promise<Json> {
  const res = await fetch(url, { next: { revalidate: 20 } })
  if (!res.ok) throw new Error(`TSE respondeu ${res.status}`)
  return res.json()
}

// Descobre o código da eleição federal (1º turno, ou o turno mais recente já realizado)
// a partir do arquivo de configuração do TSE. Pode ser fixado com TSE_ELEICAO.
async function descobrirEleicao(): Promise<string> {
  if (process.env.TSE_ELEICAO) return process.env.TSE_ELEICAO

  const config = await fetchJson(`${TSE_BASE}/comum/config/ele-c.json`)
  const candidatas: { cd: string; turno: number }[] = []

  const visitar = (valor: unknown): void => {
    if (Array.isArray(valor)) return valor.forEach(visitar)
    if (!valor || typeof valor !== 'object') return
    const no = valor as Json
    const nome = String(no.nm ?? no.ds ?? '')
    if (no.cd && /federal/i.test(nome)) {
      candidatas.push({ cd: String(no.cd), turno: num(no.t ?? no.tp ?? 1) })
    }
    Object.values(no).forEach(visitar)
  }
  visitar(config)

  if (candidatas.length === 0) {
    throw new Error('Eleição federal não encontrada na configuração do TSE. Defina TSE_ELEICAO.')
  }
  // Prioriza o maior turno (2º turno, quando já existir), depois o maior código
  candidatas.sort((a, b) => b.turno - a.turno || num(b.cd) - num(a.cd))
  return candidatas[0].cd
}

function normalizar(abrangencia: Abrangencia, nome: string, d: Json): Apuracao {
  const candidatos: Candidato[] = ((d.cand as Json[] | undefined) ?? [])
    .map((c) => ({
      numero: String(c.n ?? ''),
      nome: String(c.nm ?? ''),
      partido: String(c.cc ?? ''),
      votos: num(c.vap),
      percentual: num(c.pvap),
      situacao: String(c.st ?? ''),
      eleito: c.e === 's',
    }))
    .sort((a, b) => b.votos - a.votos)

  const data = d.dt || d.dg
  const hora = d.ht || d.hg
  let atualizadoEm: string | null = null
  if (data && hora) {
    const [dia, mes, ano] = String(data).split('/')
    atualizadoEm = `${ano}-${mes}-${dia}T${hora}-03:00`
  }

  return {
    abrangencia,
    nome,
    secoesTotal: num(d.s),
    secoesTotalizadas: num(d.st),
    percentualSecoes: num(d.pst),
    eleitorado: num(d.e),
    comparecimento: num(d.c),
    percentualComparecimento: num(d.pc),
    abstencao: num(d.a),
    percentualAbstencao: num(d.pa),
    brancos: num(d.vb),
    percentualBrancos: num(d.pvb),
    nulos: num(d.tvn ?? d.vn),
    percentualNulos: num(d.ptvn ?? d.pvn),
    validos: num(d.vv) || candidatos.reduce((s, c) => s + c.votos, 0),
    atualizadoEm,
    candidatos,
  }
}

export async function buscarApuracao(cargo = 1): Promise<ResultadoApuracao> {
  const eleicao = await descobrirEleicao()
  const cdCargo = pad(cargo, 4)
  const cdEleicao = pad(eleicao, 6)

  const regioes = await Promise.all(
    ABRANGENCIAS.map(async ({ cd, nome }) => {
      const url = `${TSE_BASE}/${TSE_CICLO}/${eleicao}/dados-simplificados/${cd}/${cd}-c${cdCargo}-e${cdEleicao}-r.json`
      try {
        return normalizar(cd, nome, await fetchJson(url))
      } catch (e) {
        return { abrangencia: cd, nome, erro: e instanceof Error ? e.message : 'Falha ao consultar o TSE' }
      }
    }),
  )

  return { eleicao, ciclo: TSE_CICLO, demo: false, geradoEm: new Date().toISOString(), regioes }
}

// Dados fictícios para testar o layout sem acesso ao TSE (?demo=1)
export function apuracaoDemo(): ResultadoApuracao {
  const progresso = Math.min(100, ((Date.now() / 1000) % 600) / 6) // avança a cada 10 min
  const base = [
    { numero: '13', nome: 'CANDIDATO A', partido: 'PARTIDO A', peso: 0.47 },
    { numero: '22', nome: 'CANDIDATO B', partido: 'PARTIDO B', peso: 0.43 },
    { numero: '12', nome: 'CANDIDATO C', partido: 'PARTIDO C', peso: 0.05 },
    { numero: '15', nome: 'CANDIDATO D', partido: 'PARTIDO D', peso: 0.03 },
    { numero: '30', nome: 'CANDIDATO E', partido: 'PARTIDO E', peso: 0.02 },
  ]
  const gerar = (abrangencia: Abrangencia, nome: string, eleitorado: number, secoes: number, inverte: boolean): Apuracao => {
    const p = abrangencia === 'zz' ? Math.min(100, progresso * 1.4) : progresso
    const comparecimento = Math.round(eleitorado * 0.79 * (p / 100))
    const validos = Math.round(comparecimento * 0.95)
    const candidatos = base
      .map((c, i) => {
        const peso = inverte && i < 2 ? base[1 - i].peso : c.peso
        const votos = Math.round(validos * peso)
        return { numero: c.numero, nome: c.nome, partido: c.partido, votos, percentual: validos ? (votos / validos) * 100 : 0, situacao: '', eleito: false }
      })
      .sort((a, b) => b.votos - a.votos)
    return {
      abrangencia, nome,
      secoesTotal: secoes,
      secoesTotalizadas: Math.round((secoes * p) / 100),
      percentualSecoes: p,
      eleitorado,
      comparecimento,
      percentualComparecimento: (comparecimento / eleitorado) * 100,
      abstencao: Math.round(eleitorado * (p / 100)) - comparecimento,
      percentualAbstencao: 21,
      brancos: Math.round(comparecimento * 0.02),
      percentualBrancos: 2,
      nulos: Math.round(comparecimento * 0.03),
      percentualNulos: 3,
      validos,
      atualizadoEm: new Date().toISOString(),
      candidatos,
    }
  }
  return {
    eleicao: 'demo',
    ciclo: TSE_CICLO,
    demo: true,
    geradoEm: new Date().toISOString(),
    regioes: [gerar('br', 'Brasil', 156_000_000, 472_000, false), gerar('zz', 'Exterior', 700_000, 2_000, true)],
  }
}
