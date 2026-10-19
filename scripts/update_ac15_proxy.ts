import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.account.update({
    where: { handle: '@AC15' },
    data: { proxyIp: 'http://c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10015' }
  });
  console.log('Updated @AC15 proxy to port 10015');
}

main().finally(() => prisma.$disconnect());
