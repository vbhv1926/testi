import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.account.findMany();
  console.log('Accounts:', accounts.map(a => ({ id: a.id, handle: a.handle, status: a.status })));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
