import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY?.replace(/^﻿/, '').trim()
  if (!key) throw new Error('ANTHROPIC_API_KEY não configurada')
  return new Anthropic({ apiKey: key })
}

export async function POST(request: NextRequest) {
  await requireAdmin()
  const { categoria, orcamentos } = await request.json()

  if (!orcamentos || orcamentos.length === 0) {
    return NextResponse.json({ error: 'Sem orçamentos' }, { status: 400 })
  }

  const anthropic = getClient()
  const lista = orcamentos.map((o: { supplier: string; description: string; value: number; status: string; notes?: string }, i: number) =>
    `${i + 1}. Fornecedor: ${o.supplier} | Descrição: ${o.description} | Valor: R$ ${o.value.toFixed(2)} | Status: ${o.status}${o.notes ? ` | Notas: ${o.notes}` : ''}`
  ).join('\n')

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Você é um consultor financeiro analisando orçamentos para a categoria "${categoria}" de uma reforma de banheiro de uma igreja.

ORÇAMENTOS DISPONÍVEIS:
${lista}

Analise estes orçamentos e forneça:
1. Qual é a MELHOR OPÇÃO considerando menor preço e custo-benefício
2. Quanto se economiza escolhendo a opção mais barata vs a mais cara
3. Se houver apenas um orçamento, sugira pedir mais cotações

Responda em JSON com este formato exato:
{
  "melhorOpcao": "nome do fornecedor ou descrição",
  "indice": número do item na lista (1, 2, 3...),
  "valorMelhor": valor numérico,
  "economia": valor da economia vs mais caro,
  "percentualEconomia": porcentagem de economia,
  "justificativa": "explicação em 1-2 frases simples",
  "alerta": "aviso importante se houver (ex: diferença pequena, pedir mais cotações) ou null"
}`
    }]
  })

  const text = response.content.find(b => b.type === 'text')?.text ?? ''
  const json = text.match(/\{[\s\S]*\}/)?.[0]
  if (!json) return NextResponse.json({ error: 'Erro ao processar resposta da IA' }, { status: 500 })

  return NextResponse.json(JSON.parse(json))
}
