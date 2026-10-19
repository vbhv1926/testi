import { NextResponse } from 'next/server';
import { chromium, BrowserContext } from 'playwright';
import { PrismaClient } from '@prisma/client';
import { startLocalProxyTunnel } from '@/lib/proxy-tunnel';

const prisma = new PrismaClient();

// In-memory store of active manual login sessions
// Key: accountId, Value: current status
export const manualLoginSessions: Record<string, {
  status: 'waiting' | 'capturing' | 'success' | 'error';
  message: string;
  browser?: BrowserContext;
  tunnel?: any;
}> = {};

/**
 * POST /api/accounts/[id]/manual-login
 * Opens a real visible Chrome window pointed at x.com/login.
 * Watches in the background for the user to reach /home.
 * When detected, captures cookies and saves to DB.
 * Returns immediately — poll GET to check status.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const account = await prisma.account.findUnique({ where: { id } });
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  // If a session is already running for this account, abort it first
  if (manualLoginSessions[id]) {
    try { await manualLoginSessions[id].browser?.browser()?.close(); } catch {}
    try { manualLoginSessions[id].tunnel?.close(); } catch {}
    delete manualLoginSessions[id];
  }

  manualLoginSessions[id] = { status: 'waiting', message: 'Opening Chrome...' };

  // Launch browser and watch in background — do NOT await this
  (async () => {
    let browser: any;
    let tunnel: any = null;
    try {
      let proxyConfig = undefined;
      if (account.proxyIp && account.proxyIp.trim()) {
        try {
          tunnel = await startLocalProxyTunnel(account.proxyIp);
          proxyConfig = { server: tunnel.server };
        } catch (err: any) {
          console.error('Failed to start proxy tunnel:', err.message);
          proxyConfig = { server: account.proxyIp };
        }
      }

      browser = await chromium.launch({
        headless: false,
        executablePath: process.platform === 'win32'
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
          : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: [
          '--no-sandbox',
          '--start-maximized',
          '--disable-blink-features=AutomationControlled',
        ],
      });

      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        proxy: proxyConfig,
        viewport: null,
      });

      // Remove webdriver flag
      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      manualLoginSessions[id] = {
        status: 'waiting',
        message: 'Log in to X in the Chrome window that just opened.',
        browser: context,
        tunnel,
      };

      const page = await context.newPage();
      await page.goto('https://x.com/i/flow/login', {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      // Poll until user reaches /home (timeout: 10 minutes)
      const deadline = Date.now() + 10 * 60 * 1000;
      let reached = false;

      while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 1500));

        // Check if browser was closed by the user
        const pages = context.pages();
        if (pages.length === 0) {
          manualLoginSessions[id] = {
            status: 'error',
            message: 'Browser window was closed before login completed.',
          };
          await browser.close().catch(() => {});
          if (tunnel) tunnel.close();
          return;
        }

        const url = pages[0].url();
        if (url.includes('x.com/home') || url.includes('twitter.com/home')) {
          reached = true;
          break;
        }
      }

      if (!reached) {
        manualLoginSessions[id] = {
          status: 'error',
          message: 'Timed out waiting for login. Please try again.',
        };
        await browser.close().catch(() => {});
        if (tunnel) tunnel.close();
        return;
      }

      manualLoginSessions[id] = {
        status: 'capturing',
        message: 'Login detected! Capturing session...',
      };

      // Capture cookies
      const cookies = await context.cookies();

      // Capture localStorage
      let localStorageData: Record<string, string> = {};
      try {
        const activePage = context.pages()[0];
        localStorageData = await activePage.evaluate(() => {
          const data: Record<string, string> = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)!;
            data[key] = localStorage.getItem(key)!;
          }
          return data;
        });
      } catch { /* non-fatal */ }

      // Try to grab avatar URL from profile nav
      let avatarUrl: string | null = null;
      try {
        const activePage = context.pages()[0];
        const img = activePage.locator('[data-testid="AppTabBar_Profile_Link"] img').first();
        avatarUrl = await img.getAttribute('src', { timeout: 3000 }).catch(() => null);
      } catch { /* non-fatal */ }

      // Save to DB
      await prisma.account.update({
        where: { id },
        data: {
          cookies: JSON.stringify(cookies),
          localStorage: JSON.stringify(localStorageData),
          avatarUrl,
          status: 'Active',
        },
      });

      manualLoginSessions[id] = {
        status: 'success',
        message: 'Session captured and saved! You can now launch this account anytime.',
      };

      // Close the login browser after a short pause so user sees success
      await new Promise(r => setTimeout(r, 2000));
      await browser.close().catch(() => {});
      if (tunnel) tunnel.close();

    } catch (err: any) {
      manualLoginSessions[id] = {
        status: 'error',
        message: err.message || 'Unknown error during login capture.',
      };
      if (browser) await browser.close().catch(() => {});
      if (tunnel) tunnel.close();
    }
  })();

  return NextResponse.json({
    status: 'waiting',
    message: 'Chrome is opening. Log in to X and we will detect it automatically.',
  });
}

/**
 * GET /api/accounts/[id]/manual-login
 * Poll this to get the current status of a manual login session.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = manualLoginSessions[id];

  if (!session) {
    return NextResponse.json({
      status: 'idle',
      message: 'No active login session.',
    });
  }

  // Clean up finished sessions from memory after returning
  if (session.status === 'success' || session.status === 'error') {
    const result = { status: session.status, message: session.message };
    delete manualLoginSessions[id];
    return NextResponse.json(result);
  }

  return NextResponse.json({ status: session.status, message: session.message });
}
