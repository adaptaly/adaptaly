// app/(auth)/reset/confirm/page.tsx
import { Suspense } from 'react';
import ConfirmClient from './ConfirmClient';
import './confirm.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="rc-background">
          <section className="rc-card"><div className="rc-loading">Loading…</div></section>
        </main>
      }
    >
      <ConfirmClient />
    </Suspense>
  );
}