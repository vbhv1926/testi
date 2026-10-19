import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const rawProxies = `
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10000
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10001
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10002
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10003
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10004
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10005
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10006
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10007
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10008
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10009
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10010
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10011
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10012
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10013
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10014
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10015
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10016
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10017
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10018
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10019
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10020
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10021
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10022
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10023
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10024
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10025
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10026
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10027
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10028
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10029
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10030
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10031
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10032
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10033
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10034
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10035
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10036
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10037
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10038
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10039
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10040
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10041
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10042
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10043
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10044
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10045
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10046
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10047
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10048
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10049
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10050
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10051
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10052
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10053
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10054
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10055
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10056
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10057
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10058
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10059
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10060
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10061
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10062
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10063
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10064
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10065
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10066
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10067
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10068
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10069
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10070
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10071
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10072
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10073
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10074
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10075
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10076
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10077
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10078
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10079
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10080
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10081
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10082
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10083
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10084
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10085
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10086
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10087
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10088
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10089
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10090
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10091
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10092
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10093
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10094
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10095
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10096
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10097
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10098
5ff4e25ba4483886c860:a0f4925f6d580f3a@gw.dataimpulse.com:10099
`;

const proxyList = rawProxies.split('\n').map(p => p.trim()).filter(p => p);

function getRandomProxy() {
  const randomIndex = Math.floor(Math.random() * proxyList.length);
  return 'http://' + proxyList[randomIndex];
}

// GET /api/accounts — list all accounts
export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(accounts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/accounts — create a new account record
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, handle, proxyIp, region, email, password } = body;

    if (!name || !handle) {
      return NextResponse.json({ error: 'name and handle are required' }, { status: 400 });
    }

    const assignedProxy = proxyIp ? proxyIp : getRandomProxy();
    const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;
    const avatarUrl = `https://unavatar.io/x/${cleanHandle}`;

    const account = await prisma.account.create({
      data: {
        name,
        handle: `@${cleanHandle}`,
        proxyIp: assignedProxy,
        region: region || '',
        email: email || null,
        password: password || null,
        avatarUrl,
        status: 'Offline',
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'An account with this handle already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
