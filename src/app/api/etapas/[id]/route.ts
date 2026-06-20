import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession, requireAdmin } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireSession()
  const { id } = await params
  const stage = await prisma.stage.findUnique({
    where: { id },
    include: {
      updates: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
      budgets: { include: { user: { select: { name: true } } } },
      expenses: { include: { user: { select: { name: true } } } },
    },
  })
  if (!stage) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(stage)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireSession()
  const { id } = await params
  const data = await request.json()
  const stage = await prisma.stage.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      progress: data.progress !== undefined ? Number(data.progress) : undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  })
  return NextResponse.json(stage)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  await prisma.stage.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
