import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession, requireAdmin } from '@/lib/auth'
import { enviarMensagemGrupo } from '@/lib/zapi'

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

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

  let statusChanged = false
  let newStatus: string | undefined

  if (data.status !== undefined) {
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Apenas admin pode alterar status' }, { status: 403 })
    }
    updateData.status = data.status
    newStatus = data.status
    statusChanged = true
    if (data.status === 'APPROVED' || data.status === 'REJECTED') {
      updateData.approvedByName = session.name
      updateData.approvedAt = new Date()
    }
  }

  const budget = await prisma.budget.update({ where: { id }, data: updateData })

  // Notificação WhatsApp ao aprovar/rejeitar
  if (statusChanged && (newStatus === 'APPROVED' || newStatus === 'REJECTED')) {
    const emoji = newStatus === 'APPROVED' ? '✅' : '❌'
    const acao = newStatus === 'APPROVED' ? 'APROVADO' : 'REJEITADO'
    const msg =
      `${emoji} Orçamento ${acao} por ${session.name}\n` +
      `📋 *${budget.description}*\n` +
      `🏢 Fornecedor: ${budget.supplier}\n` +
      `💰 Valor: ${fmt(budget.value)}\n` +
      `🏷 Categoria: ${budget.category}`
    enviarMensagemGrupo(msg).catch(() => null)
  }

  return NextResponse.json(budget)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  await prisma.budget.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
