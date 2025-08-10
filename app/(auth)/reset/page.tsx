// app/(auth)/reset/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import './reset.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function guessProvider(email: string) {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  if (domain.includes('gmail') || domain.includes('googlemail')) {
    return { primary: 'gmail' as const, url: 'https://mail.google.com/mail/u/0/#inbox' };
  }
  if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) {
    return { primary: 'outlook' as const, url: 'https://outlook.live.com/mail/0/inbox' };
  }
  return { primary: 'gmail' as const, url: 'https://mail.google.com/mail/u/0/#inbox' };
}

export default function ResetPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  const emailValid = useMemo(() => emailRegex.test(email.trim()), [email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!emailValid || busy) return;

    setBusy(true);
    try {
      await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } finally {
      setBusy(false);
    }
  }

  function openMailbox(url: string) {
    // open mailbox in a new tab, then move current tab away so it "feels closed"
    window.open(url, '_blank', 'noopener');
    // fallback: return to sign-in (or home) in this tab
    router.replace('/signin');
  }

  if (submitted) {
    const guess = guessProvider(email);

    return (
      <main className="rp-background" role="main">
        <section className="rp-card" aria-live="polite">
          <div className="rp-topbar rp-topbar--safe">
            <button
              type="button"
              className="rp-back"
              onClick={() => router.push('/signin')}
              aria-label="Back to sign in"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Back to sign in</span>
            </button>
          </div>

          <header className="rp-head rp-head--confirm">
            <h1 className="rp-title">Check your email</h1>
            <p className="rp-subtitle">
              We sent a reset link to <strong>{email || 'your inbox'}</strong>. Click it to set a new password.
            </p>
          </header>

          <div className="rp-provider-actions">
            <p className="rp-provider-hint">Open your inbox:</p>
            <div className="rp-provider-buttons">
              <button
                type="button"
                className={`rp-btn-secondary ${guess.primary === 'gmail' ? 'is-suggested' : ''}`}
                onClick={() => openMailbox('https://mail.google.com/mail/u/0/#inbox')}
              >
                Open Gmail
              </button>
              <button
                type="button"
                className={`rp-btn-secondary ${guess.primary === 'outlook' ? 'is-suggested' : ''}`}
                onClick={() => openMailbox('https://outlook.live.com/mail/0/inbox')}
              >
                Open Outlook
              </button>
            </div>
            <p className="rp-provider-note">
              Didn’t get an email? Check your spam folder, or wait a minute and try again.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="rp-background" role="main">
      <section className="rp-card" aria-labelledby="rp-title">
        <div className="rp-topbar rp-topbar--safe">
          <button type="button" className="rp-back" onClick={() => router.back()} aria-label="Go back">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Back</span>
          </button>
        </div>

        <header className="rp-head">
          <h1 id="rp-title" className="rp-title">Reset your password</h1>
          <p className="rp-subtitle">Enter your email and we’ll send you a link to reset your password.</p>
        </header>

        <form onSubmit={onSubmit} className="rp-form" noValidate>
          <div className="rp-field">
            <label htmlFor="email" className="rp-label">Email address</label>
            <div className={`rp-input-wrap ${touched && !emailValid ? 'is-invalid' : ''}`}>
              <svg className="rp-input-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16v12H4z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoComplete="email"
                className="rp-input has-icon"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                aria-invalid={touched && !emailValid}
                required
              />
            </div>
            <div className="rp-hint">
              {touched && !emailValid ? 'Enter a valid email like name@example.com.' : 'We’ll send a reset link to this address.'}
            </div>
          </div>

          <div className="rp-actions">
            <button type="submit" className="rp-btn-primary" disabled={!emailValid || busy} aria-busy={busy}>
              {busy ? 'Sending…' : 'Send reset link'}
              {busy && <span className="rp-spinner" aria-hidden="true" />}
            </button>

            <div className="rp-footer">
              <span className="small">Remembered it?</span>
              <a href="/signin" className="link">Sign in</a>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}