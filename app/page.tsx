// app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Root page guard:
 * - If Supabase (or the email client) lands on '/', forward
 *   any auth params to /auth/callback so the server handler can process them.
 */
export default function HomePage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    // 1) If query contains auth params, forward to /auth/callback?...
    const hasQueryAuth =
      params.has('code') ||
      params.has('error') ||
      params.has('error_code') ||
      params.has('error_description') ||
      params.has('access_token') ||
      params.has('refresh_token');

    if (hasQueryAuth) {
      const qs = params.toString();
      router.replace(`/auth/callback${qs ? `?${qs}` : ''}`);
      return;
    }

    // 2) If hash contains auth params, convert to query and forward
    //    Example: /#error=access_denied&error_code=otp_expired&...
    if (typeof window !== 'undefined' && window.location.hash) {
      const raw = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash;

      if (raw) {
        const hashParams = new URLSearchParams(raw);

        const hasHashAuth =
          hashParams.has('code') ||
          hashParams.has('error') ||
          hashParams.has('error_code') ||
          hashParams.has('error_description') ||
          hashParams.has('access_token') ||
          hashParams.has('refresh_token');

        if (hasHashAuth) {
          // Build a querystring from the hash and forward
          const qs = hashParams.toString();
          // Clear the hash and forward to callback
          window.location.replace(`/auth/callback${qs ? `?${qs}` : ''}`);
          return;
        }
      }
    }
  }, [router, params]);

  // If we reached here, there were no auth params – render your homepage.
  return (
    <main style={{ padding: 24 }}>
      {/* Replace with your real homepage content */}
      <h1>Adaptaly</h1>
      <p>Welcome to Adaptaly.</p>
    </main>
  );
}