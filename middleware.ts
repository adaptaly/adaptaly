// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const PASS_THROUGH_PREFIXES = [
  '/auth/callback',
  '/reset',            // includes /reset and /reset/confirm
];

const AUTH_PAGES = ['/signin', '/signup'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static and Next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots') ||
    pathname.startsWith('/sitemap') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|txt|xml|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  // Do not interfere with callback and reset flows
  if (PASS_THROUGH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Prepare response that can receive cookies from Supabase
  const res = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name: string) => req.cookies.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => {
        res.cookies.set({ name, value, ...options });
      },
      remove: (name: string, options: CookieOptions) => {
        res.cookies.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect your app pages
  const requiresAuth =
    pathname.startsWith('/dashboard'); // add more protected prefixes as needed

  if (requiresAuth && !user) {
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // If already signed in, keep users away from signin or signup
  if (AUTH_PAGES.includes(pathname) && user) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ['/((?!api/|_next/|static/|.*\\..*).*)'],
};