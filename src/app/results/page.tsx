"use client";

import { useSearchParams } from 'next/navigation';

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const output = searchParams.get('output') ?? '';

  return (
    <div style={{ padding: '2rem' }}>
      <h1>AI Response</h1>
      <pre>{output}</pre>
    </div>
  );
}
