import { prisma } from '@/lib/prisma'
import GastosAdmin from '@/components/GastosAdmin'

export default async function GastosAdminPage() {
  const expenses = await prisma.expense.findMany({
    orderBy: { date: 'desc' },
    include: {
      user: { select: { name: true } },
      stage: { select: { title: true } },
    },
  })
  return <GastosAdmin expenses={expenses} />
}
