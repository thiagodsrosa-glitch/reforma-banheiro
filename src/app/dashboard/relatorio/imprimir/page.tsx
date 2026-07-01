import { prisma } from '@/lib/prisma'

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
function fmtDate(d: Date | null) {
  if (!d || isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

export default async function ImprimirPage({
  searchParams,
}: {
  searchParams: Promise<{ secoes?: string; status?: string; categoria?: string }>
}) {
  const params = await searchParams
  const secoes = params.secoes?.split(',') ?? []
  const statusFiltro = params.status ?? 'todos'
  const categoriaFiltro = params.categoria ?? 'todas'

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

  const totalOrcado = budgets.reduce((s, b) => s + b.value, 0)
  const totalAprovado = budgets.filter((b) => b.status === 'APPROVED').reduce((s, b) => s + b.value, 0)
  const totalGasto = expenses.reduce((s, e) => s + e.value, 0)
  const progresso = stages.length > 0
    ? Math.round(stages.reduce((s, st) => s + st.progress, 0) / stages.length)
    : 0

  const cats = Array.from(new Set([...budgets.map((b) => b.category), ...expenses.map((e) => e.category)])).sort()

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
        <title>Relatório – Reforma Banheiro Masculino</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: white; padding: 24px; }
          h1 { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
          .sub { color: #666; font-size: 11px; margin-bottom: 24px; }
          h2 { font-size: 14px; font-weight: bold; margin: 24px 0 10px; padding-bottom: 4px; border-bottom: 2px solid #1d4ed8; color: #1d4ed8; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          th { background: #1d4ed8; color: white; padding: 6px 8px; text-align: left; font-size: 11px; }
          td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
          tr:nth-child(even) td { background: #f9fafb; }
          .totais { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px; }
          .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
          .card .val { font-size: 16px; font-weight: bold; margin-top: 4px; }
          .card .lbl { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: bold; }
          .badge-pend { background: #fef3c7; color: #92400e; }
          .badge-aprov { background: #dcfce7; color: #166534; }
          .badge-rej { background: #fee2e2; color: #991b1b; }
          .right { text-align: right; }
          .print-btn { position: fixed; top: 16px; right: 16px; background: #1d4ed8; color: white; border: none; padding: 8px 18px; border-radius: 8px; cursor: pointer; font-size: 13px; }
          @media print { .print-btn { display: none; } body { padding: 0; } }
        `}</style>
      </head>
      <body>
        <button className="print-btn" onClick={() => window.print()}>🖨️ Imprimir / PDF</button>

        <h1>Relatório – Reforma Banheiro Masculino</h1>
        <p className="sub">Igreja Matriz IEADMS · Gerado em {new Date().toLocaleString('pt-BR')}</p>

        {secoes.includes('resumo') && (
          <>
            <h2>Resumo Executivo</h2>
            <div className="totais">
              <div className="card">
                <div className="lbl">Total Orçado</div>
                <div className="val">{fmt(totalOrcado)}</div>
              </div>
              <div className="card">
                <div className="lbl">Aprovado</div>
                <div className="val">{fmt(totalAprovado)}</div>
              </div>
              <div className="card">
                <div className="lbl">Total Gasto</div>
                <div className="val">{fmt(totalGasto)}</div>
              </div>
              <div className="card">
                <div className="lbl">Saldo</div>
                <div className="val" style={{ color: totalAprovado - totalGasto >= 0 ? '#16a34a' : '#dc2626' }}>
                  {fmt(totalAprovado - totalGasto)}
                </div>
              </div>
            </div>
            <table>
              <tbody>
                <tr><td>Progresso geral da obra</td><td className="right"><strong>{progresso}%</strong></td></tr>
                <tr><td>Etapas concluídas</td><td className="right">{stages.filter((s) => s.status === 'COMPLETED').length} de {stages.length}</td></tr>
                <tr><td>Orçamentos pendentes</td><td className="right">{budgets.filter((b) => b.status === 'PENDING').length}</td></tr>
                <tr><td>Orçamentos aprovados</td><td className="right">{budgets.filter((b) => b.status === 'APPROVED').length}</td></tr>
              </tbody>
            </table>
          </>
        )}

        {secoes.includes('etapas') && (
          <>
            <h2>Etapas da Reforma</h2>
            <table>
              <thead><tr><th>#</th><th>Etapa</th><th>Status</th><th className="right">Progresso</th></tr></thead>
              <tbody>
                {stages.map((s) => (
                  <tr key={s.id}>
                    <td>{s.order}</td>
                    <td>{s.title}</td>
                    <td>
                      {s.status === 'COMPLETED' ? 'Concluída' : s.status === 'IN_PROGRESS' ? 'Em andamento' : 'Pendente'}
                    </td>
                    <td className="right">{s.progress}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {secoes.includes('orcamentos') && (
          <>
            <h2>Orçamentos</h2>
            <table>
              <thead><tr><th>Data</th><th>Fornecedor</th><th>Descrição</th><th>Categoria</th><th className="right">Valor</th><th>Status</th></tr></thead>
              <tbody>
                {orcamentos.map((b) => (
                  <tr key={b.id}>
                    <td>{fmtDate(b.createdAt)}</td>
                    <td>{b.supplier}</td>
                    <td>{b.description}</td>
                    <td>{b.category}</td>
                    <td className="right">{fmt(b.value)}</td>
                    <td>
                      <span className={`badge ${b.status === 'APPROVED' ? 'badge-aprov' : b.status === 'REJECTED' ? 'badge-rej' : 'badge-pend'}`}>
                        {b.status === 'APPROVED' ? 'Aprovado' : b.status === 'REJECTED' ? 'Rejeitado' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={4}><strong>Total</strong></td>
                  <td className="right"><strong>{fmt(orcamentos.reduce((s, b) => s + b.value, 0))}</strong></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {secoes.includes('gastos') && (
          <>
            <h2>Gastos e Pagamentos</h2>
            <table>
              <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th className="right">Valor</th></tr></thead>
              <tbody>
                {gastos.map((e) => (
                  <tr key={e.id}>
                    <td>{fmtDate(e.date)}</td>
                    <td>{e.description}</td>
                    <td>{e.category}</td>
                    <td className="right">{fmt(e.value)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3}><strong>Total</strong></td>
                  <td className="right"><strong>{fmt(gastos.reduce((s, e) => s + e.value, 0))}</strong></td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {secoes.includes('categorias') && (
          <>
            <h2>Análise por Categoria</h2>
            <table>
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th className="right">Orçamentos</th>
                  <th className="right">Total Orçado</th>
                  <th className="right">Aprovado</th>
                  <th className="right">Gasto</th>
                  <th className="right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {cats.map((cat) => {
                  const bs = budgets.filter((b) => b.category === cat)
                  const es = expenses.filter((e) => e.category === cat)
                  const totalOrc = bs.reduce((s, b) => s + b.value, 0)
                  const aprovado = bs.filter((b) => b.status === 'APPROVED').reduce((s, b) => s + b.value, 0)
                  const gasto = es.reduce((s, e) => s + e.value, 0)
                  const saldo = aprovado - gasto
                  return (
                    <tr key={cat}>
                      <td>{cat}</td>
                      <td className="right">{bs.length}</td>
                      <td className="right">{fmt(totalOrc)}</td>
                      <td className="right">{fmt(aprovado)}</td>
                      <td className="right">{fmt(gasto)}</td>
                      <td className="right" style={{ color: saldo >= 0 ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                        {fmt(saldo)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}
      </body>
    </html>
  )
}
