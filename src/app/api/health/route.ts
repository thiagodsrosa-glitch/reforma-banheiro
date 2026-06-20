import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const count = await prisma.user.count()
    return NextResponse.json({ ok: true, users: count, env: !!process.env.DATABASE_URL })
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: e.message,
      code: e.code,
      meta: e.meta,
      type: e.constructor?.name,
    }, { status: 500 })
  }
}
