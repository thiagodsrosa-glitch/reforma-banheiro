import { NextRequest, NextResponse } from 'next/server'
import { apuracaoDemo, buscarApuracao } from '@/lib/tse'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('demo') === '1') {
    return NextResponse.json(apuracaoDemo())
  }
  try {
    return NextResponse.json(await buscarApuracao(1))
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Falha ao consultar o TSE'
    return NextResponse.json({ error }, { status: 502 })
  }
}
