const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rawProxies = `
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10000
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10001
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10002
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10003
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10004
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10005
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10006
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10007
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10008
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10009
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10010
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10011
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10012
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10013
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10014
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10015
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10016
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10017
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10018
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10019
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10020
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10021
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10022
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10023
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10024
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10025
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10026
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10027
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10028
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10029
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10030
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10031
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10032
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10033
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10034
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10035
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10036
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10037
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10038
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10039
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10040
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10041
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10042
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10043
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10044
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10045
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10046
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10047
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10048
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10049
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10050
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10051
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10052
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10053
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10054
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10055
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10056
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10057
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10058
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10059
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10060
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10061
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10062
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10063
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10064
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10065
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10066
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10067
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10068
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10069
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10070
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10071
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10072
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10073
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10074
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10075
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10076
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10077
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10078
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10079
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10080
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10081
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10082
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10083
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10084
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10085
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10086
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10087
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10088
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10089
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10090
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10091
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10092
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10093
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10094
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10095
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10096
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10097
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10098
c770c1f6edd58063e7c8:ade42cdc213e17d0@gw.dataimpulse.com:10099
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
