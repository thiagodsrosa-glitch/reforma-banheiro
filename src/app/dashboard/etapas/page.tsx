import { prisma } from '@/lib/prisma'
import EtapasAdmin from '@/components/EtapasAdmin'

export default async function EtapasAdminPage() {
  const stages = await prisma.stage.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { budgets: true, expenses: true, updates: true } },
    },
  })
  return <EtapasAdmin stages={stages} />
}
