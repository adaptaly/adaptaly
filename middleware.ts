// middleware.ts (at project root)
import { NextResponse, NextRequest } from 'next/server';

/**
 * Run on all “real” app routes and preserve path + query.
 * This prevents magic links like
 *   https://adaptaly.com/auth/callback?code=...
 * from losing `?code=...` when we bounce to www.
 */
export const config = {
  matcher: [
    // everything except Next internals, static assets, and API routes you might want to skip
    '/((?!_next/|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|css|js|map|txt|xml|woff|woff2)|favicon\\.ico).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = new URL(req.url);

  // 1) Canonicalize domain → force www (keep path + search)
  // If you prefer apex, flip 'adaptaly.com' and 'www.adaptaly.com' accordingly.
  if (url.hostname === 'adaptaly.com') {
    url.hostname = 'www.adaptaly.com';
    return NextResponse.redirect(url, 308); // 308 preserves method and is safe for auth links
  }

  // 2) Otherwise let the request through unchanged
  return NextResponse.next();
}