'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { validatePassword, calcStrength } from '@/lib/password';
import './confirm.css';

function parseHash(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const raw = window.location.hash.replace(/^#/, '');
  const out: Record<string, string> = {};
  if (!raw) return out;
  for (const part of raw.split('&')) {
    const [k, v] = part.split('=');
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '');
  }
  return out;
}

export default function ConfirmClient() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = useMemo(() => supabaseBrowser(), []); // <-- no arguments

  const [ready, setReady] = useState<'checking' | 'ok' | 'invalid'>('checking');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = calcStrength(pw);
  const { ok, issues } = validatePassword(pw);
  const confirmMatch = pw.length > 0 && pw === pw2;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const code = params.get('code');
      const type = params.get('type');
      if (code && type === 'recovery') {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled) setReady(error ? 'invalid' : 'ok');
        return;
      }
      const h = parseHash();
      if (h.access_token && h.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: h.access_token,
          refresh_token: h.refresh_token,
        });
        if (!cancelled) setReady(error ? 'invalid' : 'ok');
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (!cancelled) setReady(data.user ? 'ok' : 'invalid');
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    const validation = validatePassword(pw);
    if (!validation.ok || !confirmMatch) {
      setError('Please fix the password requirements below.');
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) {
      setBusy(false);
      setError('Could not update password. The link may be invalid or expired.');
      return;
    }
    // hard navigation to ensure fresh server auth state
    window.location.assign('/dashboard');
  }

  if (ready === 'checking') {
    return (
      <main className="rc-background">
        <section className="rc-card"><div className="rc-loading">Checking your link…</div></section>
      </main>
    );
  }

  if (ready === 'invalid') {
    return (
      <main className="rc-background">
        <section className="rc-card">
          <div className="rc-topbar rc-topbar--safe">
            <button type="button" className="rc-back" onClick={() => router.push('/reset')} aria-label="Back">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Back</span>
            </button>
          </div>
          <h1 className="rc-title">Link expired or invalid</h1>
          <p className="rc-subtitle">No worries. Request a fresh link and try again.</p>
          <a className="rc-btn" href="/reset">Request new link</a>
        </section>
      </main>
    );
  }

  return (
    <main className="rc-background" role="main">
      <section className="rc-card" aria-labelledby="rc-title">
        {/* Back pill is placed in normal flow on all screens to avoid overlap */}
        <div className="rc-topbar rc-topbar--safe">
          <button
            type="button"
            className="rc-back"
            onClick={() => router.push('/signin')}
            aria-label="Back to sign in"
            title="Back to sign in"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Back to sign in</span>
          </button>
        </div>

        <header className="rc-head">
          <h1 id="rc-title" className="rc-title">Set a new password</h1>
        </header>

        <form onSubmit={onSubmit} className="rc-form" noValidate>
          <div className="rc-field">
            <label htmlFor="pw" className="rc-label">New password</label>
            <div className="rc-input-wrap">
              <input
                id="pw"
                type="password"
                className="rc-input"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Enter a strong password"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="rc-toggle"
                onClick={() => {
                  const el = document.getElementById('pw') as HTMLInputElement | null;
                  if (el) el.type = el.type === 'password' ? 'text' : 'password';
                }}
                aria-label="Show or hide password"
                title="Show or hide password"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                  <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </button>
            </div>

            <div className="rc-strength" aria-hidden>
              <div className={`bar ${strength >= 1 ? 'on' : ''}`} />
              <div className={`bar ${strength >= 2 ? 'on' : ''}`} />
              <div className={`bar ${strength >= 3 ? 'on' : ''}`} />
              <div className={`bar ${strength >= 4 ? 'on' : ''}`} />
            </div>
          </div>

          <div className="rc-field">
            <label htmlFor="pw2" className="rc-label">Confirm password</label>
            <div className="rc-input-wrap">
              <input
                id="pw2"
                type="password"
                className="rc-input"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="Repeat your password"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="rc-toggle"
                onClick={() => {
                  const el = document.getElementById('pw2') as HTMLInputElement | null;
                  if (el) el.type = el.type === 'password' ? 'text' : 'password';
                }}
                aria-label="Show or hide password"
                title="Show or hide password"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                  <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </button>
            </div>
          </div>

          {!ok && (
            <ul className="rc-issues">
              {issues.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
          {pw2.length > 0 && !confirmMatch && (
            <div className="rc-mismatch">Passwords do not match</div>
          )}
          {error && <div className="rc-error">{error}</div>}

          <button type="submit" className="rc-btn" disabled={busy}>
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>
    </main>
  );
}