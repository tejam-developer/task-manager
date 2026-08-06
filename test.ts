import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Fetch the test user you created, along with their boards
  const user = await prisma.user.findUnique({
    where: { email: 'test@example.com' },
    include: { boards: true },
  })

  console.log('User found:', user)
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })