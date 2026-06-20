import { prisma } from '@/lib/prisma'
import OrcamentosEquipe from '@/components/OrcamentosEquipe'

export default async function OrcamentosEquipePage() {
  const [budgets, stages] = await Promise.all([
    prisma.budget.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        stage: { select: { title: true } },
      },
    }),
    prisma.stage.findMany({ orderBy: { order: 'asc' }, select: { id: true, title: true } }),
  ])
  return <OrcamentosEquipe budgets={budgets} stages={stages} />
}
