import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const publicPaths = ['/login', '/api/auth/login', '/api/health', '/apresentacao', '/apuracao', '/api/apuracao']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Webhook do WhatsApp: aceita x-api-key (bot próprio) ou token Z-API no header
  if (pathname.startsWith('/api/whatsapp')) {
    const apiKey = request.headers.get('x-api-key')
    const zapiToken = request.headers.get('clienttoken')
    if (apiKey === process.env.WHATSAPP_BOT_API_KEY) return NextResponse.next()
    if (zapiToken === process.env.ZAPI_CLIENT_TOKEN) return NextResponse.next()
    // Z-API também pode chamar sem autenticação (validamos pelo formato do body)
    if (request.method === 'POST') return NextResponse.next()
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

  if (pathname.startsWith('/dashboard') && session.role !== 'ADMIN' && session.role !== 'OBSERVADOR') {
    return NextResponse.redirect(new URL('/equipe', request.url))
  }

  // OBSERVADOR só pode ver /dashboard (página principal), não subpáginas
  if (pathname.startsWith('/dashboard/') && session.role === 'OBSERVADOR') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Pagamentos: só TESOURARIA e ADMIN
  if (pathname.startsWith('/equipe/pagamentos') && session.role !== 'TESOURARIA' && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/equipe', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
