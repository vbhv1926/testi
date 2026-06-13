import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// DELETE /api/accounts/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const account = await prisma.account.findUnique({ where: { id } });
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Delete browser profile folder if it exists
    const profileDir = path.join(process.cwd(), '.browser_profiles', id);
    if (fs.existsSync(profileDir)) {
      fs.rmSync(profileDir, { recursive: true, force: true });
    }

    await prisma.account.delete({ where: { id } });

    return NextResponse.json({ message: 'Account deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/accounts/[id] — update account fields
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const account = await prisma.account.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(account);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
