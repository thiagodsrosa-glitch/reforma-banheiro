import { prisma } from '@/lib/prisma'
import EtapasEquipe from '@/components/EtapasEquipe'

export default async function EtapasEquipePage() {
  const stages = await prisma.stage.findMany({
    orderBy: { order: 'asc' },
    include: {
      updates: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })
  return <EtapasEquipe stages={stages} />
}
