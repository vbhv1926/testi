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

async function main() {
  const acc = await prisma.account.findFirst({ where: { handle: '@AC15' } });
  if (!acc) return;

  const raw = JSON.parse(acc.cookies || '[]');
  const cookies = sanitizeCookies(raw);

  let tunnel = null;
  let browser = null;
  const start = Date.now();
  try {
    if (acc.proxyIp) {
      tunnel = await startLocalProxyTunnel(acc.proxyIp);
    }

    browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const ctx = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      proxy: tunnel ? { server: tunnel.server } : undefined,
    });

    const page = await ctx.newPage();
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
    await ctx.addCookies(extendedCookies);

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
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`@AC15 result: ${isLikeFound ? '✅ SUCCESS' : '❌ NO LIKE BUTTON'} in ${duration}s`);
  } catch (err: any) {
    console.error(`@AC15 error:`, err.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (tunnel) tunnel.close();
    await prisma.$disconnect();
  }
}

main();
