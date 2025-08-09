// app/page.tsx
'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// This page must be dynamic because we read URL params at runtime
export const dynamic = 'force-dynamic';

function RootForwarder() {
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
    if (typeof window !== 'undefined' && window.location.hash) {
      const raw = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash;

      if (raw) {
        const h = new URLSearchParams(raw);
        const hasHashAuth =
          h.has('code') ||
          h.has('error') ||
          h.has('error_code') ||
          h.has('error_description') ||
          h.has('access_token') ||
          h.has('refresh_token');

        if (hasHashAuth) {
          const qs = h.toString();
          // Use a hard replace to also clear the hash in the URL bar
          window.location.replace(`/auth/callback${qs ? `?${qs}` : ''}`);
          return;
        }
      }
    }
  }, [router, params]);

  // If we reached here, there were no auth params — render your homepage.
  return (
    <main style={{ padding: 24 }}>
      {/* swap this with your real homepage UI */}
      <h1>Adaptaly</h1>
      <p>Welcome to Adaptaly.</p>
    </main>
  );
}

export default function HomePage() {
  // Wrap the component that calls useSearchParams with Suspense (Next 15 requirement)
  return (
    <Suspense fallback={null}>
      <RootForwarder />
    </Suspense>
  );
}