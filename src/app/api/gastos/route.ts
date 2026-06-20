import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth'

export async function GET() {
  await requireSession()
  const expenses = await prisma.expense.findMany({
    orderBy: { date: 'desc' },
    include: {
      user: { select: { name: true } },
      stage: { select: { title: true } },
    },
  })
  return NextResponse.json(expenses)
}

export async function POST(request: NextRequest) {
  const session = await requireSession()
  const data = await request.json()
  const expense = await prisma.expense.create({
    data: {
      description: data.description,
      value: Number(data.value),
      category: data.category,
      date: new Date(data.date),
      receiptUrl: data.receiptUrl,
      notes: data.notes,
      stageId: data.stageId || null,
      userId: session.userId,
    },
    include: {
      user: { select: { name: true } },
      stage: { select: { title: true } },
    },
  })
  return NextResponse.json(expense, { status: 201 })
}
