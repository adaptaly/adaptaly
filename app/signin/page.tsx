// app/signin/page.tsx
import { Suspense } from 'react';
import SignInPageClient from './Client';

export const dynamic = 'force-dynamic'; // required because we use useSearchParams in the client

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SignInPageClient />
    </Suspense>
  );
}