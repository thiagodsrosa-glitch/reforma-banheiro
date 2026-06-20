import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession()
  const { id } = await params
  const { content } = await request.json()

  const update = await prisma.stageUpdate.create({
    data: { content, stageId: id, userId: session.userId },
    include: { user: { select: { name: true } } },
  })
  return NextResponse.json(update, { status: 201 })
}
