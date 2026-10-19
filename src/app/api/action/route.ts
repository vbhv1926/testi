import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';
import { startLocalProxyTunnel } from '@/lib/proxy-tunnel';

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

export async function POST(request: Request) {
  let browser: any = null;
  let actionName = 'unknown';
  let tunnel: any = null;

  try {
    const { accountId, tweetUrl, action, replyText, headless: explicitHeadless } = await request.json();
    actionName = action;

    if (!accountId || !tweetUrl || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    if (!account.cookies) {
      return NextResponse.json(
        { error: 'No session cookies saved for this account.' },
        { status: 400 }
      );
    }

    let cookies: any[];
    try {
      const raw = JSON.parse(account.cookies);
      cookies = sanitizeCookies(raw);
    } catch {
      return NextResponse.json(
        { error: 'Stored cookies are corrupted.' },
        { status: 400 }
      );
    }

    if (cookies.length === 0) {
      return NextResponse.json({ error: 'No valid cookies found.' }, { status: 400 });
    }

    const localStorageData: Record<string, string> | null = (() => {
      try {
        return account.localStorage ? JSON.parse(account.localStorage) : null;
      } catch {
        return null;
      }
    })();

    let proxyConfig = undefined;
    if (account.proxyIp && account.proxyIp.trim()) {
      try {
        tunnel = await startLocalProxyTunnel(account.proxyIp);
        proxyConfig = { server: tunnel.server };
      } catch (err: any) {
        console.error(`[${account.handle}] Failed to start proxy tunnel:`, err.message);
        proxyConfig = { server: account.proxyIp };
      }
    }

    // Default to headless for automated multi-account raids to ensure performance and prevent window floods
    const isHeadless = explicitHeadless !== undefined ? Boolean(explicitHeadless) : (process.env.HEADLESS !== 'false');

    const launchBrowser = async () => {
      const isWin = process.platform === 'win32';
      const isMac = process.platform === 'darwin';
      const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      const winChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

      const launchArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
      ];

      try {
        const executablePath = isWin ? winChrome : (isMac ? macChrome : undefined);
        return await chromium.launch({
          headless: isHeadless,
          executablePath,
          args: launchArgs,
        });
      } catch (err: any) {
        return await chromium.launch({
          headless: isHeadless,
          args: launchArgs,
        });
      }
    };

    browser = await launchBrowser();

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      proxy: proxyConfig,
    });

    const page = await context.newPage();

    // Stealth: Hide automation indicators
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      (window as any).chrome = { runtime: {} };
    });

    // Helper to click an element while dealing with unexpected overlays/popups
    const clickWithOverlayHandling = async (locator: any, nameForLogging: string) => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await locator.click({ timeout: 6000 });
          return;
        } catch (err: any) {
          if (err.message.includes('intercepts pointer events') || err.message.includes('clickable') || err.message.includes('timeout')) {
            console.log(`[${account.handle}] Click on ${nameForLogging} intercepted (attempt ${attempt}). Clearing overlays...`);

            // 1. Dismiss cookie banner if any
            const acceptBtn = page.locator('button:has-text("Accept all cookies"), [data-testid="cookie-banner-accept"]').first();
            if (await acceptBtn.isVisible().catch(() => false)) {
              await acceptBtn.click().catch(() => {});
            }

            // 2. Try clicking standard close buttons (Premium upsells, promo dialogs, etc.)
            const closeBtn = page.locator('[aria-label="Close"], [data-testid="app-bar-close"], button:has-text("Dismiss"), button:has-text("Close")').first();
            if (await closeBtn.isVisible().catch(() => false)) {
              await closeBtn.click().catch(() => {});
            } else {
              // 3. Try sending Escape key
              await page.keyboard.press('Escape').catch(() => {});
            }

            await page.waitForTimeout(800);
            continue;
          }
          throw err;
        }
      }
      await locator.click({ force: true });
    };

    // 1. Add cookies with complete domain matrix (.x.com, x.com, .twitter.com, twitter.com)
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

    try {
      await context.addCookies(extendedCookies);
    } catch (e: any) {
      for (const cookie of extendedCookies) {
        try {
          await context.addCookies([cookie]);
        } catch { }
      }
    }

    // 2. Inject localStorage before page scripts run
    if (localStorageData && Object.keys(localStorageData).length > 0) {
      await page.addInitScript((data: Record<string, string>) => {
        try {
          for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, value);
          }
        } catch { }
      }, localStorageData);
    }

    // 3. Navigate to Tweet URL
    await page.goto(tweetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

    // 4. Accept cookie consent banner if present
    const cookieAcceptBtn = page.locator('button:has-text("Accept all cookies"), [data-testid="cookie-banner-accept"]').first();
    if (await cookieAcceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieAcceptBtn.click().catch(() => {});
      await page.waitForTimeout(600);
    }

    // 5. Wait dynamically for tweet content or login redirect
    try {
      await Promise.race([
        page.waitForSelector('[data-testid="tweet"], [data-testid="like"], [data-testid="unlike"], [data-testid="cellInnerDiv"]', { timeout: 35000 }),
        page.waitForURL('**/login**', { timeout: 35000 }),
        page.waitForURL('**/i/flow/login**', { timeout: 35000 }),
      ]);
    } catch (e) {
      throw new Error('Page loading timed out (35s limit exceeded on proxy).');
    }

    // Check if redirected to login
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('flow/login')) {
      throw new Error('Session expired or logged out. Please re-import cookies for this account.');
    }

    // Helper for typing and posting a reply/comment
    const sendReplyText = async (textToSend: string) => {
      // 1. Try to open reply composer
      const replyBtn = page.locator('[data-testid="reply"]').first();
      const inlineTextarea = page.locator('[data-testid="tweetTextarea_0"]').first();

      if (!(await inlineTextarea.isVisible().catch(() => false))) {
        if (await replyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await clickWithOverlayHandling(replyBtn, 'reply button');
          await page.waitForTimeout(800);
        }
      }

      // 2. Check if a modal dialog opened (to prevent backdrop mask intercepting clicks)
      const dialog = page.locator('div[role="dialog"]');
      const isModal = await dialog.isVisible({ timeout: 2000 }).catch(() => false);
      const container = isModal ? dialog : page;

      // 3. Focus textarea inside the active container
      const textarea = container.locator('[data-testid="tweetTextarea_0"], div[role="textbox"][contenteditable="true"]').first();
      await textarea.waitFor({ state: 'visible', timeout: 12000 });
      await textarea.click({ force: true });
      await page.waitForTimeout(300);

      // 4. Type comment text using pressSequentially for native React/Draft.js event dispatch
      await textarea.pressSequentially(textToSend, { delay: 35 });
      await page.waitForTimeout(500);

      // 5. Submit button inside active container
      const tweetBtn = container.locator('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]').first();
      await tweetBtn.waitFor({ state: 'visible', timeout: 8000 });

      // Unlock button if still marked disabled
      for (let i = 0; i < 3; i++) {
        const ariaDisabled = (await tweetBtn.getAttribute('aria-disabled')) === 'true';
        const disabledAttr = (await tweetBtn.getAttribute('disabled')) !== null;
        if (!ariaDisabled && !disabledAttr) break;
        await textarea.click({ force: true }).catch(() => {});
        await page.keyboard.press('Space').catch(() => {});
        await page.keyboard.press('Backspace').catch(() => {});
        await page.waitForTimeout(300);
      }

      // 6. Click submit button with overlay handling
      await clickWithOverlayHandling(tweetBtn, 'reply submit button');
      await page.waitForTimeout(3500);
    };

    if (actionName === 'like') {
      const likeBtn = page.locator('[data-testid="like"]').first();
      const unlikeBtn = page.locator('[data-testid="unlike"]').first();

      if (await unlikeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        return NextResponse.json({ message: 'Already liked' });
      } else if (await likeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await clickWithOverlayHandling(likeBtn, 'like button');
      } else {
        throw new Error('Like button not found');
      }
    } else if (actionName === 'retweet') {
      const retweetBtn = page.locator('[data-testid="retweet"]').first();
      const unretweetBtn = page.locator('[data-testid="unretweet"]').first();

      if (await unretweetBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        return NextResponse.json({ message: 'Already reposted' });
      } else if (await retweetBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await clickWithOverlayHandling(retweetBtn, 'repost button');
        const repostConfirm = page.locator('[data-testid="retweetConfirm"]').first();
        await repostConfirm.waitFor({ state: 'visible', timeout: 5000 });
        await clickWithOverlayHandling(repostConfirm, 'repost confirm button');
      } else {
        throw new Error('Repost button not found');
      }
    } else if (actionName === 'bookmark') {
      const bookmarkBtn = page.locator('[data-testid="bookmark"]').first();
      const removeBookmarkBtn = page.locator('[data-testid="removeBookmark"]').first();

      if (await removeBookmarkBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        return NextResponse.json({ message: 'Already bookmarked' });
      } else if (await bookmarkBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await clickWithOverlayHandling(bookmarkBtn, 'bookmark button');
      } else {
        throw new Error('Bookmark button not found');
      }
    } else if (actionName === 'raid') {
      const likeBtn = page.locator('[data-testid="like"]').first();
      const retweetBtn = page.locator('[data-testid="retweet"]').first();
      const bookmarkBtn = page.locator('[data-testid="bookmark"]').first();

      // 1. Like
      if (await likeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await clickWithOverlayHandling(likeBtn, 'like button');
      }
      await page.waitForTimeout(600);

      // 2. Retweet
      if (await retweetBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await clickWithOverlayHandling(retweetBtn, 'retweet button');
        const repostConfirm = page.locator('[data-testid="retweetConfirm"]').first();
        if (await repostConfirm.isVisible({ timeout: 4000 }).catch(() => false)) {
          await clickWithOverlayHandling(repostConfirm, 'repost confirm button');
        }
      }
      await page.waitForTimeout(600);

      // 3. Bookmark
      if (await bookmarkBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await clickWithOverlayHandling(bookmarkBtn, 'bookmark button');
      }

      // 4. Comment / Reply if replyText provided
      if (replyText && replyText.trim()) {
        await page.waitForTimeout(800);
        await sendReplyText(replyText.trim());
      }
    } else if (actionName === 'reply') {
      if (!replyText || !replyText.trim()) {
        throw new Error('Reply text is required for reply action');
      }
      await sendReplyText(replyText.trim());
    } else if (actionName === 'status') {
      const unlikeBtn = page.locator('[data-testid="unlike"]').first();
      const unretweetBtn = page.locator('[data-testid="unretweet"]').first();
      const removeBookmarkBtn = page.locator('[data-testid="removeBookmark"]').first();

      const isLiked = await unlikeBtn.isVisible({ timeout: 2000 }).catch(() => false);
      const isRetweeted = await unretweetBtn.isVisible({ timeout: 2000 }).catch(() => false);
      const isBookmarked = await removeBookmarkBtn.isVisible({ timeout: 2000 }).catch(() => false);

      return NextResponse.json({
        liked: isLiked,
        retweeted: isRetweeted,
        bookmarked: isBookmarked,
      });
    } else {
      throw new Error(`Invalid action: ${actionName}`);
    }

    await page.waitForTimeout(1500);

    return NextResponse.json({ message: `${actionName} successful` });
  } catch (error: any) {
    console.error(`Action ${actionName} error:`, error.message);
    return NextResponse.json(
      { error: `Failed to perform ${actionName}`, details: error.message },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    if (tunnel) {
      tunnel.close();
    }
  }
}
