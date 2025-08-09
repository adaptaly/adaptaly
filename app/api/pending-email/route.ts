// app/api/pending-email/route.ts
import { NextRequest, NextResponse } from 'next/server';

const COOKIE = 'pending_email';

export async function GET() {
  const res = NextResponse.json({ email: null });
  // Nothing to do here, we just want the cookie value
  return res;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }
    const res = NextResponse.json({ ok: true });
    // 7 days, secure in production
    res.cookies.set(COOKIE, email.trim().toLowerCase(), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}