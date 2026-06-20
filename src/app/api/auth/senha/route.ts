import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const session = await requireSession()
  const { senhaAtual, novaSenha } = await request.json()

  if (!senhaAtual || !novaSenha) {
    return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 })
  }
  if (novaSenha.length < 6) {
    return NextResponse.json({ error: 'A nova senha deve ter ao menos 6 caracteres' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const valid = await bcrypt.compare(senhaAtual, user.password)
  if (!valid) return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 401 })

  const hashed = await bcrypt.hash(novaSenha, 12)
  await prisma.user.update({ where: { id: session.userId }, data: { password: hashed } })

  return NextResponse.json({ ok: true })
}
