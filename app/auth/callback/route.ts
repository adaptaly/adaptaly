import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  // Start with an empty response for cookie setting
  const res = new NextResponse();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          req.cookies.getAll().map(({ name, value }) => ({ name, value })),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const url = new URL(req.url);
  const nextPath = url.searchParams.get('next') || '/dashboard';
  const code = url.searchParams.get('code');

  const safeNext =
    nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/dashboard';

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        const fail = new URL('/signin', url.origin);
        fail.searchParams.set('error', 'oauth_failed');
        return NextResponse.redirect(fail, { headers: res.headers });
      }
    } else {
      await supabase.auth.getUser();
    }

    return NextResponse.redirect(new URL(safeNext, url.origin), {
      headers: res.headers,
    });
  } catch {
    const fail = new URL('/signin', url.origin);
    fail.searchParams.set('error', 'oauth_failed');
    return NextResponse.redirect(fail, { headers: res.headers });
  }
}