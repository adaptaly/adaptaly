// app/(auth)/signin/Client.tsx
'use client';

import './signin.css';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser, supabaseForAuth } from '@/lib/supabaseClient';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

// If you already have a baseUrl helper, use that instead
const baseUrl =
  (typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_SITE_URL
    : process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
  )?.replace(/\/$/, '') || 'https://www.adaptaly.com';

export default function SignInPageClient() {
  const router = useRouter();
  const search = useSearchParams();

  // Default client (no args)
  const supabase = supabaseBrowser();

  const invalidLink = search.get('invalidLink') === '1';

  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [remember, setRemember] = useState(true); // drives persistSession
  const [showPw, setShowPw] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [touched, setTouched] = useState({ email: false, pw: false });
  const [submitting, setSubmitting] = useState(false);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const emailValid = useMemo(() => emailRegex.test(email.trim()), [email]);
  const pwValid = useMemo(() => pw.length > 0, [pw]);
  const formValid = emailValid && pwValid;

  // If already authenticated → /dashboard
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) router.replace('/dashboard');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithGoogle = async () => {
    if (isGoogleLoading || submitting) return;
    setIsGoogleLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${baseUrl}/auth/callback?next=/dashboard`,
        },
      });
      // redirects away
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, pw: true });

    if (!formValid) {
      const problems: string[] = [];
      if (!emailValid) problems.push('Enter a valid email address.');
      if (!pwValid) problems.push('Enter your password.');
      setErrorSummary(problems.join(' '));
      return;
    }

    setErrorSummary(null);
    setSubmitting(true);
    try {
      // IMPORTANT: create a one-off client with chosen persistence
      const sb = supabaseForAuth(remember);

      const { error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password: pw,
      });
      if (error) {
        setErrorSummary(error.message);
        return;
      }
      router.push('/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="si-background" role="main">
      <section className="si-card" aria-labelledby="si-title">
        <header className="si-head">
          <h1 id="si-title" className="si-title">Sign in</h1>
        </header>

        {invalidLink && (
          <div className="si-alert" role="alert" aria-live="polite">
            This verification link has expired. Please sign in with your email and password.
          </div>
        )}
        {errorSummary && <div className="si-alert" role="alert">{errorSummary}</div>}

        {/* (Optional) Google button if you kept it */}
        {/* <button type="button" className="si-btn-google" onClick={signInWithGoogle} disabled={isGoogleLoading || submitting}> ... </button>
        <div className="si-oauth-or" aria-hidden="true"><div className="line" /><div className="text">or</div><div className="line" /></div> */}

        <form className="si-form" onSubmit={submit} noValidate>
          {/* Email */}
          <div className="si-field">
            <label htmlFor="email" className="si-label">Email address</label>
            <div className={`si-input-wrap ${touched.email && !emailValid ? 'is-invalid' : ''}`}>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoComplete="email"
                className="si-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              />
            </div>
          </div>

          {/* Password */}
          <div className="si-field">
            <div className="si-label-row">
              <label htmlFor="password" className="si-label">Password</label>
              <a className="si-forgot" href="/reset">Forgot password?</a>
            </div>
            <div className={`si-input-wrap ${touched.pw && !pwValid ? 'is-invalid' : ''}`}>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoCapitalize="none"
                autoComplete="current-password"
                className="si-input has-trailing"
                placeholder="Your password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, pw: true }))}
                onKeyUp={(e) => setCapsLock(e.getModifierState?.('CapsLock') ?? false)}
              />
              <button
                type="button"
                className="si-toggle"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                title={showPw ? 'Hide password' : 'Show password'}
              >
                {/* your eye icon(s) */}
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </button>
            </div>
            {capsLock && <div className="si-caps">Caps Lock is on.</div>}
          </div>

          {/* Remember me */}
          <div className="si-row">
            <label className="si-remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                aria-label="Remember me"
              />
              Remember me
            </label>
          </div>

          <div className="si-actions">
            <button type="submit" className="si-btn-primary" disabled={!formValid || submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
            <div className="si-footer">
              <span className="small">New to Adaptaly?</span>
              <a href="/signup" className="link">Create an account</a>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}