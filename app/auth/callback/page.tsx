// app/auth/callback/page.tsx
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';

// This page runs on the server. It exchanges the ?code=... from Supabase for a session cookie.
// If that succeeds, we redirect into the app. If it fails, we send the user to /signin with an error.
export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = await supabaseServer();

  const codeParam = searchParams?.code;
  const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;

  // If Supabase gave us a code, exchange it for a session cookie
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      redirect('/signin?error=link_expired');
    }
  }

  // Check whether we now have a user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // No user even after exchange => treat as expired/invalid link
    redirect('/signin?error=link_expired');
  }

  // Success — user is authenticated
  redirect('/dashboard');
}