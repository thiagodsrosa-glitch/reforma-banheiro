import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  if (id === 'all') {
    const { count } = await prisma.whatsAppMessage.deleteMany()
    return NextResponse.json({ deleted: count })
  }
  await prisma.whatsAppMessage.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
