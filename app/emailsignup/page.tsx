'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './emailsignup.css';

type PasswordChecks = {
  lengthOk: boolean;
  numberOk: boolean;
  specialOk: boolean;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const COMMON_DOMAINS = ['gmail.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'yahoo.com'];
const DOMAIN_TYPO_MAP: Record<string, string> = {
  'gmal.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'yaho.com': 'yahoo.com',
};

function getPasswordChecks(pw: string): PasswordChecks {
  return {
    lengthOk: pw.length >= 8,
    numberOk: /[0-9]/.test(pw),
    specialOk: /[^A-Za-z0-9]/.test(pw),
  };
}

function scorePassword(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: 'Too weak' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const label = ['Too weak', 'Weak', 'Okay', 'Good', 'Strong'][Math.min(score, 4)];
  return { score: Math.min(score, 4), label };
}

function suggestEmailDomain(email: string): string | null {
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  const domain = parts[1].toLowerCase();
  if (COMMON_DOMAINS.includes(domain)) return null;
  if (DOMAIN_TYPO_MAP[domain]) return parts[0] + '@' + DOMAIN_TYPO_MAP[domain];
  if (['gmailcom', 'outlookcom', 'hotmailcom', 'icloudcom', 'yahoocom'].includes(domain)) {
    const fixed = domain.replace('com', '.com');
    return parts[0] + '@' + fixed;
  }
  return null;
}

export default function EmailSignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const [touched, setTouched] = useState({ name: false, email: false, pw: false });
  const [submitting, setSubmitting] = useState(false);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);

  const checks = useMemo(() => getPasswordChecks(pw), [pw]);
  const { score: pwScore, label: pwLabel } = useMemo(() => scorePassword(pw), [pw]);

  const nameValid = useMemo(() => name.trim().length > 1, [name]);
  const emailValid = useMemo(() => emailRegex.test(email.trim()), [email]);
  const pwValid   = useMemo(() => checks.lengthOk && checks.numberOk && checks.specialOk, [checks]);
  const formValid = nameValid && emailValid && pwValid;

  useEffect(() => {
    setEmailSuggestion(suggestEmailDomain(email.trim()));
  }, [email]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, pw: true });

    if (!formValid) {
      const problems = [];
      if (!nameValid) problems.push('Enter your full name.');
      if (!emailValid) problems.push('Enter a valid email address.');
      if (!pwValid) problems.push('Choose a stronger password.');
      setErrorSummary(problems.join(' '));
      return;
    }

    setErrorSummary(null);
    try {
      setSubmitting(true);
      // TODO: integrate API
      await new Promise((r) => setTimeout(r, 900));
      // router.push('/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="es-background" role="main">
      <section className="es-card" aria-labelledby="es-title">
        {/* Functional back button */}
        <div className="es-topbar">
          <button
            type="button"
            className="es-back"
            onClick={() => router.back()}
            aria-label="Go back"
          >
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

        <form className="es-form" onSubmit={onSubmit} noValidate>
          {/* Name */}
          <div className="es-field">
            <label htmlFor="name" className="es-label">Full name</label>
            <div className={`es-input-wrap ${touched.name && !nameValid ? 'is-invalid' : ''} ${nameValid ? 'is-valid' : ''}`}>
              <input
                id="name"
                type="text"
                inputMode="text"
                autoCapitalize="words"
                autoComplete="name"
                className="es-input"
                placeholder="Chris Post"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                aria-invalid={touched.name && !nameValid}
                aria-describedby="name-help"
              />
              {nameValid && (
                <svg className="es-valid-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div id="name-help" className="es-hint">
              {touched.name && !nameValid ? 'Please enter your full name.' : 'Use your real name for your learning profile.'}
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
                aria-describedby="email-help"
              />
              {emailValid && (
                <svg className="es-valid-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div id="email-help" className="es-hint">
              {touched.email && !emailValid ? 'Enter a valid email like name@example.com.' : 'We will send a confirmation to this address.'}
            </div>
            {emailSuggestion && email && (
              <div className="es-suggest" role="note">
                Did you mean{' '}
                <button type="button" className="es-suggest-btn" onClick={() => setEmail(emailSuggestion)}>
                  {emailSuggestion}
                </button>
                ?
              </div>
            )}
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
                aria-describedby="pw-help"
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
                    <path d="M2 12s4-7 10-7 10 7 10 7-1.2 2.1-3.2 3.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
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

            <ul id="pw-help" className="es-checks" aria-live="polite">
              <li className={checks.lengthOk ? 'ok' : 'no'}>At least 8 characters</li>
              <li className={checks.numberOk ? 'ok' : 'no'}>At least 1 number</li>
              <li className={checks.specialOk ? 'ok' : 'no'}>At least 1 special symbol</li>
            </ul>

            <div className="es-strength" aria-hidden={!pw}>
              <div className={`bar s-${pwScore}`} />
              <span className="label">{pw ? pwLabel : ' '}</span>
            </div>
          </div>

          {/* Legal + CTA */}
          <div className="es-legal">
            By creating an account, you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy</a>.
          </div>

          <div className="es-actions" role="group" aria-label="Form actions">
            <button
              type="submit"
              className="es-btn-primary"
              disabled={!formValid || submitting}
              aria-busy={submitting}
            >
              {submitting ? 'Creating account…' : 'Create Account'}
              {submitting && <span className="es-spinner" aria-hidden="true" />}
            </button>

            <div className="es-footer">
              <span className="small">Already have an account?</span>
              <a href="/auth/signin" className="link">Sign in</a>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}