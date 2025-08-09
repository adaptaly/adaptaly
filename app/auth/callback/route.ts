// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  const url = new URL(request.url);

  // Accept ?next and ?email; default next to /dashboard
  const nextParam = url.searchParams.get('next') || '/dashboard';
  const emailParam = url.searchParams.get('email') || '';

  // If Supabase sent an error (e.g., otp_expired), forward to /signin (carry email)
  const error = url.searchParams.get('error');
  if (error) {
    const signin = new URL('/signin', url.origin);
    for (const key of ['error', 'error_code', 'error_description']) {
      const v = url.searchParams.get(key);
      if (v) signin.searchParams.set(key, v);
    }
    if (emailParam) signin.searchParams.set('email', emailParam);
    return NextResponse.redirect(signin);
  }

  // Exchange ?code for a session cookie
  const code = url.searchParams.get('code');
  if (code) {
    const supabase = await supabaseServer();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      const signin = new URL('/signin', url.origin);
      signin.searchParams.set('error', 'access_denied');
      signin.searchParams.set('error_code', 'otp_expired');
      signin.searchParams.set('error_description', 'Email link is invalid or has expired');
      if (emailParam) signin.searchParams.set('email', emailParam);
      return NextResponse.redirect(signin);
    }
  }

  // Double-check we actually have a user
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const signin = new URL('/signin', url.origin);
    signin.searchParams.set('error', 'access_denied');
    signin.searchParams.set('error_code', 'otp_expired');
    signin.searchParams.set('error_description', 'Email link is invalid or has expired');
    if (emailParam) signin.searchParams.set('email', emailParam);
    return NextResponse.redirect(signin);
  }

  // Success → go to next or /dashboard
  return NextResponse.redirect(new URL(nextParam, url.origin));
}