import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

function safeNext(raw: string | null): string {
  // Only allow same-origin relative paths
  if (!raw) return '/dashboard';
  if (!raw.startsWith('/')) return '/dashboard';
  if (raw.startsWith('//')) return '/dashboard';
  return raw;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const type = url.searchParams.get('type'); // 'recovery' for password reset, etc.
  const nextParam = url.searchParams.get('next');

  // If no 'next' provided but it's a recovery link, default to the confirm page.
  let onSuccess = safeNext(nextParam);
  if (!nextParam && type === 'recovery') {
    onSuccess = '/reset/confirm';
  }

  // Where to send users if exchange fails
  const onError = type === 'recovery' ? '/reset?invalidLink=1' : '/signin?error=callback';

  // Missing code -> bounce to sign in
  if (!code) {
    return NextResponse.redirect(new URL('/signin', url.origin));
  }

  // Read both env variants to be safe
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Hard fail early if env is misconfigured
    return NextResponse.redirect(new URL('/signin?error=env', url.origin));
  }

  // We collect cookies on a non-redirect response, then copy them to the final redirect.
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

  // Copy any Set-Cookie headers from the Supabase exchange onto the redirect response
  cookieCollector.cookies.getAll().forEach((c) => redirect.cookies.set(c));

  // Avoid caching this redirect
  redirect.headers.set('Cache-Control', 'no-store');

  return redirect;
}