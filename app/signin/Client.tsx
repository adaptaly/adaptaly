// app/signin/Client.tsx
'use client';

import './signin.css';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseClient';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function friendlyReason(raw?: string | null) {
  const r = (raw || '').toLowerCase();
  if (r.includes('access_denied')) return 'That link was already used or expired.';
  if (r.includes('expired')) return 'That link expired.';
  if (r.includes('invalid')) return 'That link was invalid.';
  return 'That link was invalid or expired.';
}

export default function SignInPageClient() {
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

  // resend state
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const emailValid = useMemo(() => emailRegex.test(email.trim()), [email]);
  const pwValid = useMemo(() => pw.length > 0, [pw]);
  const formValid = emailValid && pwValid;

  // Auto-prefill from cookie if URL didn't have it
  useEffect(() => {
    if (!emailFromUrl) {
      fetch('/api/pending-email', { method: 'GET' })
        .then((r) => r.json())
        .then((j) => {
          if (j?.email && emailRegex.test(j.email)) {
            setEmail(j.email);
            setTouched((t) => ({ ...t, email: true }));
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If already authenticated → /dashboard
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
      setResendMsg('We couldn’t recover your email. Please type it above and try again.');
      return;
    }

    setResending(true);
    try {
      const base =
        (typeof window === 'undefined'
          ? process.env.NEXT_PUBLIC_SITE_URL
          : process.env.NEXT_PUBLIC_SITE_URL || window.location.origin) || 'https://www.adaptaly.com';

      const emailRedirectTo = `${base.replace(/\/$/, '')}/auth/callback?next=/dashboard&email=${encodeURIComponent(
        addr
      )}`;

      // 1) Try resend of the signup confirmation
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: addr,
        options: { emailRedirectTo },
      });

      if (!error) {
        setResendMsg(`We sent a fresh link to ${addr}. Check your inbox.`);
        return;
      }

      // 2) If the account is already confirmed or blocked by policy → magic sign-in link
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: addr,
        options: { emailRedirectTo },
      });

      if (otpErr) {
        // Show helpful hint if this is a redirect URL config issue
        const hint = otpErr.message.toLowerCase().includes('redirect') || otpErr.message.toLowerCase().includes('url')
          ? ' Make sure your production domain is added in Supabase Auth → URL Configuration → Additional Redirect URLs.'
          : '';
        setResendMsg(`Couldn’t send the email: ${otpErr.message}.${hint}`);
      } else {
        setResendMsg(`We sent a sign-in link to ${addr}. Check your inbox.`);
      }
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

        {/* Invalid link banner — friendly, email prefilled, one-click resend */}
        {invalidLink && (
          <div className="si-alert" role="alert" aria-live="polite">
            {friendlyReason(reason)} {!email && 'We tried to recover your email from the link and your device.'}
            {email && <> I can send a new link to <strong>{email}</strong>.</>}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <button className="si-btn-secondary" onClick={resendConfirm} disabled={resending}>
                {resending ? 'Sending…' : 'Resend link'}
              </button>
              {resendMsg && <span className="si-hint">{resendMsg}</span>}
            </div>
          </div>
        )}

        {errorSummary && <div className="si-alert" role="alert">{errorSummary}</div>}

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