import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { analyzeWhatsAppMessage } from '@/lib/ai'
import { transcribeAudio } from '@/lib/transcription'

// Processa mensagens históricas coladas pelo administrador
export async function POST(request: NextRequest) {
  await requireAdmin()
  const { mensagens } = await request.json()

  if (!Array.isArray(mensagens) || mensagens.length === 0) {
    return NextResponse.json({ error: 'Lista de mensagens vazia' }, { status: 400 })
  }

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  if (!admin) return NextResponse.json({ error: 'Admin não encontrado' }, { status: 500 })

  const resultados = []

  for (const msg of mensagens as { sender: string; content: string; sentAt?: string }[]) {
    if (!msg.sender || !msg.content) continue

    // Salva a mensagem bruta
    const saved = await prisma.whatsAppMessage.create({
      data: {
        sender: msg.sender,
        content: msg.content,
        sentAt: msg.sentAt ? new Date(msg.sentAt) : new Date(),
        processed: false,
      },
    })

    // Analisa com IA
    const analysis = await analyzeWhatsAppMessage({ sender: msg.sender, content: msg.content })

    if (!analysis || analysis.confianca < 0.6 || analysis.tipo === 'outro') {
      resultados.push({ id: saved.id, acao: 'salvo_sem_acao', resumo: 'Conteúdo não identificado como dado relevante' })
      continue
    }

    let stageId: string | null = null
    if (analysis.etapa) {
      const stage = await prisma.stage.findFirst({
        where: { title: { contains: analysis.etapa, mode: 'insensitive' } },
      })
      stageId = stage?.id ?? null
    }

    let acao = 'outro'

    if (analysis.tipo === 'orcamento') {
      await prisma.budget.create({
        data: {
          supplier: analysis.fornecedor ?? msg.sender,
          description: analysis.descricao,
          value: analysis.valor ?? 0,
          category: analysis.categoria ?? 'Outro',
          status: analysis.status_orcamento ?? 'PENDING',
          notes: `[Histórico IA ${Math.round(analysis.confianca * 100)}%] ${analysis.resumo}`,
          stageId,
          userId: admin.id,
        },
      })
      acao = 'orcamento_criado'
    } else if (analysis.tipo === 'gasto' || analysis.tipo === 'pagamento') {
      await prisma.expense.create({
        data: {
          description: analysis.descricao,
          value: analysis.valor ?? 0,
          category: analysis.categoria ?? 'Outro',
          date: msg.sentAt ? new Date(msg.sentAt) : new Date(),
          notes: `[Histórico IA ${Math.round(analysis.confianca * 100)}%] Enviado por: ${msg.sender}`,
          stageId,
          userId: admin.id,
        },
      })
      acao = 'gasto_criado'
    } else if (analysis.tipo === 'atualizacao_etapa' && stageId) {
      await prisma.stageUpdate.create({
        data: {
          content: `[Histórico] ${msg.sender}: ${analysis.resumo}`,
          stageId,
          userId: admin.id,
        },
      })
      acao = 'etapa_atualizada'
    }

    await prisma.whatsAppMessage.update({ where: { id: saved.id }, data: { processed: true } })
    resultados.push({ id: saved.id, acao, resumo: analysis.resumo, confianca: analysis.confianca })
  }

  return NextResponse.json({ processadas: resultados.length, resultados })
}
