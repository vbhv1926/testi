import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Track active browser contexts in memory (per server process)
const activeBrowsers: Record<string, any> = {};

/** Map any sameSite value to Playwright-valid value */
function toPlaywrightSameSite(v: any): 'Strict' | 'Lax' | 'None' {
  if (!v) return 'Lax';
  const s = String(v).toLowerCase();
  if (s === 'strict') return 'Strict';
  if (s === 'none' || s === 'no_restriction') return 'None';
  return 'Lax';
}

/** Sanitize a cookie array to be safely passed to context.addCookies() */
function sanitizeCookies(raw: any[]) {
  return raw
    .filter(c => c.name && c.value !== undefined)
    .map(c => {
      return {
        name: String(c.name),
        value: String(c.value ?? ''),
        domain: '.x.com',
        path: String(c.path || '/'),
        expires: typeof c.expirationDate === 'number'
          ? (c.expirationDate > 20000000000 ? Math.floor(c.expirationDate / 1000) : c.expirationDate)
          : typeof c.expires === 'number'
            ? (c.expires > 20000000000 ? Math.floor(c.expires / 1000) : c.expires)
            : -1,
        httpOnly: Boolean(c.httpOnly),
        secure: Boolean(c.secure),
        sameSite: 'Lax' as const,
      };
    });
}

export async function POST(request: Request) {
  try {
    const { accountId, tweetText } = await request.json();

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // If a browser is already open for this account, bring it to front
    if (activeBrowsers[accountId]) {
      try {
        const b = activeBrowsers[accountId];
        const contexts = b.contexts();
        if (contexts.length > 0) {
          const pages = contexts[0].pages();
          if (pages.length > 0) {
            await pages[0].bringToFront();
            return NextResponse.json({ message: 'Session already active — brought to front.' });
          }
        }
      } catch {
        delete activeBrowsers[accountId];
      }
    }

    if (!account.cookies) {
      return NextResponse.json(
        {
          error:
            'No session cookies saved for this account. ' +
            'Use "Import Cookies" in the Add Account modal to save a session first.',
        },
        { status: 400 }
      );
    }

    // Parse and sanitize cookies
    let cookies: any[];
    try {
      const raw = JSON.parse(account.cookies);
      cookies = sanitizeCookies(raw);
    } catch {
      return NextResponse.json(
        { error: 'Stored cookies are corrupted. Please re-import them.' },
        { status: 400 }
      );
    }

    if (cookies.length === 0) {
      return NextResponse.json(
        { error: 'No valid cookies found. Please re-import the session.' },
        { status: 400 }
      );
    }

    const localStorageData: Record<string, string> | null = (() => {
      try {
        return account.localStorage ? JSON.parse(account.localStorage) : null;
      } catch {
        return null;
      }
    })();

    // Build proxy config — only if proxyIp is a non-empty string
    let proxyConfig = undefined;
    if (account.proxyIp && account.proxyIp.trim()) {
      const pUrl = account.proxyIp.includes('://') ? account.proxyIp : `http://${account.proxyIp}`;
      try {
        const u = new URL(pUrl);
        proxyConfig = { server: `${u.protocol}//${u.host}` };
        if (u.username) proxyConfig.username = decodeURIComponent(u.username);
        if (u.password) proxyConfig.password = decodeURIComponent(u.password);
      } catch {
        proxyConfig = { server: pUrl };
      }
    }

    // Launch a visible (headed) browser
    const browser = await chromium.launch({
      headless: false,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--start-maximized',
        // Disable automation flags that X detects
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      proxy: proxyConfig,
      viewport: null, // full window
    });

    const page = await context.newPage();

    // Remove webdriver flag so X doesn't detect automation
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    // Inject cookies — add them all at once with .x.com domain
    try {
      await context.addCookies(cookies);
      console.log(`Injected ${cookies.length} cookies for ${account.handle}`);
    } catch (e: any) {
      console.error('Failed to add cookies batch, trying one by one:', e.message);
      for (const cookie of cookies) {
        try {
          await context.addCookies([cookie]);
        } catch (e2: any) {
          console.warn('Skipped cookie:', cookie.name, e2.message);
        }
      }
    }
    // Inject localStorage before the page scripts run
    if (localStorageData && Object.keys(localStorageData).length > 0) {
      await page.addInitScript((data: Record<string, string>) => {
        try {
          for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, value);
          }
        } catch { /* localStorage might not be available yet, that's ok */ }
      }, localStorageData);
    }

    // Determine target URL: standard home, specific tweet link, or pre-filled tweet intent URL
    let targetUrl = 'https://x.com/home';
    const textTrimmed = tweetText ? String(tweetText).trim() : '';
    if (textTrimmed) {
      if (/^(https?:\/\/)?(www\.)?(x|twitter)\.com\/\w+\/status\/\d+/i.test(textTrimmed)) {
        // If it matches a tweet link (e.g. x.com/username/status/1234), open it directly
        targetUrl = textTrimmed.startsWith('http') ? textTrimmed : `https://${textTrimmed}`;
      } else {
        // Otherwise, open the composer modal prefilled with the text
        targetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(textTrimmed)}`;
      }
    }

    // Navigate to X
    await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    activeBrowsers[accountId] = browser;

    // Update status to Active
    await prisma.account.update({
      where: { id: accountId },
      data: { status: 'Active' },
    });

    // On browser close — write back fresh cookies and update status
    browser.on('disconnected', async () => {
      try {
        const freshCookies = await context.cookies().catch(() => []);
        if (freshCookies.length > 0) {
          await prisma.account.update({
            where: { id: accountId },
            data: {
              cookies: JSON.stringify(freshCookies),
              status: 'Offline',
            },
          });
        }
      } catch { /* non-fatal */ }
      delete activeBrowsers[accountId];
    });

    return NextResponse.json({ message: 'Browser launched. X is open and logged in.' });
  } catch (error: any) {
    console.error('Launch error:', error);
    return NextResponse.json(
      { error: 'Failed to launch session', details: error.message },
      { status: 500 }
    );
  }
}
