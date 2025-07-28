"use client";

import { useRouter } from 'next/navigation';
import UploadFiles from './uploadfiles/UploadFiles';

export default function Page() {
  const router = useRouter();

  const handleUpload = async (text: string) => {
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });

      const data = await response.json();
      router.push(`/results?output=${encodeURIComponent(data.result)}`);
    } catch (error) {
      console.error('Failed to process text', error);
    }
  };

  return <UploadFiles />;
}
