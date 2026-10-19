import { PrismaClient } from '@prisma/client';
import http from 'http';
import https from 'https';
import { startLocalProxyTunnel } from '../src/lib/proxy-tunnel';

const prisma = new PrismaClient();

async function checkProxyWithTunnel(proxyUrl: string): Promise<{ ok: boolean; ip?: string; error?: string }> {
  let tunnel = null;
  try {
    tunnel = await startLocalProxyTunnel(proxyUrl);
    const parsed = new URL(tunnel.server);

    return new Promise((resolve) => {
      const req = http.request({
        hostname: parsed.hostname,
        port: parsed.port,
        path: 'http://api.ipify.org?format=json',
        method: 'GET',
        headers: { 'Host': 'api.ipify.org' },
        timeout: 10000,
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve({ ok: true, ip: data.ip });
          } catch {
            resolve({ ok: false, error: `Invalid response: ${body.substring(0, 50)}` });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, error: 'Connection Timeout (10s)' });
      });

      req.on('error', (err) => {
        resolve({ ok: false, error: err.message });
      });

      req.end();
    });
  } catch (err: any) {
    return { ok: false, error: err.message };
  } finally {
    if (tunnel) tunnel.close();
  }
}

async function main() {
  const accounts = await prisma.account.findMany({ orderBy: { handle: 'asc' } });
  console.log(`Checking proxies for all ${accounts.length} accounts...\n`);

  for (const acc of accounts) {
    if (!acc.proxyIp || !acc.proxyIp.trim()) {
      console.log(`${acc.handle.padEnd(8)}: No proxy configured`);
      continue;
    }

    const res = await checkProxyWithTunnel(acc.proxyIp);
    if (res.ok) {
      console.log(`${acc.handle.padEnd(8)}: ✅ Proxy LIVE -> Outbound IP: ${res.ip}`);
    } else {
      console.log(`${acc.handle.padEnd(8)}: ❌ Proxy DEAD/UNREACHABLE -> ${res.error}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
