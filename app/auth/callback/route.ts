// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

function safeNext(raw: string | null): string {
  if (!raw) return '/dashboard';
  if (!raw.startsWith('/')) return '/dashboard';
  if (raw.startsWith('//')) return '/dashboard';
  return raw;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const type = url.searchParams.get('type'); // 'recovery' for password reset
  const nextParam = url.searchParams.get('next');

  // For recovery emails, default to the confirm page if next is not passed
  let onSuccess = safeNext(nextParam);
  if (!nextParam && type === 'recovery') onSuccess = '/reset/confirm';

  const onError = type === 'recovery' ? '/reset?invalidLink=1' : '/signin?error=callback';

  if (!code) {
    return NextResponse.redirect(new URL('/signin', url.origin));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL('/signin?error=env', url.origin));
  }

  // Collect Set-Cookie from Supabase on a passthrough response
  const cookieCollector = NextResponse.next();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name: string) => request.cookies.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => {
        cookieCollector.cookies.set({ name, value, ...options });
      },
      remove: (name: string, options: CookieOptions) => {
        cookieCollector.cookies.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  const target = error ? onError : onSuccess;
  const redirect = NextResponse.redirect(new URL(target, url.origin));
  cookieCollector.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  redirect.headers.set('Cache-Control', 'no-store');
  return redirect;
}