// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  const url = new URL(request.url);

  // If Supabase sends an error (expired/invalid/used link), go to /signin with the error.
  const error = url.searchParams.get('error');
  if (error) {
    const signin = new URL('/signin', url.origin);
    // pass through the error details so the UI can show a friendly message
    for (const key of ['error', 'error_code', 'error_description']) {
      const v = url.searchParams.get(key);
      if (v) signin.searchParams.set(key, v);
    }
    return NextResponse.redirect(signin);
  }

  // If there is a code, exchange it for a session cookie.
  const code = url.searchParams.get('code');
  if (code) {
    const supabase = await supabaseServer();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      const signin = new URL('/signin', url.origin);
      signin.searchParams.set('error', exchangeError.message);
      return NextResponse.redirect(signin);
    }
  }

  // Success → go where the link told us, else default to /dashboard.
  const next = url.searchParams.get('next') || '/dashboard';
  return NextResponse.redirect(new URL(next, url.origin));
}