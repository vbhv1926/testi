import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright';
import { startLocalProxyTunnel } from '../src/lib/proxy-tunnel';

const prisma = new PrismaClient();

function sanitizeCookies(raw: any[]) {
  return raw
    .filter(c => c.name && c.value !== undefined)
    .map(c => {
      let domain = String(c.domain || '.x.com');
      if (domain !== 'x.com' && !domain.startsWith('.')) {
        domain = '.' + domain;
      }
      return {
        name: String(c.name),
        value: String(c.value ?? ''),
        domain: domain,
        path: String(c.path || '/'),
        expires: typeof c.expirationDate === 'number'
          ? (c.expirationDate > 20000000000 ? Math.floor(c.expirationDate / 1000) : c.expirationDate)
          : typeof c.expires === 'number'
            ? (c.expires > 20000000000 ? Math.floor(c.expires / 1000) : c.expires)
            : -1,
        httpOnly: String(c.name) === 'auth_token' ? true : Boolean(c.httpOnly),
        secure: String(c.name) === 'auth_token' ? true : Boolean(c.secure),
        sameSite: 'None' as const,
      };
    });
}

async function testSingleAccount(account: any, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let browser = null;
    let tunnel = null;
    const start = Date.now();
    try {
      if (!account.cookies) {
        return { handle: account.handle, ok: false, error: 'No cookies saved' };
      }

      const raw = JSON.parse(account.cookies);
      const cookies = sanitizeCookies(raw);

      let proxyConfig = undefined;
      if (account.proxyIp && account.proxyIp.trim()) {
        try {
          tunnel = await startLocalProxyTunnel(account.proxyIp);
          proxyConfig = { server: tunnel.server };
        } catch (err: any) {
          proxyConfig = { server: account.proxyIp };
        }
      }

      browser = await chromium.launch({
        headless: false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
        ],
      });

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 },
        proxy: proxyConfig,
      });

      const page = await context.newPage();
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      const extendedCookies: any[] = [];
      for (const c of cookies) {
        extendedCookies.push({ ...c, domain: c.domain.startsWith('.') ? c.domain : '.' + c.domain });
        extendedCookies.push({ ...c, domain: c.domain.startsWith('.') ? c.domain.substring(1) : c.domain });
        if (c.domain.includes('x.com')) {
          const twDomain = c.domain.replace('x.com', 'twitter.com');
          extendedCookies.push({ ...c, domain: twDomain });
          extendedCookies.push({ ...c, domain: twDomain.startsWith('.') ? twDomain.substring(1) : twDomain });
        }
      }
      await context.addCookies(extendedCookies);

      await page.goto('https://x.com/i/status/2083622636148380058', {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });

      const acceptBtn = page.locator('button:has-text("Accept all cookies"), [data-testid="cookie-banner-accept"]').first();
      if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await acceptBtn.click().catch(() => {});
      }

      await page.waitForSelector('[data-testid="like"], [data-testid="unlike"], [data-testid="tweet"], [data-testid="cellInnerDiv"]', { timeout: 30000 });

      const likeBtn = page.locator('[data-testid="like"], [data-testid="unlike"]').first();
      const isLikeFound = await likeBtn.isVisible().catch(() => false);

      const time = ((Date.now() - start) / 1000).toFixed(1);
      if (isLikeFound) {
        return { handle: account.handle, ok: true, time: `${time}s`, attempt };
      } else {
        throw new Error('Like button not found in page DOM');
      }
    } catch (err: any) {
      if (attempt < maxRetries) {
        // Retry
        continue;
      }
      const time = ((Date.now() - start) / 1000).toFixed(1);
      return { handle: account.handle, ok: false, error: err.message, time: `${time}s` };
    } finally {
      if (browser) await browser.close().catch(() => {});
      if (tunnel) tunnel.close();
    }
  }
  return { handle: account.handle, ok: false, error: 'Unknown failure' };
}

async function main() {
  const accounts = await prisma.account.findMany({ orderBy: { handle: 'asc' } });
  console.log(`Starting comprehensive test for ALL ${accounts.length} accounts...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const acc of accounts) {
    process.stdout.write(`Testing ${acc.handle.padEnd(8)}... `);
    const res = await testSingleAccount(acc);
    if (res.ok) {
      successCount++;
      console.log(`✅ OK (${res.time})${res.attempt && res.attempt > 1 ? ` [Retry ${res.attempt}]` : ''}`);
    } else {
      failCount++;
      console.log(`❌ FAILED: ${res.error} (${res.time})`);
    }
  }

  console.log(`\n================================`);
  console.log(`Diagnostic Complete: ${successCount}/${accounts.length} Passed, ${failCount}/${accounts.length} Failed`);
  console.log(`================================`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
