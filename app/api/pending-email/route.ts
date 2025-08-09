// app/api/pending-email/route.ts
import { NextRequest, NextResponse } from 'next/server';

const COOKIE = 'pending_email';

export async function GET(req: NextRequest) {
  const email = req.cookies.get(COOKIE)?.value ?? null;
  return NextResponse.json({ email });
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ ok: false }, { status: 200 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, email.trim().toLowerCase(), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
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