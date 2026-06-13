const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rawProxies = `
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10000
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10001
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10002
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10003
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10004
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10005
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10006
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10007
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10008
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10009
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10010
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10011
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10012
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10013
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10014
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10015
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10016
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10017
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10018
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10019
2484ea832b0e86fb9c51:0613ce0c9236b5fd@gw.dataimpulse.com:10020
`;

const proxies = rawProxies.split('\n').map(p => p.trim()).filter(p => p);

async function main() {
  const accounts = await prisma.account.findMany();
  
  for (let i = 0; i < accounts.length; i++) {
    const acc = accounts[i];
    const proxyStr = proxies[i % proxies.length];
    const proxyIp = 'http://' + proxyStr;
    
    await prisma.account.update({
      where: { id: acc.id },
      data: {
        proxyIp,
        status: 'Active'
      }
    });
    console.log(`Updated ${acc.handle} with proxy ${proxyIp}`);
  }
}

main().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(console.error);
