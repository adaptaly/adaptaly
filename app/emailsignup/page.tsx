// app/emailsignup/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseClient';
import './emailsignup.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const hasNumber = (s: string) => /\d/.test(s);
const hasSpecial = (s: string) => /[^A-Za-z0-9]/.test(s);

// Canonical base URL: always prefer NEXT_PUBLIC_SITE_URL, fallback to window.origin
const baseUrl =
  (
    typeof window === 'undefined'
      ? process.env.NEXT_PUBLIC_SITE_URL
      : process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
  )?.replace(/\/$/, '') || 'https://www.adaptaly.com';

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

  const nameValid = useMemo(() => name.trim().length >= 2, [name]);
  const emailValid = useMemo(() => emailRegex.test(email.trim()), [email]);
  const pwRules = useMemo(
    () => ({ len: pw.length >= 8, num: hasNumber(pw), sym: hasSpecial(pw) }),
    [pw]
  );
  const pwValid = pwRules.len && pwRules.num && pwRules.sym;
  const formValid = nameValid && emailValid && pwValid;

  function providerUrlGuess() {
    const domain = email.split('@')[1]?.toLowerCase() || '';
    if (domain.includes('gmail') || domain.includes('googlemail')) {
      return { primary: 'gmail', url: 'https://mail.google.com/mail/u/0/#inbox' };
    }
    if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) {
      return { primary: 'outlook', url: 'https://outlook.live.com/mail/0/inbox' };
    }
    return { primary: 'gmail', url: 'https://mail.google.com/mail/u/0/#inbox' };
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, pw: true });

    if (!formValid) {
      const problems: string[] = [];
      if (!nameValid) problems.push('Enter your full name.');
      if (!emailValid) problems.push('Enter a valid email address.');
      if (!pwValid) problems.push('Password must be at least 8 chars, include a number and a symbol.');
      setErrorSummary(problems.join(' '));
      return;
    }

    setErrorSummary(null);
    setSubmitting(true);
    try {
      // Optional: check email exists
      const res = await fetch('/api/auth/email-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const { exists } = await res.json();
        if (exists) {
          setErrorSummary('An account with this email already exists. Try signing in instead.');
          setEmail('');
          return;
        }
      }

      // Include email + next so we can prefill /signin on invalid links
      const redirect = `${baseUrl}/auth/callback?next=/dashboard&email=${encodeURIComponent(
        email.trim()
      )}`;

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pw,
        options: {
          emailRedirectTo: redirect,
          data: { full_name: name.trim() },
        },
      });

      if (error) {
        if (/already\s*registered/i.test(error.message) || /user.*exists/i.test(error.message)) {
          setErrorSummary('An account with this email already exists. Try signing in instead.');
          setEmail('');
          return;
        }
        setErrorSummary(error.message);
        return;
      }

      setShowCheckEmail(true);
    } catch {
      setErrorSummary('Something went wrong sending your confirmation email. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (showCheckEmail) {
    const guess = providerUrlGuess();
    return (
      <main className="es-background">
        <section className="es-card" aria-live="polite">
          <div className="es-topbar es-topbar--safe">
            <button
              type="button"
              className="es-back"
              onClick={() => router.push('/signin')}
              aria-label="Back to sign in"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Back to sign in</span>
            </button>
          </div>

          <header className="es-head es-head--confirm">
            <h1 className="es-title">Check your email</h1>
            <p className="es-subtitle">
              We sent a confirmation link to <strong>{email}</strong>. Click it to finish creating your account.
            </p>
          </header>

          <div className="es-provider-actions">
            <p className="es-provider-hint">Open your inbox:</p>
            <div className="es-provider-buttons">
              <a className={`es-btn-secondary ${guess.primary === 'gmail' ? 'is-suggested' : ''}`} href="https://mail.google.com/mail/u/0/#inbox" target="_blank" rel="noreferrer">
                Open Gmail
              </a>
              <a className={`es-btn-secondary ${guess.primary === 'outlook' ? 'is-suggested' : ''}`} href="https://outlook.live.com/mail/0/inbox" target="_blank" rel="noreferrer">
                Open Outlook
              </a>
            </div>
            <p className="es-provider-note">Didn’t get an email? Check your spam folder, or wait a minute and try again.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="es-background" role="main">
      <section className="es-card" aria-labelledby="es-title">
        <div className="es-topbar es-topbar--safe">
          <button type="button" className="es-back" onClick={() => router.back()} aria-label="Go back">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Back</span>
          </button>
        </div>

        <header className="es-head">
          <h1 id="es-title" className="es-title">Sign up with Email</h1>
          <p className="es-subtitle">Create your Adaptaly account in less than a minute.</p>
        </header>

        {errorSummary && (
          <div className="es-alert" role="alert" aria-live="polite">
            {errorSummary}
          </div>
        )}

        <form className="es-form" onSubmit={submit} noValidate>
          {/* Name */}
          <div className="es-field">
            <label htmlFor="name" className="es-label">Full name</label>
            <div className={`es-input-wrap ${touched.name && !nameValid ? 'is-invalid' : ''}`}>
              <input
                id="name"
                type="text"
                className="es-input"
                placeholder="Chris Post"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                aria-invalid={touched.name && !nameValid}
              />
            </div>
            <div className="es-hint">
              {touched.name && !nameValid
                ? 'Enter your real name for your learning profile.'
                : 'Use your real name for your learning profile.'}
            </div>
          </div>

          {/* Email */}
          <div className="es-field">
            <label htmlFor="email" className="es-label">Email address</label>
            <div className={`es-input-wrap ${touched.email && !emailValid ? 'is-invalid' : ''} ${emailValid ? 'is-valid' : ''}`}>
              <svg className="es-input-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16v12H4z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoComplete="email"
                className="es-input has-icon"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                aria-invalid={touched.email && !emailValid}
              />
              {emailValid && (
                <svg className="es-valid-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div className="es-hint">
              {touched.email && !emailValid
                ? 'Enter a valid email like name@example.com.'
                : 'We will send a confirmation to this address.'}
            </div>
          </div>

          {/* Password */}
          <div className="es-field">
            <label htmlFor="password" className="es-label">Password</label>
            <div className={`es-input-wrap ${touched.pw && !pwValid ? 'is-invalid' : ''}`}>
              <svg className="es-input-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 10h12v10H6z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 10V8a4 4 0 118 0v2" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoCapitalize="none"
                autoComplete="new-password"
                className="es-input has-icon has-trailing"
                placeholder="Create a strong password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, pw: true }))}
                onKeyUp={(e) => setCapsLock(e.getModifierState && e.getModifierState('CapsLock'))}
                aria-invalid={touched.pw && !pwValid}
                onKeyDown={(e) => { if (e.key === 'Enter') submit(e as unknown as React.FormEvent); }}
              />
              <button
                type="button"
                className="es-toggle"
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

            {capsLock && <div className="es-caps" role="note">Caps Lock is on.</div>}

            <ul className="es-checks" aria-live="polite">
              <li className={pwRules.len ? 'ok' : ''}>At least 8 characters</li>
              <li className={pwRules.num ? 'ok' : ''}>At least 1 number</li>
              <li className={pwRules.sym ? 'ok' : ''}>At least 1 special symbol</li>
            </ul>

            <div className="es-strength">
              <div className={`bar s-${(pwRules.len ? 1 : 0) + (pwRules.num ? 1 : 0) + (pwRules.sym ? 1 : 0) + (pw.length >= 12 ? 1 : 0)}`} />
              <span className="label">
                {pw.length < 8 || !(pwRules.num && pwRules.sym) ? 'Weak' : pw.length < 12 ? 'Good' : 'Strong'}
              </span>
            </div>
          </div>

          <p className="es-legal">
            By creating an account, you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy</a>.
          </p>

          <div className="es-actions">
            <button type="submit" className="es-btn-primary" disabled={!formValid || submitting} aria-busy={submitting}>
              {submitting ? 'Creating…' : 'Create Account'}
              {submitting && <span className="es-spinner" aria-hidden="true" />}
            </button>

            <div className="es-footer">
              <span className="small">Already have an account?</span>
              <a href="/signin" className="link">Sign in</a>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}