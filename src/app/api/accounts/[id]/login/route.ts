import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright';
import { startLocalProxyTunnel } from '@/lib/proxy-tunnel';

const prisma = new PrismaClient();

/**
 * POST /api/accounts/[id]/login
 * Launches a headless browser, logs into X.com with stored credentials,
 * captures all cookies + localStorage, and saves them to the DB.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const account = await prisma.account.findUnique({ where: { id } });
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }
  if (!account.email || !account.password) {
    return NextResponse.json(
      { error: 'No credentials stored. Add email and password first.' },
      { status: 400 }
    );
  }

  let browser;
  let tunnel: any = null;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

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

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      proxy: proxyConfig,
    });

    const page = await context.newPage();

    // Go to login page
    await page.goto('https://x.com/i/flow/login', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Enter username/email
    await page.waitForSelector('input[autocomplete="username"]', { timeout: 15000 });
    await page.fill('input[autocomplete="username"]', account.email);
    await page.keyboard.press('Enter');

    // Handle possible "unusual activity" phone/email verification screen
    try {
      const unusualInput = await page.waitForSelector('input[data-testid="ocfEnterTextTextInput"]', { timeout: 5000 });
      if (unusualInput) {
        // Try filling with email as verification
        await unusualInput.fill(account.email);
        await page.keyboard.press('Enter');
      }
    } catch {
      // Not present, continue
    }

    // Enter password
    await page.waitForSelector('input[name="password"]', { timeout: 15000 });
    await page.fill('input[name="password"]', account.password);
    await page.keyboard.press('Enter');

    // Wait for home timeline
    await page.waitForURL('**/home', { timeout: 30000 });

    // Capture cookies
    const cookies = await context.cookies();

    // Capture localStorage for x.com
    const localStorageData = await page.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)!;
        data[key] = localStorage.getItem(key)!;
      }
      return data;
    });

    // Try to get avatar URL and real name
    let avatarUrl: string | null = null;
    let realName: string | null = null;
    try {
      // Navigate to profile to get info
      await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded' });
      const profileImg = page.locator('[data-testid="AppTabBar_Profile_Link"] img').first();
      avatarUrl = await profileImg.getAttribute('src', { timeout: 5000 }).catch(() => null);
    } catch {
      // Non-fatal
    }

    await context.close();
    await browser.close();
    browser = null;

    // Save to DB
    await prisma.account.update({
      where: { id },
      data: {
        cookies: JSON.stringify(cookies),
        localStorage: JSON.stringify(localStorageData),
        avatarUrl,
        status: 'Active',
        ...(realName ? { name: realName } : {}),
      },
    });

    return NextResponse.json({ message: 'Login successful. Session saved.' });
  } catch (error: any) {
    if (browser) await browser.close().catch(() => {});

    // Check for specific error types
    if (error.message?.includes('Timeout') || error.message?.includes('navigation')) {
      return NextResponse.json(
        { error: 'Login timed out. Wrong credentials, 2FA required, or X is blocking the login.' },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (tunnel) {
      tunnel.close();
    }
  }
}
