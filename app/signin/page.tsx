// app/signin/page.tsx
'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseClient';
import './signin.css';

export const dynamic = 'force-dynamic';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

type Banner = { kind: 'error' | 'info' | 'success'; text: string; showResend?: boolean };
type Provider = { name: 'gmail' | 'outlook'; url: string };

function guessProvider(email: string): Provider {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  if (domain.includes('gmail') || domain.includes('googlemail')) {
    return { name: 'gmail', url: 'https://mail.google.com/mail/u/0/#inbox' };
  }
  if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) {
    return { name: 'outlook', url: 'https://outlook.live.com/mail/0/inbox' };
  }
  return { name: 'gmail', url: 'https://mail.google.com/mail/u/0/#inbox' };
}

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
  const [banner, setBanner] = useState<Banner | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);

  // prevents loop; also tells us if we came from /auth/callback with an auth error
  const handledParamsOnce = useRef(false);
  const suppressAutoRedirect = useRef(false);

  const emailValid = useMemo(() => emailRegex.test(email.trim()), [email]);
  const pwValid = useMemo(() => pw.trim().length > 0, [pw]);
  const formValid = emailValid && pwValid;

  // 1) Parse URL FIRST so we can suppress auto-redirect to /dashboard when coming from an auth error.
  function readFromUrl() {
    const q = {
      error: params.get('error'),
      error_code: params.get('error_code'),
      error_description: params.get('error_description'),
      email: params.get('email'),
      from: params.get('from'),
    };

    let hError: string | null = null;
    let hCode: string | null = null;
    let hDesc: string | null = null;
    let hEmail: string | null = null;
    let hFrom: string | null = null;

    if (typeof window !== 'undefined' && window.location.hash) {
      const raw = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
      const h = new URLSearchParams(raw);
      hError = h.get('error');
      hCode = h.get('error_code');
      hDesc = h.get('error_description');
      hEmail = h.get('email');
      hFrom = h.get('from');
    }

    return {
      error: q.error || hError,
      error_code: q.error_code || hCode,
      error_description: q.error_description || hDesc,
      email: q.email || hEmail,
      from: q.from || hFrom,
    };
  }

  useEffect(() => {
    if (handledParamsOnce.current) return;
    const { error, error_code, error_description, email: emailFromUrl, from } = readFromUrl();

    if (from === 'auth_error') suppressAutoRedirect.current = true;

    if (emailFromUrl && !email) {
      let decoded = emailFromUrl;
      try { decoded = decodeURIComponent(emailFromUrl); } catch {}
      setEmail(decoded);
      setProvider(guessProvider(decoded));
    }

    if (error || error_code || error_description) {
      handledParamsOnce.current = true;

      const isExpired = error_code === 'otp_expired';
      const text = isExpired
        ? 'Your verification link has expired or is invalid. We can resend it to the same email.'
        : decodeURIComponent(error_description || error || 'Link invalid. Please sign in again.');

      setBanner({ kind: 'error', text, showResend: true });

      // strip query/hash so the banner doesn't persist on refresh
      router.replace('/signin');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, router]);

  // 2) Only after the above runs, check if already signed in → /dashboard
  useEffect(() => {
    (async () => {
      if (suppressAutoRedirect.current) return;
      const { data } = await supabase.auth.getUser();
      if (data.user) router.replace('/dashboard');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resend verification — uses captured email if available; otherwise asks user to type it and keeps the button visible.
  const resendVerification = async () => {
    const to = (email || '').trim();

    if (!emailRegex.test(to)) {
      setTouched((t) => ({ ...t, email: true }));
      setBanner({
        kind: 'error',
        text: 'We couldn’t detect your email from the link. Enter it above, then tap “Resend email”.',
        showResend: true, // keep the button right inside the error
      });
      return;
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: to,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=/dashboard&email=${encodeURIComponent(to)}`,
      },
    });
    if (error) {
      setBanner({ kind: 'error', text: error.message, showResend: true });
      return;
    }

    const guessed = guessProvider(to);
    setProvider(guessed);
    setBanner({ kind: 'success', text: 'Verification email sent. Check your inbox.' });

    try {
      window.open(guessed.url, '_blank', 'noopener,noreferrer');
    } catch {}
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, pw: true });

    if (!formValid) {
      const problems: string[] = [];
      if (!emailValid) problems.push('Enter a valid email address.');
      if (!pwValid) problems.push('Enter your password.');
      setBanner({ kind: 'error', text: problems.join(' '), showResend: true });
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
        setBanner({ kind: 'error', text: 'Email or password is incorrect.', showResend: true });
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
          <div
            className="si-alert"
            role={banner.kind === 'error' ? 'alert' : 'status'}
            aria-live="polite"
            style={
              banner.kind === 'info'
                ? { background: '#f5fbff', borderColor: 'rgba(59,130,246,0.25)', color: '#1e3a8a' }
                : banner.kind === 'success'
                ? { background: '#f0fff4', borderColor: 'rgba(34,197,94,0.25)', color: '#065f46' }
                : undefined
            }
          >
            {banner.text}{' '}
            {banner.showResend && (
              <button
                type="button"
                onClick={resendVerification}
                style={{ border: 0, background: 'transparent', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
              >
                Resend email
              </button>
            )}
            {!banner.showResend && provider && (
              <>
                {' '}
                <a href={provider.url} target="_blank" rel="noreferrer" className="si-forgot" style={{ padding: 0 }}>
                  Open {provider.name === 'gmail' ? 'Gmail' : 'Outlook'}
                </a>
              </>
            )}
          </div>
        )}

        <form className="si-form" onSubmit={onSubmit} noValidate>
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setProvider(guessProvider(e.target.value));
                }}
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
            <button
              type="submit"
              className="si-btn-primary"
              disabled={!formValid || submitting}
              aria-busy={submitting}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
              {submitting && <span className="si-spinner" aria-hidden="true" />}
            </button>

            <div className="si-footer">
              <span className="small">New to Adaptaly?</span>
              <a href="/signup" className="link">Create an account</a>
            </div>
          </div>
        </form>

        {provider && (
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <a href={provider.url} target="_blank" rel="noreferrer" className="si-forgot" style={{ padding: 0 }}>
              Open {provider.name === 'gmail' ? 'Gmail' : 'Outlook'}
            </a>
          </div>
        )}
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