import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('test1234', 10)

  const user = await prisma.user.update({
    where: { email: 'test@example.com' },
    data: { password: hashedPassword },
  })

  console.log('Password updated for:', user.email)
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })