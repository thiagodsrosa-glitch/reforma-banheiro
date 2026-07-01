import { prisma } from '@/lib/prisma'
import WhatsAppFeed from '@/components/WhatsAppFeed'

export const dynamic = 'force-dynamic'

export default async function WhatsAppPage() {
  try {
    const raw = await prisma.whatsAppMessage.findMany({
      orderBy: { sentAt: 'desc' },
      take: 100,
    })
    const messages = raw.map((m) => ({
      id: m.id,
      sender: m.sender,
      content: m.content,
      mediaUrl: m.mediaUrl,
      msgType: m.msgType,
      processed: m.processed,
      sentAt: (m.sentAt instanceof Date && !isNaN(m.sentAt.getTime()))
        ? m.sentAt.toISOString()
        : new Date().toISOString(),
    }))
    return <WhatsAppFeed messages={messages} />
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Mensagens do WhatsApp</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="font-semibold text-red-700 mb-2">Erro ao carregar mensagens</p>
          <pre className="text-xs text-red-600 whitespace-pre-wrap">{msg}</pre>
          <p className="text-sm text-red-500 mt-3">Tente recarregar a página. Se persistir, verifique a conexão com o banco de dados.</p>
        </div>
      </div>
    )
  }
}
