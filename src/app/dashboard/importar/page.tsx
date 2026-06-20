'use client'

import { useState } from 'react'

interface Resultado {
  id: string
  acao: string
  resumo: string
  confianca?: number
}

const ACOES: Record<string, { label: string; cor: string }> = {
  orcamento_criado: { label: 'Orçamento criado', cor: 'text-green-700 bg-green-50' },
  gasto_criado: { label: 'Gasto registrado', cor: 'text-blue-700 bg-blue-50' },
  etapa_atualizada: { label: 'Etapa atualizada', cor: 'text-purple-700 bg-purple-50' },
  salvo_sem_acao: { label: 'Salvo (sem dados extraídos)', cor: 'text-gray-500 bg-gray-50' },
  outro: { label: 'Sem ação', cor: 'text-gray-400 bg-gray-50' },
}

export default function ImportarPage() {
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultados, setResultados] = useState<Resultado[] | null>(null)
  const [erro, setErro] = useState('')

  function parsearMensagens(raw: string) {
    // Mantém quebras de linha internas preservando o conteúdo real
    const linhas = raw.split('\n')
    const msgs: { sender: string; content: string; sentAt?: string }[] = []

    // Formato WhatsApp: DD/MM/YYYY HH:MM - Nome: mensagem
    // Também aceita: [DD/MM/YYYY, HH:MM:SS] Nome: mensagem
    const regexWA = /^\[?(\d{2}\/\d{2}\/\d{4})[,\s]+(\d{2}:\d{2}(?::\d{2})?)\]?\s*[-–]\s*(.+?):\s*(.+)/
    const regexCustom = /^([^:]{2,50}):\s*(.+)/

    let msgAtual: { sender: string; content: string; sentAt?: string } | null = null

    for (const linha of linhas) {
      const linhaTrimmed = linha.trim()

      const m1 = linhaTrimmed.match(regexWA)
      if (m1) {
        if (msgAtual) msgs.push(msgAtual)
        const [, dia, hora, nome, conteudo] = m1
        const [d, mes, ano] = dia.split('/')
        msgAtual = {
          sender: nome.trim(),
          content: conteudo.trim(),
          sentAt: `${ano}-${mes}-${d}T${hora.length === 5 ? hora + ':00' : hora}`,
        }
        continue
      }

      // Linha de sistema do WhatsApp (ignora)
      if (/^(As mensagens|Você foi|Este chat|Mensagens e chamadas)/.test(linhaTrimmed)) continue

      // Continuação da mensagem anterior (inclui linhas em branco como quebra)
      if (msgAtual) {
        if (linhaTrimmed === '') {
          msgAtual.content += '\n'
        } else {
          // Tenta detectar se é uma nova mensagem sem timestamp (formato Nome: msg)
          const m2 = linhaTrimmed.match(regexCustom)
          if (m2 && !msgAtual.content.endsWith('\n')) {
            // Linha curta sem contexto — provavelmente nova mensagem do mesmo remetente
            msgs.push(msgAtual)
            msgAtual = { sender: m2[1].trim(), content: m2[2].trim(), sentAt: msgAtual.sentAt }
          } else {
            msgAtual.content += (msgAtual.content.endsWith('\n') ? '' : ' ') + linhaTrimmed
          }
        }
      }
    }
    if (msgAtual) msgs.push(msgAtual)

    // Agrupa mensagens consecutivas do mesmo remetente em até 5 minutos
    const agrupadas: { sender: string; content: string; sentAt?: string }[] = []
    for (const msg of msgs) {
      const ultima = agrupadas[agrupadas.length - 1]
      const mesmaPessoa = ultima && ultima.sender === msg.sender
      const dentroJanela = mesmaPessoa && ultima.sentAt && msg.sentAt &&
        Math.abs(new Date(msg.sentAt).getTime() - new Date(ultima.sentAt).getTime()) < 5 * 60 * 1000

      if (dentroJanela) {
        ultima.content += '\n' + msg.content.trim()
      } else if (msg.content.trim()) {
        agrupadas.push({ ...msg, content: msg.content.trim() })
      }
    }
    return agrupadas
  }

  async function handleImportar() {
    setErro('')
    setResultados(null)
    const mensagens = parsearMensagens(texto)
    if (mensagens.length === 0) {
      setErro('Não foi possível identificar mensagens. Verifique o formato.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagens }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResultados(data.resultados)
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao processar')
    } finally {
      setLoading(false)
    }
  }

  const msgsParsed = texto ? parsearMensagens(texto).length : 0

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importar Histórico do WhatsApp</h1>
        <p className="text-gray-500 text-sm mt-1">
          A IA vai analisar as mensagens e criar orçamentos, gastos e atualizações de etapas automaticamente.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-1">
        <p className="font-semibold">Como exportar o histórico do WhatsApp:</p>
        <ol className="list-decimal list-inside space-y-0.5 text-blue-700">
          <li>Abra o grupo <strong>Reforma Matriz</strong> no WhatsApp</li>
          <li>Toque nos três pontinhos → <strong>Mais</strong> → <strong>Exportar conversa</strong></li>
          <li>Escolha <strong>Sem mídia</strong></li>
          <li>Copie o conteúdo do arquivo .txt e cole abaixo</li>
        </ol>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cole o histórico do WhatsApp aqui
        </label>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={12}
          placeholder={`Exemplo de formato aceito:
[01/06/2024, 14:32:15] João Silva: Recebi orçamento do azulejo por R$ 3.500
[01/06/2024, 14:45:00] Felipe: Pode aprovar, vamos em frente
[02/06/2024, 09:12:33] Maria: Pagamos o pedreiro hoje, R$ 800,00`}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        {texto && (
          <p className="text-xs text-gray-500 mt-1">
            {msgsParsed} mensagem(ns) identificada(s) para processar
          </p>
        )}
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {erro}
        </div>
      )}

      <button
        onClick={handleImportar}
        disabled={!texto.trim() || loading || msgsParsed === 0}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Processando {msgsParsed} mensagem(ns) com IA...
          </>
        ) : (
          `Processar ${msgsParsed} mensagem(ns) com IA`
        )}
      </button>

      {resultados && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900">
            Resultado: {resultados.filter((r) => r.acao !== 'salvo_sem_acao').length} registro(s) criado(s)
          </h2>
          <div className="space-y-2">
            {resultados.map((r, i) => {
              const info = ACOES[r.acao] ?? ACOES.outro
              return (
                <div key={i} className="bg-white border border-gray-100 rounded-lg p-3 flex items-start gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${info.cor}`}>
                    {info.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{r.resumo}</p>
                    {r.confianca && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Confiança da IA: {Math.round(r.confianca * 100)}%
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
