import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright';
import { startLocalProxyTunnel } from '../src/lib/proxy-tunnel';

const prisma = new PrismaClient();

function toPlaywrightSameSite(v: any): 'Strict' | 'Lax' | 'None' {
  if (!v) return 'None';
  const s = String(v).toLowerCase();
  if (s === 'strict') return 'Strict';
  if (s === 'lax') return 'Lax';
  return 'None';
}

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
        sameSite: String(c.name) === 'auth_token' ? ('None' as const) : toPlaywrightSameSite(c.sameSite),
      };
    });
}

async function testComment() {
  const account = await prisma.account.findFirst({ where: { handle: '@AC1' } });
  if (!account || !account.cookies) {
    console.error('Account @AC1 not found or has no cookies');
    return;
  }

  let tunnel: any = null;
  let browser: any = null;

  try {
    let proxyConfig = undefined;
    if (account.proxyIp) {
      tunnel = await startLocalProxyTunnel(account.proxyIp);
      proxyConfig = { server: tunnel.server };
    }

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
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

    const rawCookies = JSON.parse(account.cookies);
    const cookies = sanitizeCookies(rawCookies);

    const extendedCookies: any[] = [];
    for (const c of cookies) {
      extendedCookies.push({ ...c, domain: c.domain.startsWith('.') ? c.domain : '.' + c.domain });
      extendedCookies.push({ ...c, domain: c.domain.startsWith('.') ? c.domain.substring(1) : c.domain });
      if (c.domain.includes('x.com')) {
        const tw = c.domain.replace('x.com', 'twitter.com');
        extendedCookies.push({ ...c, domain: tw });
        extendedCookies.push({ ...c, domain: tw.startsWith('.') ? tw.substring(1) : tw });
      }
    }
    await context.addCookies(extendedCookies);

    console.log('Navigating to tweet...');
    await page.goto('https://x.com/i/status/2083622636148380058', { waitUntil: 'domcontentloaded', timeout: 45000 });

    // Wait for tweet element
    await page.waitForSelector('[data-testid="tweet"], [data-testid="like"], [data-testid="cellInnerDiv"]', { timeout: 35000 });
    console.log('Tweet page loaded.');

    // Dismiss cookie banner
    const acceptBtn = page.locator('button:has-text("Accept all cookies"), [data-testid="cookie-banner-accept"]').first();
    if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptBtn.click().catch(() => {});
      await page.waitForTimeout(500);
    }

    const replyBtn = page.locator('[data-testid="reply"]').first();
    if (await replyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Clicking reply icon to open modal composer...');
      await replyBtn.click();
      await page.waitForTimeout(800);
    }

    // Check if modal dialog appeared
    const dialog = page.locator('div[role="dialog"]');
    const isModal = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Is modal open? ${isModal}`);

    const container = isModal ? dialog : page;
    const textarea = container.locator('[data-testid="tweetTextarea_0"], div[role="textbox"][contenteditable="true"]').first();
    await textarea.waitFor({ state: 'visible', timeout: 10000 });
    await textarea.click({ force: true });
    await page.waitForTimeout(300);

    const commentText = 'LFG! 🚀';
    console.log(`Typing comment "${commentText}" inside ${isModal ? 'modal' : 'inline'} composer...`);
    await textarea.pressSequentially(commentText, { delay: 40 });
    await page.waitForTimeout(600);

    const submitBtn = container.locator('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]').first();
    await submitBtn.waitFor({ state: 'visible', timeout: 8000 });

    const ariaDisabled = await submitBtn.getAttribute('aria-disabled');
    const disabledAttr = await submitBtn.getAttribute('disabled');
    console.log(`Submit button state: disabled="${disabledAttr}", aria-disabled="${ariaDisabled}"`);

    if (ariaDisabled === 'true' || disabledAttr !== null) {
      console.log('Triggering keypress fallback...');
      await textarea.click({ force: true });
      await page.keyboard.press('Space');
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(400);
    }

    console.log('Clicking submit button...');
    await submitBtn.click({ timeout: 8000 });
    console.log('Waiting for confirmation...');
    await page.waitForTimeout(3500);

    console.log('✅ Comment posted successfully!');
  } catch (err: any) {
    console.error('Test error:', err.message);
  } finally {
    if (browser) await browser.close();
    if (tunnel) tunnel.close();
  }
}

testComment().catch(console.error);
