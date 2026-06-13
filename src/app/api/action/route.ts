import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function toPlaywrightSameSite(v: any): 'Strict' | 'Lax' | 'None' {
  if (!v) return 'Lax';
  const s = String(v).toLowerCase();
  if (s === 'strict') return 'Strict';
  if (s === 'none' || s === 'no_restriction') return 'None';
  return 'Lax';
}

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
  let browser = null;
  let actionName = 'unknown';
  try {
    const { accountId, tweetUrl, action, replyText } = await request.json();
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

    browser = await chromium.launch({
      headless: false, // Run visibly to mimic human behavior and avoid bot detection
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      proxy: proxyConfig,
    });

    const page = await context.newPage();

    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    // 1. Add cookies — all with .x.com domain and Lax sameSite
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
    // 3. Inject localStorage before the page scripts run
    if (localStorageData && Object.keys(localStorageData).length > 0) {
      await page.addInitScript((data: Record<string, string>) => {
        try {
          for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, value);
          }
        } catch { }
      }, localStorageData);
    }

    // 4. Navigate to the tweet URL
    await page.goto(tweetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for the tweet container to render
    await page.waitForTimeout(4000); 

    if (actionName === 'like') {
      const likeBtn = page.locator('[data-testid="like"]').first();
      const unlikeBtn = page.locator('[data-testid="unlike"]').first();
      
      if (await unlikeBtn.count() > 0) {
        return NextResponse.json({ message: 'Already liked' });
      } else if (await likeBtn.count() > 0) {
        await likeBtn.click();
      } else {
        throw new Error('Like button not found (Are cookies valid?)');
      }
    } else if (actionName === 'retweet') {
      const retweetBtn = page.locator('[data-testid="retweet"]').first();
      const unretweetBtn = page.locator('[data-testid="unretweet"]').first();

      if (await unretweetBtn.count() > 0) {
        return NextResponse.json({ message: 'Already retweeted' });
      } else if (await retweetBtn.count() > 0) {
        await retweetBtn.click();
        const repostConfirm = page.locator('[data-testid="retweetConfirm"]').first();
        await repostConfirm.waitFor({ state: 'visible', timeout: 5000 });
        await repostConfirm.click();
      } else {
        throw new Error('Retweet button not found');
      }
    } else if (actionName === 'bookmark') {
      const bookmarkBtn = page.locator('[data-testid="bookmark"]').first();
      const removeBookmarkBtn = page.locator('[data-testid="removeBookmark"]').first();

      if (await removeBookmarkBtn.count() > 0) {
        return NextResponse.json({ message: 'Already bookmarked' });
      } else if (await bookmarkBtn.count() > 0) {
        await bookmarkBtn.click();
      } else {
        throw new Error('Bookmark button not found');
      }
    } else if (actionName === 'raid') {
      const likeBtn = page.locator('[data-testid="like"]').first();
      const retweetBtn = page.locator('[data-testid="retweet"]').first();
      const bookmarkBtn = page.locator('[data-testid="bookmark"]').first();
      
      // Click like
      if (await likeBtn.count() > 0) await likeBtn.click();
      await page.waitForTimeout(1000);
      
      // Click retweet
      if (await retweetBtn.count() > 0) {
        await retweetBtn.click();
        const repostConfirm = page.locator('[data-testid="retweetConfirm"]').first();
        await repostConfirm.waitFor({ state: 'visible', timeout: 5000 });
        await repostConfirm.click();
      }
      await page.waitForTimeout(1000);

      // Click bookmark
      if (await bookmarkBtn.count() > 0) await bookmarkBtn.click();
      
    } else if (actionName === 'reply') {
      if (!replyText) {
        throw new Error('Reply text is required');
      }
      
      const replyBtn = page.locator('[data-testid="reply"]').first();
      if (await replyBtn.count() > 0) {
        await replyBtn.click();
        
        const textarea = page.locator('[data-testid="tweetTextarea_0"]').first();
        await textarea.waitFor({ state: 'visible', timeout: 5000 });
        await textarea.fill(replyText);
        
        const tweetBtn = page.locator('[data-testid="tweetButton"]').first();
        await tweetBtn.click();
        
        await page.waitForTimeout(3000);
      } else {
        throw new Error('Reply button not found');
      }
    } else if (action === 'status') {
      const unlikeBtn = page.locator('[data-testid="unlike"]').first();
      const unretweetBtn = page.locator('[data-testid="unretweet"]').first();
      const removeBookmarkBtn = page.locator('[data-testid="removeBookmark"]').first();

      const isLiked = await unlikeBtn.count() > 0;
      const isRetweeted = await unretweetBtn.count() > 0;
      const isBookmarked = await removeBookmarkBtn.count() > 0;

      await browser.close();
      return NextResponse.json({
        liked: isLiked,
        retweeted: isRetweeted,
        bookmarked: isBookmarked
      });
    } else {
      throw new Error('Invalid action');
    }

    // Wait a brief moment to ensure network request goes through
    await page.waitForTimeout(2000);
    
    await browser.close();

    return NextResponse.json({ message: `${action} successful` });
  } catch (error: any) {
    console.error(`Action ${actionName} error:`, error);
    if (browser) {
      await browser.close().catch(() => {});
    }
    return NextResponse.json(
      { error: `Failed to perform ${actionName}`, details: error.message },
      { status: 500 }
    );
  }
}
