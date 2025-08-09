'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseClient';
import '../reset.css';

const hasNumber = (s: string) => /\d/.test(s);
const hasSpecial = (s: string) => /[^A-Za-z0-9]/.test(s);

export default function ResetConfirmPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [capsLock1, setCapsLock1] = useState(false);
  const [capsLock2, setCapsLock2] = useState(false);

  const [touched, setTouched] = useState({ pw: false, pw2: false });
  const [submitting, setSubmitting] = useState(false);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      for (let i = 0; i < 4; i++) {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          if (!mounted) return;
          setHasSession(true);
          setReady(true);
          return;
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      if (!mounted) return;
      setHasSession(false);
      setReady(true);
    })();
    return () => { mounted = false; };
  }, [supabase]);

  const pwRules = useMemo(
    () => ({
      len: pw.length >= 8,
      num: hasNumber(pw),
      sym: hasSpecial(pw),
    }),
    [pw]
  );
  const pwValid = pwRules.len && pwRules.num && pwRules.sym;
  const match = pw && pw2 && pw === pw2;

  const strength = useMemo(() => {
    let s = 0;
    if (pwRules.len) s++;
    if (pwRules.num) s++;
    if (pwRules.sym) s++;
    if (pw.length >= 12) s++;
    return Math.min(s, 4);
  }, [pwRules, pw.length]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ pw: true, pw2: true });

    if (!pwValid || !match) {
      const problems: string[] = [];
      if (!pwValid) problems.push('Password must be at least 8 chars, include a number and a symbol.');
      if (!match) problems.push('Passwords do not match.');
      setErrorSummary(problems.join(' '));
      return;
    }

    setErrorSummary(null);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) {
        setErrorSummary(error.message || 'Could not update password. Try again.');
        return;
      }
      router.replace('/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return null;

  if (!hasSession) {
    return (
      <main className="r-background">
        <section className="r-card" aria-live="polite">
          <header className="r-head r-head--confirm">
            <h1 className="r-title">Reset link is invalid</h1>
            <p className="r-subtitle">The link is expired or already used. Request a new one.</p>
          </header>
          <div className="r-actions">
            <a className="r-btn-primary" href="/reset">Request new link</a>
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
      <section className="r-card" aria-labelledby="rc-title">
        <header className="r-head">
          <h1 id="rc-title" className="r-title">Set a new password</h1>
          <p className="r-subtitle">Choose a strong password you do not use elsewhere.</p>
        </header>

        {errorSummary && <div className="r-alert" role="alert">{errorSummary}</div>}

        <form className="r-form" onSubmit={submit} noValidate>
          {/* New password */}
          <div className="r-field">
            <label htmlFor="pw" className="r-label">New password</label>
            <div className={`r-input-wrap ${touched.pw && !pwValid ? 'is-invalid' : ''}`}>
              <svg className="r-input-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 10h12v10H6z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 10V8a4 4 0 118 0v2" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <input
                id="pw"
                type={showPw ? 'text' : 'password'}
                autoCapitalize="none"
                autoComplete="new-password"
                className="r-input has-icon has-trailing"
                placeholder="Create a strong password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, pw: true }))}
                onKeyUp={(e) => setCapsLock1(e.getModifierState?.('CapsLock') ?? false)}
                aria-invalid={touched.pw && !pwValid}
              />
              <button
                type="button"
                className="r-toggle"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                title={showPw ? 'Hide password' : 'Show password'}
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

            {capsLock1 && <div className="r-caps" role="note">Caps Lock is on.</div>}

            <ul className="r-checks" aria-live="polite">
              <li className={pwRules.len ? 'ok' : ''}>At least 8 characters</li>
              <li className={pwRules.num ? 'ok' : ''}>At least 1 number</li>
              <li className={pwRules.sym ? 'ok' : ''}>At least 1 special symbol</li>
            </ul>

            <div className="r-strength">
              <div className={`bar s-${Math.min(Math.max((pwRules.len ? 1 : 0) + (pwRules.num ? 1 : 0) + (pwRules.sym ? 1 : 0) + (pw.length >= 12 ? 1 : 0), 0), 4)}`} />
              <span className="label">
                {!pwValid ? 'Weak' : pw.length >= 12 ? 'Strong' : 'Good'}
              </span>
            </div>
          </div>

          {/* Confirm password */}
          <div className="r-field">
            <label htmlFor="pw2" className="r-label">Confirm password</label>
            <div className={`r-input-wrap ${touched.pw2 && !match ? 'is-invalid' : ''}`}>
              <input
                id="pw2"
                type={showPw2 ? 'text' : 'password'}
                autoCapitalize="none"
                autoComplete="new-password"
                className="r-input has-trailing"
                placeholder="Repeat your password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, pw2: true }))}
                onKeyUp={(e) => setCapsLock2(e.getModifierState?.('CapsLock') ?? false)}
                aria-invalid={touched.pw2 && !match}
              />
              <button
                type="button"
                className="r-toggle"
                onClick={() => setShowPw2((s) => !s)}
                aria-label={showPw2 ? 'Hide password' : 'Show password'}
                title={showPw2 ? 'Hide password' : 'Show password'}
              >
                {showPw2 ? (
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
            {capsLock2 && <div className="r-caps" role="note">Caps Lock is on.</div>}
          </div>

          <div className="r-actions">
            <button type="submit" className="r-btn-primary" disabled={!pwValid || !match || submitting}>
              {submitting ? 'Saving…' : 'Save new password'}
              {submitting && <span className="r-spinner" aria-hidden="true" />}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}