import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(process.cwd(), 'account_cookies_export.txt');
  if (!fs.existsSync(filePath)) {
    console.error('File account_cookies_export.txt not found.');
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const sections = content.split('============================================================');
  
  // Clear existing accounts to prevent unique constraint failures and remove previous ones
  await prisma.account.deleteMany();
  console.log('Cleared all old accounts from database.');

  for (const section of sections) {
    if (!section.trim()) continue;

    // Extract Account details
    const lines = section.split('\n').map(l => l.trim()).filter(Boolean);
    
    let name = '';
    let handle = '';
    let proxy = '';
    let cookiesJson = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('Account ')) {
        const match = line.match(/Account \d+:\s*(.*?)\s*\((.*?)\)/);
        if (match) {
          name = match[1];
          handle = match[2];
        }
      } else if (line.startsWith('Proxy:')) {
        proxy = line.replace('Proxy:', '').trim();
      } else if (line.startsWith('Cookies JSON:')) {
        // Collect all lines after Cookies JSON: as cookie json
        cookiesJson = lines.slice(i + 1).join('\n').trim();
        break; // Cookies is always last in the block
      }
    }

    if (!handle || !cookiesJson) {
      continue;
    }

    // Try parsing cookies JSON to ensure it is valid
    try {
      JSON.parse(cookiesJson);
    } catch (e: any) {
      console.error(`Failed to parse cookies JSON for ${handle}:`, e.message);
      continue;
    }

    const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
    const avatarUrl = `https://unavatar.io/x/${handle.startsWith('@') ? handle.substring(1) : handle}`;

    try {
      await prisma.account.create({
        data: {
          name: name || handle,
          handle: cleanHandle,
          proxyIp: proxy,
          cookies: cookiesJson,
          status: 'Active',
          region: '',
          avatarUrl
        }
      });
      console.log(`Successfully imported: ${cleanHandle} with proxy ${proxy}`);
    } catch (e: any) {
      console.error(`Failed to import ${cleanHandle} into DB:`, e.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
