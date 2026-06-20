import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const url = process.env.DATABASE_URL ?? 'NAO_DEFINIDO'
  // Extrai só o host para debug (sem expor senha)
  const urlPrefix = url.slice(0, 20).replace(/:[^@]+@/, ':***@') // safe preview
  let hostInfo = 'desconhecido'
  try {
    const u = new URL(url)
    hostInfo = `${u.hostname}:${u.port || '5432'}/${u.pathname.slice(1)}`
  } catch (parseErr: any) { hostInfo = `parse_error: ${parseErr.message?.slice(0, 50)}` }

  try {
    const count = await prisma.user.count()
    return NextResponse.json({ ok: true, users: count, host: hostInfo, urlPrefix })
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      host: hostInfo,
      urlDefined: url !== 'NAO_DEFINIDO',
      error: e.message?.slice(0, 200),
      code: e.code,
      urlPrefix,
    }, { status: 500 })
  }
}
