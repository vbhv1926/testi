import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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
