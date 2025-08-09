// app/emailsignup/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseClient';
import './emailsignup.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const hasNumber = (s: string) => /\d/.test(s);
const hasSpecial = (s: string) => /[^A-Za-z0-9]/.test(s);

const siteUrl =
  (typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_SITE_URL
    : process.env.NEXT_PUBLIC_SITE_URL || window.location.origin) || 'https://www.adaptaly.com';

export default function EmailSignupPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, pw: false });
  const [submitting, setSubmitting] = useState(false);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);
  const [showCheckEmail, setShowCheckEmail] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const nameValid = useMemo(() => name.trim().length >= 2, [name]);
  const emailValid = useMemo(() => emailRegex.test(email.trim()), [email]);
  const pwRules = useMemo(
    () => ({ len: pw.length >= 8, num: hasNumber(pw), sym: hasSpecial(pw) }),
    [pw],
  );
  const pwValid = pwRules.len && pwRules.num && pwRules.sym;
  const formValid = nameValid && emailValid && pwValid;

  async function setPendingCookie(address: string) {
    try {
      await fetch('/api/pending-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: address }),
      });
    } catch {
      // ignore
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, pw: true });

    if (!formValid) {
      const problems: string[] = [];
      if (!nameValid) problems.push('Enter your full name.');
      if (!emailValid) problems.push('Enter a valid email address.');
      if (!pwValid) problems.push('Password must be at least 8 chars incl. a number and a symbol.');
      setErrorSummary(problems.join(' '));
      return;
    }

    setErrorSummary(null);
    setSubmitting(true);

    try {
      // Check existence server-side (service role)
      const existsResp = await fetch('/api/auth/email-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).then(r => r.json()).catch(() => ({ exists: false }));

      if (existsResp?.exists) {
        setErrorSummary('An account with this email already exists. Try signing in.');
        return;
      }

      // Start signup
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pw,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?next=/dashboard&email=${encodeURIComponent(
            email.trim(),
          )}${data?.user?.id ? `&uid=${encodeURIComponent(data.user.id)}` : ''}`,
          data: { full_name: name.trim() },
        },
      });

      if (error) {
        setErrorSummary(error.message);
        return;
      }

      // Set a cookie so we can still recover the email if the client strips params
      await setPendingCookie(email.trim());

      setShowCheckEmail(true);
    } finally {
      setSubmitting(false);
    }
  };

  async function resendConfirm() {
    setResendMsg(null);
    setResending(true);
    const addr = email.trim().toLowerCase();
    try {
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=/dashboard&email=${encodeURIComponent(
        addr,
      )}`;

      // 1) Try normal signup resend
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: addr,
        options: { emailRedirectTo },
      });

      if (!error) {
        setResendMsg('Sent. Check your inbox.');
        return;
      }

      // 2) If already confirmed or similar, fall back to magic sign-in link
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

  if (showCheckEmail) {
    return (
      <main className="es-background">
        <section className="es-card" aria-live="polite">
          <header className="es-head es-head--confirm">
            <h1 className="es-title">Check your email</h1>
            <p className="es-subtitle">
              We sent a confirmation link to <strong>{email}</strong>.
            </p>
          </header>

          <p className="es-provider-note">
            Didn’t get it?
            <button className="es-suggest-btn" onClick={resendConfirm} disabled={resending}>
              {resending ? 'Resending…' : 'Resend confirmation'}
            </button>
            {resendMsg ? ` ${resendMsg}` : null}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="es-background" role="main">
      <section className="es-card">
        <h1 className="es-title">Create your account</h1>

        {errorSummary && (
          <div className="es-alert" role="alert" aria-live="polite">{errorSummary}</div>
        )}

        <form className="es-form" onSubmit={submit} noValidate>
          {/* Full Name */}
          <div className="es-field">
            <label htmlFor="name" className="es-label">Full name</label>
            <input
              id="name"
              className="es-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              placeholder="Your name"
            />
          </div>

          {/* Email */}
          <div className="es-field">
            <label htmlFor="email" className="es-label">Email</label>
            <input
              id="email"
              type="email"
              className="es-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="es-field">
            <label htmlFor="password" className="es-label">Password</label>
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              className="es-input"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, pw: true }))}
              onKeyUp={(e) => setCapsLock(e.getModifierState?.('CapsLock') ?? false)}
              placeholder="At least 8 chars, number, symbol"
              autoComplete="new-password"
            />
            <button type="button" className="es-toggle" onClick={() => setShowPw(s => !s)}>
              {showPw ? 'Hide' : 'Show'}
            </button>
            {capsLock && <div className="es-hint">Caps Lock is on.</div>}
          </div>

          <div className="es-actions">
            <button type="submit" className="es-btn-primary" disabled={!formValid || submitting}>
              {submitting ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}