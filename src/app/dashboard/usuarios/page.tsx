import { prisma } from '@/lib/prisma'
import UsuariosAdmin from '@/components/UsuariosAdmin'

export default async function UsuariosAdminPage() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return <UsuariosAdmin users={users} />
}
