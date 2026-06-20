import { prisma } from '@/lib/prisma'
import WhatsAppFeed from '@/components/WhatsAppFeed'

export default async function WhatsAppPage() {
  const messages = await prisma.whatsAppMessage.findMany({
    orderBy: { sentAt: 'desc' },
    take: 100,
  })
  return <WhatsAppFeed messages={messages} />
}
