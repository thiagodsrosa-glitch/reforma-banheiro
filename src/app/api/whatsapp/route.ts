import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    // Formato interno / Evolution API
    sender = body.sender
    content = body.content
    mediaUrl = body.mediaUrl ?? null
    msgType = body.msgType ?? 'text'
    sentAt = body.sentAt ? new Date(body.sentAt) : new Date()
  }

  if (!sender || !content) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const message = await prisma.whatsAppMessage.create({
    data: { sender, content, mediaUrl, msgType, sentAt },
  })
  return NextResponse.json(message, { status: 201 })
}

export async function GET() {
  const messages = await prisma.whatsAppMessage.findMany({
    orderBy: { sentAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(messages)
}
