import { prisma } from '@/lib/prisma'
import OrcamentosAdmin from '@/components/OrcamentosAdmin'

export default async function OrcamentosAdminPage() {
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
  return <OrcamentosAdmin budgets={budgets} stages={stages} />
}
