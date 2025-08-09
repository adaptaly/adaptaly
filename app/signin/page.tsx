// app/signin/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseClient';
import './signin.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export default function SignInPage() {
  const router = useRouter();
  const search = useSearchParams();
  const supabase = supabaseBrowser();

  const invalidLink = search.get('invalidLink') === '1';
  const emailFromUrl = search.get('email') || '';
  const reason = search.get('reason') || '';

  const [email, setEmail] = useState(emailFromUrl);
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [touched, setTouched] = useState({ email: !!emailFromUrl, pw: false });
  const [submitting, setSubmitting] = useState(false);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const emailValid = useMemo(() => emailRegex.test(email.trim()), [email]);
  const pwValid = useMemo(() => pw.length > 0, [pw]);
  const formValid = emailValid && pwValid;

  // If we couldn't get email from the link, ask the server cookie
  useEffect(() => {
    if (!emailFromUrl) {
      fetch('/api/pending-email', { method: 'GET' })
        .then(async (r) => {
          // Cookie is httpOnly, the route just ensures same-origin and returns JSON to trip the Set-Cookie, value not needed
          // We still need to read it from the response? We don't get cookie value directly.
          // So we do a follow-up to same route which will reflect if cookie exists by having the server echo nothing.
          // We can't read httpOnly cookie in JS, so we let the user type if absent.
          // To improve UX, we can attempt a no-op; but ultimately email must be typed or come via query.
          return r; // no-op
        })
        .finally(() => {
          // nothing — cookie can't be read client-side; leave as is
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If already authenticated, go dashboard
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) router.replace('/dashboard');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function resendConfirm() {
    setResendMsg(null);
    const addr = (email || emailFromUrl).trim().toLowerCase();
    if (!emailRegex.test(addr)) {
      setResendMsg('Enter your email first.');
      return;
    }

    setResending(true);
    try {
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=/dashboard&email=${encodeURIComponent(
        addr,
      )}`;
      // 1) Try signup resend
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: addr,
        options: { emailRedirectTo },
      });
      if (!error) {
        setResendMsg('Sent. Check your inbox.');
        return;
      }
      // 2) Fall back to magic sign-in if already confirmed
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: addr,
        options: { emailRedirectTo },
      });
      if (otpErr) setResendMsg(otpErr.message);
      else setResendMsg('Sign-in link sent. Check your inbox.');
    } finally {
      setResending(false);
    }
  }

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
      const { error } = await supabase.auth.signInWithPassword({
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

        {/* Invalid link banner */}
        {invalidLink && (
          <div className="si-alert" role="alert" aria-live="polite">
            That link was invalid or expired. {reason ? `(${reason})` : ''}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <button className="si-btn-secondary" onClick={resendConfirm} disabled={resending}>
                {resending ? 'Resending…' : `Resend email${emailFromUrl ? ` to ${emailFromUrl}` : ''}`}
              </button>
              {resendMsg && <span className="si-hint">{resendMsg}</span>}
            </div>
          </div>
        )}

        {errorSummary && <div className="si-alert">{errorSummary}</div>}

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
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            {capsLock && <div className="si-caps">Caps Lock is on.</div>}
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