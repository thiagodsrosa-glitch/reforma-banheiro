import { prisma } from '@/lib/prisma'
import GastosEquipe from '@/components/GastosEquipe'

export default async function PagamentosEquipePage() {
  const [expenses, stages] = await Promise.all([
    prisma.expense.findMany({
      orderBy: { date: 'desc' },
      include: {
        user: { select: { name: true } },
        stage: { select: { title: true } },
      },
    }),
    prisma.stage.findMany({ orderBy: { order: 'asc' }, select: { id: true, title: true } }),
  ])
  return <GastosEquipe expenses={expenses} stages={stages} pagamentos />
}
