// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

const PENDING_COOKIE = 'pending_email';

function signinRedirect(origin: string, params: Record<string, string | undefined>) {
  const target = new URL('/signin', origin);
  target.searchParams.set('invalidLink', '1');
  for (const [k, v] of Object.entries(params)) if (v) target.searchParams.set(k, v);
  return target;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next');
  let email = url.searchParams.get('email') || req.cookies.get(PENDING_COOKIE)?.value || undefined;

  const nextPath = nextParam && nextParam.startsWith('/') ? nextParam : '/dashboard';

  // No code or provider error → bounce to sign-in with email if we have it
  const providerErr = url.searchParams.get('error') || url.searchParams.get('error_description');
  if (!code || providerErr) {
    return NextResponse.redirect(
      signinRedirect(url.origin, { email, reason: providerErr ?? 'invalid_or_expired_link' })
    );
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      signinRedirect(url.origin, { email, reason: error.message })
    );
  }

  // Success → clear cookie and go next
  const res = NextResponse.redirect(new URL(nextPath, url.origin));
  res.cookies.set(PENDING_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}