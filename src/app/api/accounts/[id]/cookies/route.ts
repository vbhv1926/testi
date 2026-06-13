import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Map any browser sameSite value to a valid Playwright sameSite */
function normalizeSameSite(value: string | undefined): 'Strict' | 'Lax' | 'None' {
  if (!value) return 'Lax';
  const v = value.toLowerCase();
  if (v === 'strict') return 'Strict';
  if (v === 'none' || v === 'no_restriction') return 'None';
  return 'Lax'; // covers 'lax', 'unspecified', anything else
}

/** Ensure domain starts with a dot for cross-subdomain cookies */
function normalizeDomain(domain: string | undefined, fallback = '.x.com'): string {
  if (!domain) return fallback;
  // Playwright requires domain to start with dot for host-level matching
  // But some cookies (e.g. exact-host cookies) shouldn't have a dot.
  // Keep as-is if already correct; just ensure we have something.
  return domain;
}

/**
 * POST /api/accounts/[id]/cookies
 * Accepts a pasted cookie JSON array (from EditThisCookie / DevTools)
 * and saves it to the DB, marking the account as Active.
 *
 * Body: { cookies: Cookie[] }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { cookies, token, localStorage: localStorageData } = body;

    let normalised: any[] = [];

    if (token && typeof token === 'string' && token.trim()) {
      // Direct token import format
      normalised = [
        {
          name: 'auth_token',
          value: token.trim(),
          domain: '.x.com',
          path: '/',
          expires: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year expiration
          httpOnly: true,
          secure: true,
          sameSite: 'None',
        }
      ];
    } else {
      if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
        return NextResponse.json(
          { error: 'cookies or token must be provided' },
          { status: 400 }
        );
      }
    }

    const account = await prisma.account.findUnique({ where: { id } });
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Normalise to Playwright cookie format if we didn't get a token direct
    if (!token) {
      normalised = cookies.map((c: any) => ({
        name: String(c.name || ''),
        value: String(c.value ?? ''),
        domain: normalizeDomain(c.domain),
        path: c.path || '/',
        // EditThisCookie uses `expirationDate`, DevTools uses `expires`
        expires: typeof c.expirationDate === 'number'
          ? c.expirationDate
          : typeof c.expires === 'number'
          ? c.expires
          : -1,
        httpOnly: Boolean(c.httpOnly),
        secure: Boolean(c.secure),
        sameSite: normalizeSameSite(c.sameSite),
      })).filter((c: any) => c.name && c.value); // drop empty/invalid cookies
    }

    if (normalised.length === 0) {
      return NextResponse.json(
        { error: 'No valid cookies found after normalization.' },
        { status: 400 }
      );
    }

    await prisma.account.update({
      where: { id },
      data: {
        cookies: JSON.stringify(normalised),
        localStorage: localStorageData ? JSON.stringify(localStorageData) : undefined,
        status: 'Active',
      },
    });

    return NextResponse.json({
      message: `Cookies saved (${normalised.length} cookies). Account is now Active.`,
      count: normalised.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
