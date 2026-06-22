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
  return <GastosAdmin expenses={expenses.map(e => ({
    ...e,
    date: e.date.toISOString(),
    requestedAt: e.requestedAt?.toISOString() ?? null,
    authorizedAt: e.authorizedAt?.toISOString() ?? null,
    paidAt: e.paidAt?.toISOString() ?? null,
  }))} />
}
