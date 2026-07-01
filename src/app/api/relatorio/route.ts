import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
function fmtDate(d: Date | string | null) {
  if (!d) return ''
  const dt = d instanceof Date ? d : new Date(d)
  if (isNaN(dt.getTime())) return ''
  return dt.toLocaleDateString('pt-BR')
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const secoes = searchParams.get('secoes')?.split(',') ?? []
  const statusFiltro = searchParams.get('status') ?? 'todos'
  const categoriaFiltro = searchParams.get('categoria') ?? 'todas'

  const [stages, budgets, expenses] = await Promise.all([
    prisma.stage.findMany({ orderBy: { order: 'asc' } }),
    prisma.budget.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.expense.findMany({ orderBy: { date: 'desc' } }),
  ])

  const orcamentos = budgets.filter((b) => {
    if (statusFiltro !== 'todos' && b.status !== statusFiltro) return false
    if (categoriaFiltro !== 'todas' && b.category !== categoriaFiltro) return false
    return true
  })

  const gastos = expenses.filter((e) => {
    if (categoriaFiltro !== 'todas' && e.category !== categoriaFiltro) return false
    return true
  })

  const wb = XLSX.utils.book_new()

  if (secoes.includes('resumo')) {
    const totalOrcado = budgets.reduce((s, b) => s + b.value, 0)
    const totalAprovado = budgets.filter((b) => b.status === 'APPROVED').reduce((s, b) => s + b.value, 0)
    const totalGasto = expenses.reduce((s, e) => s + e.value, 0)
    const pendentes = budgets.filter((b) => b.status === 'PENDING').length
    const aprovados = budgets.filter((b) => b.status === 'APPROVED').length
    const rejeitados = budgets.filter((b) => b.status === 'REJECTED').length
    const concluidas = stages.filter((s) => s.status === 'COMPLETED').length
    const progresso = stages.length > 0
      ? Math.round(stages.reduce((s, st) => s + st.progress, 0) / stages.length)
      : 0

    const resumoData = [
      ['RESUMO EXECUTIVO – REFORMA BANHEIRO MASCULINO – IGREJA MATRIZ'],
      ['Gerado em:', new Date().toLocaleString('pt-BR')],
      [],
      ['FINANCEIRO'],
      ['Total orçado (todos)', fmt(totalOrcado)],
      ['Total orçado aprovado', fmt(totalAprovado)],
      ['Total gasto (realizado)', fmt(totalGasto)],
      ['Saldo (aprovado − gasto)', fmt(totalAprovado - totalGasto)],
      [],
      ['ORÇAMENTOS'],
      ['Pendentes', pendentes],
      ['Aprovados', aprovados],
      ['Rejeitados', rejeitados],
      ['Total', budgets.length],
      [],
      ['OBRA'],
      ['Progresso geral', `${progresso}%`],
      ['Etapas concluídas', `${concluidas} de ${stages.length}`],
    ]
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData)
    wsResumo['!cols'] = [{ wch: 35 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo')
  }

  if (secoes.includes('etapas')) {
    const etapasData = [
      ['ETAPAS DA REFORMA'],
      [],
      ['Ordem', 'Etapa', 'Status', 'Progresso (%)'],
      ...stages.map((s) => [
        s.order,
        s.title,
        s.status === 'COMPLETED' ? 'Concluída' : s.status === 'IN_PROGRESS' ? 'Em andamento' : 'Pendente',
        s.progress,
      ]),
    ]
    const wsEtapas = XLSX.utils.aoa_to_sheet(etapasData)
    wsEtapas['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 18 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, wsEtapas, 'Etapas')
  }

  if (secoes.includes('orcamentos')) {
    const orcData = [
      ['ORÇAMENTOS'],
      [],
      ['Data', 'Fornecedor', 'Descrição', 'Categoria', 'Valor', 'Status', 'Aprovado por', 'Data Aprovação'],
      ...orcamentos.map((b) => [
        fmtDate(b.createdAt),
        b.supplier,
        b.description,
        b.category,
        b.value,
        b.status === 'APPROVED' ? 'Aprovado' : b.status === 'REJECTED' ? 'Rejeitado' : 'Pendente',
        b.approvedByName ?? '',
        fmtDate(b.approvedAt),
      ]),
      [],
      ['TOTAL', '', '', '', orcamentos.reduce((s, b) => s + b.value, 0)],
    ]
    const wsOrc = XLSX.utils.aoa_to_sheet(orcData)
    wsOrc['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 40 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsOrc, 'Orçamentos')
  }

  if (secoes.includes('gastos')) {
    const gastosData = [
      ['GASTOS E PAGAMENTOS'],
      [],
      ['Data', 'Descrição', 'Categoria', 'Valor', 'Notas'],
      ...gastos.map((e) => [
        fmtDate(e.date),
        e.description,
        e.category,
        e.value,
        e.notes ?? '',
      ]),
      [],
      ['TOTAL', '', '', gastos.reduce((s, e) => s + e.value, 0)],
    ]
    const wsGastos = XLSX.utils.aoa_to_sheet(gastosData)
    wsGastos['!cols'] = [{ wch: 12 }, { wch: 38 }, { wch: 16 }, { wch: 14 }, { wch: 35 }]
    XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos')
  }

  if (secoes.includes('categorias')) {
    const cats = Array.from(new Set([
      ...budgets.map((b) => b.category),
      ...expenses.map((e) => e.category),
    ])).sort()

    const catData = [
      ['ANÁLISE POR CATEGORIA'],
      [],
      ['Categoria', 'Qtd Orçamentos', 'Total Orçado', 'Aprovado', 'Total Gasto', 'Saldo (Aprov − Gasto)'],
      ...cats.map((cat) => {
        const bs = budgets.filter((b) => b.category === cat)
        const es = expenses.filter((e) => e.category === cat)
        const totalOrc = bs.reduce((s, b) => s + b.value, 0)
        const aprovado = bs.filter((b) => b.status === 'APPROVED').reduce((s, b) => s + b.value, 0)
        const gasto = es.reduce((s, e) => s + e.value, 0)
        return [cat, bs.length, totalOrc, aprovado, gasto, aprovado - gasto]
      }),
    ]
    const wsCat = XLSX.utils.aoa_to_sheet(catData)
    wsCat['!cols'] = [{ wch: 18 }, { wch: 15 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsCat, 'Por Categoria')
  }

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="relatorio-reforma-${date}.xlsx"`,
    },
  })
}
