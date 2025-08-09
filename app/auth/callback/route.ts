// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const PENDING_COOKIE = 'pending_email';

function signinRedirect(origin: string, params: Record<string, string | undefined>) {
  const target = new URL('/signin', origin);
  target.searchParams.set('invalidLink', '1');
  for (const [k, v] of Object.entries(params)) {
    if (v) target.searchParams.set(k, v);
  }
  return target;
}

async function emailFromUid(uid: string | null) {
  if (!uid) return null;
  try {
    const admin = await supabaseAdmin();
    const { data, error } = await admin
      .schema('auth')
      .from('users')
      .select('email')
      .eq('id', uid)
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data?.email ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next');
  const uid = url.searchParams.get('uid');
  let email = url.searchParams.get('email');
  const errorParam = url.searchParams.get('error') || url.searchParams.get('error_description');

  // Try cookie if email missing
  if (!email) {
    email = req.cookies.get(PENDING_COOKIE)?.value || null;
  }
  // Try admin lookup by uid if still missing
  if (!email && uid) {
    email = await emailFromUid(uid);
  }

  const nextPath = nextParam && nextParam.startsWith('/') ? nextParam : '/dashboard';

  // If no code or provider error → bounce to /signin carrying as much context as possible
  if (!code || errorParam) {
    return NextResponse.redirect(
      signinRedirect(url.origin, {
        email: email ?? undefined,
        reason: errorParam ?? 'invalid_or_expired_link',
      }),
    );
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      signinRedirect(url.origin, {
        email: email ?? undefined,
        reason: error.message,
      }),
    );
  }

  // Success: optional cleanup cookie, then go next
  const res = NextResponse.redirect(new URL(nextPath, url.origin));
  res.cookies.set(PENDING_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}