import { chromium } from 'playwright';
import { startLocalProxyTunnel } from '../src/lib/proxy-tunnel';

async function testPort(port: number) {
  const proxyUrl = `http://c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:${port}`;
  let tunnel = null;
  let browser = null;
  try {
    tunnel = await startLocalProxyTunnel(proxyUrl);
    browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ proxy: { server: tunnel.server } });
    const page = await ctx.newPage();
    const res = await page.goto('https://api.ipify.org?format=json', { timeout: 15000 });
    const text = await page.textContent('body');
    console.log(`Port ${port}: ✅ SUCCESS -> ${text}`);
    return true;
  } catch (err: any) {
    console.log(`Port ${port}: ❌ FAILED -> ${err.message}`);
    return false;
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (tunnel) tunnel.close();
  }
}

async function main() {
  console.log('Testing ports 10014, 10015, 10016, 10000...');
  await testPort(10014);
  await testPort(10015);
  await testPort(10016);
  await testPort(10000);
}

main();
