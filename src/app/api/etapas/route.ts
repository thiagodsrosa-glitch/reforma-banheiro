import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession, requireAdmin } from '@/lib/auth'

export async function GET() {
  await requireSession()
  const stages = await prisma.stage.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { budgets: true, expenses: true, updates: true } },
      expenses: { select: { value: true } },
    },
  })
  return NextResponse.json(stages)
}

export async function POST(request: NextRequest) {
  await requireAdmin()
  const data = await request.json()
  const stage = await prisma.stage.create({
    data: {
      title: data.title,
      description: data.description,
      order: data.order,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  })
  return NextResponse.json(stage, { status: 201 })
}
