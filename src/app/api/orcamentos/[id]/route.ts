import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession, requireAdmin } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession()
  const { id } = await params
  const data = await request.json()

  // Only admin can change status
  const updateData: Record<string, unknown> = {
    supplier: data.supplier,
    description: data.description,
    value: data.value !== undefined ? Number(data.value) : undefined,
    category: data.category,
    fileUrl: data.fileUrl,
    notes: data.notes,
  }

  if (data.status !== undefined) {
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Apenas admin pode alterar status' }, { status: 403 })
    }
    updateData.status = data.status
    if (data.status === 'APPROVED' || data.status === 'REJECTED') {
      updateData.approvedByName = session.name
      updateData.approvedAt = new Date()
    }
  }

  const budget = await prisma.budget.update({ where: { id }, data: updateData })
  return NextResponse.json(budget)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  await prisma.budget.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
