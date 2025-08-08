// middleware.ts (project root)
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_PREFIXES = ['/dashboard', '/results'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard specific paths
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!needsAuth) {
    return NextResponse.next();
  }

  // Prepare a response we can mutate cookies on
  const res = NextResponse.next();

  // Create a Supabase server client that reads/writes cookies via middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // read cookies from the request
        getAll: () =>
          req.cookies.getAll().map(({ name, value }) => ({ name, value })),
        // write any auth cookie updates to the response
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            // NextResponse.cookies.set accepts a single object
            res.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  // Check current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect unauthenticated users to /signin, preserving where they were headed
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/results/:path*'],
};