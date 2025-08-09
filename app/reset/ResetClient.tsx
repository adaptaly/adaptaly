'use client';

import { useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';
import './reset.css';

type Props = { invalidLink?: boolean };

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const baseUrl =
  (
    typeof window === 'undefined'
      ? process.env.NEXT_PUBLIC_SITE_URL
      : process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
  )?.replace(/\/$/, '') || 'https://www.adaptaly.com';

export default function ResetClient({ invalidLink }: Props) {
  const supabase = supabaseBrowser();

  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);
  const [showCheckEmail, setShowCheckEmail] = useState(false);

  const emailValid = useMemo(() => emailRegex.test(email.trim()), [email]);

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
    setTouched(true);

    if (!emailValid) {
      setErrorSummary('Enter a valid email address.');
      return;
    }

    setErrorSummary(null);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${baseUrl}/auth/callback?next=/reset/confirm`,
      });
      if (error) {
        // privacy friendly generic
        setErrorSummary('If this address is registered, we will send a reset link shortly.');
      }
      setShowCheckEmail(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (showCheckEmail) {
    const guess = providerUrlGuess();
    return (
      <main className="r-background">
        <section className="r-card" aria-live="polite">
          <header className="r-head r-head--confirm">
            <h1 className="r-title">Check your email</h1>
            <p className="r-subtitle">
              If an account exists for <strong>{email}</strong>, you will get a link to reset your password.
            </p>
          </header>

          <div className="r-provider-actions">
            <p className="r-provider-hint">Open your inbox:</p>
            <div className="r-provider-buttons">
              <a
                className={`r-btn-secondary ${guess.primary === 'gmail' ? 'is-suggested' : ''}`}
                href="https://mail.google.com/mail/u/0/#inbox"
                target="_blank"
                rel="noreferrer"
              >
                Open Gmail
              </a>
              <a
                className={`r-btn-secondary ${guess.primary === 'outlook' ? 'is-suggested' : ''}`}
                href="https://outlook.live.com/mail/0/inbox"
                target="_blank"
                rel="noreferrer"
              >
                Open Outlook
              </a>
            </div>

            <p className="r-provider-note">Not seeing the email? Check spam, or wait a minute and try again.</p>

            <div className="r-footer">
              <a href="/signin" className="link">Back to sign in</a>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="r-background" role="main">
      <section className="r-card" aria-labelledby="r-title">
        <header className="r-head">
          <h1 id="r-title" className="r-title">Forgot your password?</h1>
          <p className="r-subtitle">Enter your email and we will send you a reset link.</p>
        </header>

        {invalidLink && (
          <div className="r-alert" role="alert" aria-live="polite">
            This reset link has expired. Request a new one below.
          </div>
        )}
        {errorSummary && <div className="r-alert" role="alert">{errorSummary}</div>}

        <form className="r-form" onSubmit={submit} noValidate>
          <div className="r-field">
            <label htmlFor="email" className="r-label">Email address</label>
            <div className={`r-input-wrap ${touched && !emailValid ? 'is-invalid' : ''} ${emailValid ? 'is-valid' : ''}`}>
              <svg className="r-input-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16v12H4z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoComplete="email"
                className="r-input has-icon"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                aria-invalid={touched && !emailValid}
              />
              {emailValid && (
                <svg className="r-valid-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div className="r-hint">
              {touched && !emailValid ? 'Enter a valid email like name@example.com.' : 'We will send a link to this address.'}
            </div>
          </div>

          <div className="r-actions">
            <button type="submit" className="r-btn-primary" disabled={!emailValid || submitting} aria-busy={submitting}>
              {submitting ? 'Sending…' : 'Send reset link'}
              {submitting && <span className="r-spinner" aria-hidden="true" />}
            </button>

            <div className="r-footer">
              <span className="small">Remembered it?</span>
              <a href="/signin" className="link">Sign in</a>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}