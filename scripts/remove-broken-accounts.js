const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs');

async function main() {
  const brokenAccounts = await prisma.account.findMany({
    where: {
      status: {
        in: ['Offline', 'Suspended']
      }
    }
  });

  console.log(`Found ${brokenAccounts.length} broken accounts to remove.`);

  for (const account of brokenAccounts) {
    console.log(`Removing ${account.handle}...`);
    
    // Delete browser profile folder if it exists
    const profileDir = path.join(process.cwd(), '.browser_profiles', account.id);
    if (fs.existsSync(profileDir)) {
      fs.rmSync(profileDir, { recursive: true, force: true });
    }

    await prisma.account.delete({ where: { id: account.id } });
  }

  console.log('Done removing broken accounts.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
