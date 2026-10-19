import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.account.findMany({ select: { handle: true, proxyIp: true } });
  console.table(accounts);
}

main().finally(() => prisma.$disconnect());
