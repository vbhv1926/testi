const { PrismaClient } = require('@prisma/client');
const { chromium } = require('playwright');

const prisma = new PrismaClient();

function toPlaywrightSameSite(v) {
  if (!v) return 'Lax';
  const s = String(v).toLowerCase();
  if (s === 'strict') return 'Strict';
  if (s === 'none' || s === 'no_restriction') return 'None';
  return 'Lax';
}

function sanitizeCookies(raw) {
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
        expires: typeof c.expires === 'number' ? c.expires : -1,
        httpOnly: String(c.name) === 'auth_token' ? true : Boolean(c.httpOnly),
        secure: String(c.name) === 'auth_token' ? true : Boolean(c.secure),
        sameSite: String(c.name) === 'auth_token' ? 'None' : toPlaywrightSameSite(c.sameSite),
      };
    });
}

async function checkAccounts() {
  const accounts = await prisma.account.findMany();
  console.log(`Found ${accounts.length} accounts in the database.\n`);

  for (const account of accounts) {
    console.log(`Checking account: ${account.name} (${account.handle})`);
    
    if (!account.cookies) {
      console.log(`❌ NO COOKIES SAVED. Status: Invalid\n`);
      continue;
    }

    let cookies = [];
    try {
      const raw = JSON.parse(account.cookies);
      cookies = sanitizeCookies(raw);
    } catch {
      console.log(`❌ COOKIES CORRUPTED. Status: Invalid\n`);
      continue;
    }

    let proxyConfig = undefined;
    if (account.proxyIp && account.proxyIp.trim()) {
      const rawUrl = account.proxyIp.includes('://') ? account.proxyIp : `http://${account.proxyIp}`;
      try {
        const u = new URL(rawUrl);
        proxyConfig = {
          server: `${u.protocol}//${u.hostname}:${u.port}`,
          username: u.username ? decodeURIComponent(u.username) : undefined,
          password: u.password ? decodeURIComponent(u.password) : undefined
        };
      } catch (e) {
        proxyConfig = { server: rawUrl };
      }
    }

    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const context = await browser.newContext(proxyConfig ? { proxy: proxyConfig } : {});
      
      const extendedCookies = [];
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

      const page = await context.newPage();
      
      // Navigate to home to verify login
      const response = await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Check if redirected to login
      const url = page.url();
      if (url.includes('login') || url.includes('logout') || url === 'https://x.com/') {
        console.log(`❌ LOGGED OUT or SUSPENDED. URL: ${url}. REMOVING ACCOUNT.`);
        await prisma.account.delete({ where: { id: account.id } });
      } else {
        // Might be logged in. Let's see if there's a suspend notice
        const visibleText = await page.locator('body').innerText().catch(() => '');
        if (visibleText.includes('suspended') || visibleText.includes('Account suspended')) {
          console.log(`❌ SUSPENDED. REMOVING ACCOUNT.`);
          await prisma.account.delete({ where: { id: account.id } });
        } else {
          console.log(`✅ VALID. Successfully accessed home.`);
          await prisma.account.update({ where: { id: account.id }, data: { status: 'Active' } });
        }
      }
    } catch (e) {
      console.log(`⚠️ ERROR during check: ${e.message}`);
    } finally {
      if (browser) await browser.close();
      console.log('---');
    }
  }
}

checkAccounts().then(() => {
  console.log('Finished checking all accounts.');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
