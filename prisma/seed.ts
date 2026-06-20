import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  const adminPassword = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@igrejamatriz.com' },
    update: {},
    create: {
      name: 'Presidente',
      email: 'admin@igrejamatriz.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  const userPassword = await bcrypt.hash('equipe123', 12)
  await prisma.user.upsert({
    where: { email: 'equipe@igrejamatriz.com' },
    update: {},
    create: {
      name: 'Membro da Equipe',
      email: 'equipe@igrejamatriz.com',
      password: userPassword,
      role: 'USER',
    },
  })

  const stagesCount = await prisma.stage.count()
  if (stagesCount === 0) {
    await prisma.stage.createMany({
      data: [
        { title: 'Planejamento e Projeto', description: 'Levantamento de necessidades, elaboração do projeto e contratações', order: 1 },
        { title: 'Demolição', description: 'Remoção de revestimentos antigos, sanitários e demolições necessárias', order: 2 },
        { title: 'Impermeabilização', description: 'Aplicação de impermeabilizante no piso e paredes', order: 3 },
        { title: 'Hidráulica', description: 'Instalação e reparo da rede hidráulica e esgoto', order: 4 },
        { title: 'Elétrica', description: 'Revisão e adequação da instalação elétrica', order: 5 },
        { title: 'Revestimentos', description: 'Assentamento de pisos, azulejos e louças', order: 6 },
        { title: 'Louças e Metais', description: 'Instalação de vaso sanitário, pia, torneiras e chuveiro', order: 7 },
        { title: 'Pintura e Acabamento', description: 'Pintura, rejuntes, silicone e acabamentos finais', order: 8 },
      ],
    })
  }

  console.log('✅ Seed concluído!')
  console.log('')
  console.log('📧 Admin:  admin@igrejamatriz.com  | Senha: admin123')
  console.log('📧 Equipe: equipe@igrejamatriz.com | Senha: equipe123')
  console.log('')
  console.log('⚠️  Troque as senhas após o primeiro login!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
