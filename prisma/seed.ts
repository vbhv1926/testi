import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const account1 = await prisma.account.upsert({
    where: { handle: '@tech_insider_io' },
    update: {},
    create: {
      name: 'Tech Insider',
      handle: '@tech_insider_io',
      proxyIp: '192.168.1.45',
      region: 'US-East',
      status: 'Active',
      followers: 12000,
      following: 45000,
    },
  });

  const account2 = await prisma.account.upsert({
    where: { handle: '@cryptodaily_news' },
    update: {},
    create: {
      name: 'Crypto Daily',
      handle: '@cryptodaily_news',
      proxyIp: '10.0.0.12',
      region: 'US-West',
      status: 'Suspended',
      followers: 5300,
      following: 800,
    },
  });

  const account3 = await prisma.account.upsert({
    where: { handle: '@startup_lol' },
    update: {},
    create: {
      name: 'Startup Memes',
      handle: '@startup_lol',
      proxyIp: '172.16.254.1',
      region: 'EU-West',
      status: 'Offline',
      followers: 89000,
      following: 120,
    },
  });

  console.log({ account1, account2, account3 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
