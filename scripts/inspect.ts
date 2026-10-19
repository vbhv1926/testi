import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.account.findMany({
    orderBy: { handle: 'asc' }
  });

  console.log(`\n=== Total Accounts: ${accounts.length} ===\n`);
  
  for (const acc of accounts) {
    let cookieCount = 0;
    let hasAuthToken = false;
    let hasCt0 = false;
    let authExpiry: any = null;

    if (acc.cookies) {
      try {
        const parsed = JSON.parse(acc.cookies);
        cookieCount = parsed.length;
        const authTokenCookie = parsed.find((c: any) => c.name === 'auth_token');
        const ct0Cookie = parsed.find((c: any) => c.name === 'ct0');
        hasAuthToken = !!authTokenCookie;
        hasCt0 = !!ct0Cookie;
        if (authTokenCookie?.expires || authTokenCookie?.expirationDate) {
          const exp = authTokenCookie.expires || authTokenCookie.expirationDate;
          authExpiry = new Date(exp > 20000000000 ? exp : exp * 1000).toISOString();
        }
      } catch (e: any) {
        // bad json
      }
    }

    console.log(
      `${acc.handle.padEnd(8)} | status: ${acc.status.padEnd(8)} | cookies: ${String(cookieCount).padStart(2)} | auth_token: ${hasAuthToken ? '✓' : '✗'} | ct0: ${hasCt0 ? '✓' : '✗'} | proxy: ${acc.proxyIp ? 'Configured' : 'None'}`
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
