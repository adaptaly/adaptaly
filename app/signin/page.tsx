// app/signin/page.tsx
'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseClient';
import './signin.css';

// Avoid static prerender issues with useSearchParams in Next 15
export const dynamic = 'force-dynamic';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function SignInInner() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = supabaseBrowser();

  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const [touched, setTouched] = useState({ email: false, pw: false });
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);

  const emailValid = useMemo(() => emailRegex.test(email.trim()), [email]);
  const pwValid = useMemo(() => pw.trim().length > 0, [pw]);
  const formValid = emailValid && pwValid;

  // If already authenticated, go straight to dashboard
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) router.replace('/dashboard');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show a clear error when the callback indicated an expired/invalid link
  useEffect(() => {
    const err = params.get('error');
    if (err === 'link_expired') {
      setBanner({ kind: 'error', text: 'Your verification link has expired or is invalid. Please sign in to request a new one.' });
    }
  }, [params]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, pw: true });

    if (!formValid) {
      const problems: string[] = [];
      if (!emailValid) problems.push('Enter a valid email address.');
      if (!pwValid) problems.push('Enter your password.');
      setBanner({ kind: 'error', text: problems.join(' ') });
      return;
    }

    setBanner(null);
    try {
      setSubmitting(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pw,
      });
      if (error) {
        setBanner({ kind: 'error', text: 'Email or password is incorrect.' });
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
        <div className="si-topbar">
          <button type="button" className="si-back" onClick={() => router.back()} aria-label="Go back">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Back</span>
          </button>
        </div>

        <header className="si-head">
          <h1 id="si-title" className="si-title">Sign in</h1>
          <p className="si-subtitle">Welcome back to Adaptaly.</p>
        </header>

        {banner && (
          <div className="si-alert" role={banner.kind === 'error' ? 'alert' : 'status'} aria-live="polite">
            {banner.text}
          </div>
        )}

        <form className="si-form" onSubmit={submit} noValidate>
          {/* Email */}
          <div className="si-field">
            <label htmlFor="email" className="si-label">Email address</label>
            <div className={`si-input-wrap ${touched.email && !emailValid ? 'is-invalid' : ''} ${emailValid ? 'is-valid' : ''}`}>
              <svg className="si-input-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16v12H4z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoComplete="email"
                className="si-input has-icon"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                aria-invalid={touched.email && !emailValid}
              />
              {emailValid && (
                <svg className="si-valid-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div className={`si-hint ${touched.email && !emailValid ? 'is-error' : ''}`}>
              {touched.email && !emailValid ? 'Enter a valid email like name@example.com.' : 'Use the email you signed up with.'}
            </div>
          </div>

          {/* Password */}
          <div className="si-field">
            <div className="si-label-row">
              <label htmlFor="password" className="si-label">Password</label>
              <a className="si-forgot" href="/reset">Forgot password?</a>
            </div>
            <div className={`si-input-wrap ${touched.pw && !pwValid ? 'is-invalid' : ''}`}>
              <svg className="si-input-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 10h12v10H6z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 10V8a4 4 0 118 0v2" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoCapitalize="none"
                autoComplete="current-password"
                className="si-input has-icon has-trailing"
                placeholder="Your password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, pw: true }))}
                onKeyUp={(e) => setCapsLock(e.getModifierState && e.getModifierState('CapsLock'))}
                aria-invalid={touched.pw && !pwValid}
              />
              <button
                type="button"
                className="si-toggle"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M10.6 10.6a3 3 0 004.24 4.24" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                )}
              </button>
            </div>

            {capsLock && <div className="si-caps" role="note">Caps Lock is on.</div>}
            <div className={`si-hint ${touched.pw && !pwValid ? 'is-error' : ''}`}>
              {touched.pw && !pwValid ? 'Enter your password.' : 'Passwords are case-sensitive.'}
            </div>
          </div>

          <div className="si-actions">
            <button type="submit" className="si-btn-primary" disabled={!formValid || submitting} aria-busy={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
              {submitting && <span className="si-spinner" aria-hidden="true" />}
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

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}