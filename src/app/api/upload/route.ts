import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'

// Upload simples: o arquivo é enviado como base64 e salvo como link externo
// Para produção real use Vercel Blob, S3 ou similar
// Por ora retornamos uma URL de dados para demonstração
export async function POST(request: NextRequest) {
  await requireSession()

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'Arquivo muito grande (máx 10MB)' }, { status: 400 })
  }

  // Converte para base64 data URL para armazenar (funciona para PDFs e imagens pequenas)
  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mimeType = file.type || 'application/octet-stream'
  const dataUrl = `data:${mimeType};base64,${base64}`

  return NextResponse.json({
    url: dataUrl,
    name: file.name,
    size: file.size,
    type: file.type,
  })
}
