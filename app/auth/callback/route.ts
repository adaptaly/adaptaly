// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

function buildSigninRedirect(origin: string, params: URLSearchParams) {
  const target = new URL('/signin', origin);
  // Pass through context for your SignIn page to read
  const passthrough = ['email', 'error', 'error_code', 'error_description', 'from'];
  for (const k of passthrough) {
    const v = params.get(k);
    if (v) target.searchParams.set(k, v);
  }
  // helps your page suppress auto redirect while showing the banner
  if (!target.searchParams.has('from')) target.searchParams.set('from', 'auth_error');
  return target;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next');
  const email = url.searchParams.get('email') || '';
  const error = url.searchParams.get('error') || url.searchParams.get('error_code');

  // If provider sent an error or there is no code, bounce to /signin with details
  if (error || !code) {
    return NextResponse.redirect(buildSigninRedirect(url.origin, url.searchParams));
  }

  // Try to exchange the code for a session
  const supabase = await supabaseServer();
  const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);

  if (exErr) {
    const params = new URLSearchParams();
    params.set('email', email);
    params.set('error_code', 'exchange_failed');
    params.set('error_description', exErr.message);
    params.set('from', 'auth_error');
    return NextResponse.redirect(buildSigninRedirect(url.origin, params));
  }

  // Success. Route to next or dashboard.
  const nextPath = nextParam && nextParam.startsWith('/') ? nextParam : '/dashboard';
  return NextResponse.redirect(new URL(nextPath, url.origin));
}