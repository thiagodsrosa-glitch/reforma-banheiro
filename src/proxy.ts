import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const publicPaths = ['/login', '/api/auth/login']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/whatsapp')) {
    const apiKey = request.headers.get('x-api-key')
    if (apiKey === process.env.WHATSAPP_BOT_API_KEY) return NextResponse.next()
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const token = request.cookies.get('session')?.value
  const session = token ? await verifyToken(token) : null

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/dashboard') && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/equipe', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
