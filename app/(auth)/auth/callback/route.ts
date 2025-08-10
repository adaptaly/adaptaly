// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function expiredRedirect(origin: string) {
  const target = new URL('/signin', origin);
  target.searchParams.set('invalidLink', '1');
  target.searchParams.set('reason', 'expired');
  return target;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  // Supabase can return either:
  // 1) ?code=...                                           (PKCE / magic link)
  // 2) ?token_hash=...&type=signup|magiclink|recovery|...  (email confirmation)
  const code = url.searchParams.get('code');
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const providerErr =
    url.searchParams.get('error') || url.searchParams.get('error_description');

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Prepare a response to collect cookies, which we’ll copy onto our redirect.
  const cookieCarrier = new NextResponse();

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('[auth/callback] Missing env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
      return NextResponse.redirect(expiredRedirect(url.origin), {
        headers: cookieCarrier.headers,
      });
    }

    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            cookieCarrier.cookies.set(name, value, options);
          });
        },
      },
    });

    // Any explicit provider error → expired banner (no crash)
    if (providerErr) {
      console.warn('[auth/callback] Provider error:', providerErr);
      return NextResponse.redirect(expiredRedirect(url.origin), {
        headers: cookieCarrier.headers,
      });
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.warn('[auth/callback] exchangeCodeForSession error:', error.message);
        return NextResponse.redirect(expiredRedirect(url.origin), {
          headers: cookieCarrier.headers,
        });
      }
    } else if (token_hash && type) {
      const allowed = new Set(['signup', 'magiclink', 'recovery', 'invite', 'email_change']);
      const t = (type || '').toLowerCase();
      if (!allowed.has(t)) {
        console.warn('[auth/callback] Unexpected verify type:', t);
        return NextResponse.redirect(expiredRedirect(url.origin), {
          headers: cookieCarrier.headers,
        });
      }
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: t as 'signup' | 'magiclink' | 'recovery' | 'invite' | 'email_change',
      });
      if (error) {
        console.warn('[auth/callback] verifyOtp error:', error.message);
        return NextResponse.redirect(expiredRedirect(url.origin), {
          headers: cookieCarrier.headers,
        });
      }
    } else {
      console.warn('[auth/callback] No usable params found');
      return NextResponse.redirect(expiredRedirect(url.origin), {
        headers: cookieCarrier.headers,
      });
    }

    // Success → go to requested page or /dashboard
    const nextParam = url.searchParams.get('next');
    const nextPath = nextParam && nextParam.startsWith('/') ? nextParam : '/dashboard';
    return NextResponse.redirect(new URL(nextPath, url.origin), {
      headers: cookieCarrier.headers, // carry auth cookies forward
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[auth/callback] Uncaught error:', message);
    return NextResponse.redirect(expiredRedirect(url.origin), {
      headers: cookieCarrier.headers,
    });
  }
}