import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth'

export async function GET() {
  await requireSession()
  const budgets = await prisma.budget.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true } },
      stage: { select: { title: true } },
    },
  })
  return NextResponse.json(budgets)
}

export async function POST(request: NextRequest) {
  const session = await requireSession()
  const data = await request.json()
  const budget = await prisma.budget.create({
    data: {
      supplier: data.supplier,
      description: data.description,
      value: Number(data.value),
      category: data.category,
      fileUrl: data.fileUrl,
      notes: data.notes,
      hasContract: data.hasContract ?? false,
      hasEPI: data.hasEPI ?? false,
      stageId: data.stageId || null,
      userId: session.userId,
    },
    include: {
      user: { select: { name: true } },
      stage: { select: { title: true } },
    },
  })
  return NextResponse.json(budget, { status: 201 })
}
