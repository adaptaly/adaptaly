// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

function safeNext(input: string | null): string {
  if (!input) return '/dashboard';
  try {
    // only allow same-origin, path-only next values
    const u = new URL(input, 'https://example.org');
    return u.pathname.startsWith('/') ? u.pathname + (u.search || '') : '/dashboard';
  } catch {
    return '/dashboard';
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const error = url.searchParams.get('error');
  const code = url.searchParams.get('code');
  const next = safeNext(url.searchParams.get('next'));

  // If Supabase sent an error (expired/invalid/used link), go to /signin with details.
  if (error) {
    const signin = new URL('/signin', url.origin);
    for (const key of ['error', 'error_code', 'error_description']) {
      const v = url.searchParams.get(key);
      if (v) signin.searchParams.set(key, v);
    }
    return NextResponse.redirect(signin);
  }

  // If we have a code, exchange it for a session cookie
  if (code) {
    const supabase = await supabaseServer();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      const signin = new URL('/signin', url.origin);
      signin.searchParams.set('error', exchangeError.message);
      return NextResponse.redirect(signin);
    }
  }

  // Success → go to the app (default /dashboard)
  return NextResponse.redirect(new URL(next || '/dashboard', url.origin));
}