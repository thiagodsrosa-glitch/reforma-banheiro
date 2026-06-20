import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const { sender, content, mediaUrl, msgType, sentAt } = await request.json()

  if (!sender || !content) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const message = await prisma.whatsAppMessage.create({
    data: {
      sender,
      content,
      mediaUrl: mediaUrl ?? null,
      msgType: msgType ?? 'text',
      sentAt: sentAt ? new Date(sentAt) : new Date(),
    },
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
