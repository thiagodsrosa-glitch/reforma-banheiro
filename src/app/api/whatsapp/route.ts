import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeWhatsAppMessage } from '@/lib/ai'
import { transcribeAudio } from '@/lib/transcription'

// Aceita formato interno (bot próprio) e formato Z-API
export async function POST(request: NextRequest) {
  const body = await request.json()

  // Ignora eventos que não são mensagens de grupo (Z-API)
  if (body.isGroup === false) return NextResponse.json({ ok: true })
  if (body.fromMe === true) return NextResponse.json({ ok: true })

  // Filtra apenas o grupo da reforma
  const GRUPO_NOME = process.env.WHATSAPP_GROUP_NAME ?? 'Reforma Matriz'
  if (body.chatName && !body.chatName.includes(GRUPO_NOME)) {
    return NextResponse.json({ ok: true, ignored: 'outro grupo' })
  }

  let sender: string
  let content: string
  let mediaUrl: string | null = null
  let msgType = 'text'
  let sentAt: Date

  if (body.senderName !== undefined) {
    // Formato Z-API
    sender = body.senderName || body.senderPhone || 'Desconhecido'
    content =
      body.text?.message ||
      body.image?.caption ||
      body.video?.caption ||
      body.audio?.caption ||
      body.document?.fileName ||
      `[${body.type ?? 'mídia'}]`
    mediaUrl = body.image?.imageUrl || body.video?.videoUrl || body.document?.documentUrl || null
    msgType = body.text ? 'text' : body.image ? 'image' : body.video ? 'video' : body.document ? 'document' : 'other'
    sentAt = body.momment ? new Date(body.momment * 1000) : new Date()
  } else {
    // Formato interno
    sender = body.sender
    content = body.content
    mediaUrl = body.mediaUrl ?? null
    msgType = body.msgType ?? 'text'
    sentAt = body.sentAt ? new Date(body.sentAt) : new Date()
  }

  if (!sender || !content) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  // Salva a mensagem bruta
  const message = await prisma.whatsAppMessage.create({
    data: { sender, content, mediaUrl, msgType, sentAt },
  })

  // Processa com IA em segundo plano (sem bloquear a resposta ao Z-API)
  processWithAI({ sender, content, mediaUrl, msgType }).catch(console.error)

  return NextResponse.json(message, { status: 201 })
}

async function processWithAI({
  sender,
  content,
  mediaUrl,
  msgType,
}: {
  sender: string
  content: string
  mediaUrl: string | null
  msgType: string
}) {
  const imageUrl = msgType === 'image' ? mediaUrl : null
  const pdfUrl = msgType === 'document' && mediaUrl?.toLowerCase().endsWith('.pdf') ? mediaUrl : null

  // Transcreve áudio com Whisper antes de enviar ao Claude
  let conteudoFinal = content
  if (msgType === 'audio' && mediaUrl) {
    const transcricao = await transcribeAudio(mediaUrl)
    if (transcricao) {
      conteudoFinal = `[Áudio transcrito] ${transcricao}`
      // Atualiza a mensagem salva com o texto transcrito
      await prisma.whatsAppMessage.updateMany({
        where: { sender, content, msgType: 'audio' },
        data: { content: conteudoFinal },
      })
    }
  }

  const analysis = await analyzeWhatsAppMessage({ sender, content: conteudoFinal, imageUrl, pdfUrl })
  if (!analysis || analysis.confianca < 0.4 || analysis.tipo === 'outro') return

  // Encontra a etapa correspondente
  let stageId: string | null = null
  if (analysis.etapa) {
    const stage = await prisma.stage.findFirst({
      where: { title: { contains: analysis.etapa, mode: 'insensitive' } },
    })
    stageId = stage?.id ?? null
  }

  // Usuário padrão para ações automáticas (primeiro admin)
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  if (!admin) return

  if (analysis.tipo === 'orcamento') {
    await prisma.budget.create({
      data: {
        supplier: analysis.fornecedor ?? sender,
        description: analysis.descricao,
        value: analysis.valor ?? 0,
        category: analysis.categoria ?? 'Outro',
        status: analysis.status_orcamento ?? 'PENDING',
        notes: `[IA ${Math.round(analysis.confianca * 100)}%] ${analysis.resumo}`,
        stageId,
        userId: admin.id,
      },
    })
  } else if (analysis.tipo === 'gasto' || analysis.tipo === 'pagamento') {
    await prisma.expense.create({
      data: {
        description: analysis.descricao,
        value: analysis.valor ?? 0,
        category: analysis.categoria ?? 'Outro',
        date: new Date(),
        notes: `[IA ${Math.round(analysis.confianca * 100)}%] ${analysis.resumo} — Enviado por: ${sender}`,
        receiptUrl: mediaUrl,
        stageId,
        userId: admin.id,
      },
    })
  } else if (analysis.tipo === 'atualizacao_etapa' && stageId) {
    await prisma.stageUpdate.create({
      data: {
        content: `[Z-API] ${sender}: ${analysis.resumo}`,
        stageId,
        userId: admin.id,
      },
    })
  }
}

export async function GET() {
  const messages = await prisma.whatsAppMessage.findMany({
    orderBy: { sentAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(messages)
}
