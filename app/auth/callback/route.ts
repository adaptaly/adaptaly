// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/dashboard';

  const supabase = await supabaseServer();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const errUrl = new URL('/signin', url.origin);
      errUrl.searchParams.set('error', error.message);
      return NextResponse.redirect(errUrl);
    }
  }

  // Important: redirect on the same origin to carry cookies
  const redirectUrl = new URL(next, url.origin);
  return NextResponse.redirect(redirectUrl);
}