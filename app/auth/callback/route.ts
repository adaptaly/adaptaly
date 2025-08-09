// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  const url = new URL(request.url);

  // Accept optional ?next=/somewhere, default to /dashboard
  const nextParam = url.searchParams.get('next') || '/dashboard';

  // If Supabase already told us there's an error, go to /signin with details
  const error = url.searchParams.get('error');
  if (error) {
    const signin = new URL('/signin', url.origin);
    for (const key of ['error', 'error_code', 'error_description']) {
      const v = url.searchParams.get(key);
      if (v) signin.searchParams.set(key, v);
    }
    return NextResponse.redirect(signin);
  }

  // If there's an auth code, exchange it for a session
  const code = url.searchParams.get('code');
  if (code) {
    const supabase = await supabaseServer();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      const signin = new URL('/signin', url.origin);
      signin.searchParams.set('error', 'link_expired');
      return NextResponse.redirect(signin);
    }
  }

  // Double‑check we actually have a user after the exchange
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const signin = new URL('/signin', url.origin);
    signin.searchParams.set('error', 'link_expired');
    return NextResponse.redirect(signin);
  }

  // Success → into the app
  return NextResponse.redirect(new URL(nextParam, url.origin));
}