// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function expiredRedirect(origin: string) {
  const target = new URL('/signin', origin);
  target.searchParams.set('invalidLink', '1');
  target.searchParams.set('reason', 'expired');
  return target;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  // Supabase may return either:
  // 1) ?code=...  (magic link / OTP)
  // 2) ?token_hash=...&type=signup|magiclink|recovery|invite|email_change  (email confirmation flows)
  const code = url.searchParams.get('code');
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const providerErr = url.searchParams.get('error') || url.searchParams.get('error_description');

  // Prepare a response so Supabase can set auth cookies on it
  const intermediate = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            intermediate.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Any explicit provider error → expired
  if (providerErr) {
    return NextResponse.redirect(expiredRedirect(url.origin), {
      headers: intermediate.headers,
    });
  }

  // Handle both Supabase redirect shapes
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(expiredRedirect(url.origin), {
        headers: intermediate.headers,
      });
    }
  } else if (token_hash && type) {
    // Only allow expected types
    const allowed = new Set(['signup', 'magiclink', 'recovery', 'invite', 'email_change']);
    const t = type.toLowerCase();
    if (!allowed.has(t)) {
      return NextResponse.redirect(expiredRedirect(url.origin), {
        headers: intermediate.headers,
      });
    }
    const { error } = await supabase.auth.verifyOtp({
      type: t as
        | 'signup'
        | 'magiclink'
        | 'recovery'
        | 'invite'
        | 'email_change',
      token_hash,
    });
    if (error) {
      return NextResponse.redirect(expiredRedirect(url.origin), {
        headers: intermediate.headers,
      });
    }
  } else {
    // Nothing useful in the URL
    return NextResponse.redirect(expiredRedirect(url.origin), {
      headers: intermediate.headers,
    });
  }

  // Success → go where asked, else /dashboard
  const nextParam = url.searchParams.get('next');
  const nextPath = nextParam && nextParam.startsWith('/') ? nextParam : '/dashboard';

  return NextResponse.redirect(new URL(nextPath, url.origin), {
    headers: intermediate.headers, // carries auth cookies forward
  });
}