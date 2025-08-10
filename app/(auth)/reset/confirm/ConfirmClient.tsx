// app/(auth)/reset/confirm/ConfirmClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { validatePassword, calcStrength } from "@/lib/password";

function useSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return useMemo(
    () => createClient(supabaseUrl, supabaseAnon, { auth: { persistSession: true } }),
    [supabaseUrl, supabaseAnon]
  );
}

function parseHash(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const hash = window.location.hash.replace(/^#/, "");
  const out: Record<string, string> = {};
  if (!hash) return out;
  for (const part of hash.split("&")) {
    const [k, v] = part.split("=");
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || "");
  }
  return out;
}

export default function ConfirmClient() {
  const router = useRouter();
  const params = useSearchParams(); // parent page wraps this in <Suspense>
  const supabase = useSupabase();

  const [ready, setReady] = useState<"checking" | "ok" | "invalid">("checking");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = calcStrength(pw);
  const { ok, issues } = validatePassword(pw);
  const confirmMatch = pw.length > 0 && pw === pw2;

  useEffect(() => {
    let cancelled = false;

    async function ensureSession() {
      // 1) Newer links: /reset/confirm?code=...&type=recovery
      const code = params.get("code");
      const type = params.get("type");
      if (code && type === "recovery") {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled) setReady(error ? "invalid" : "ok");
        return;
      }

      // 2) Legacy hash tokens: #access_token=...&refresh_token=...
      const h = parseHash();
      if (h.access_token && h.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: h.access_token,
          refresh_token: h.refresh_token,
        });
        if (!cancelled) setReady(error ? "invalid" : "ok");
        return;
      }

      // 3) Maybe already signed in
      const { data } = await supabase.auth.getUser();
      if (!cancelled) setReady(data.user ? "ok" : "invalid");
    }

    ensureSession();
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
      setError("Please fix the password requirements below.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) {
      setBusy(false);
      setError("Could not update password. The link may be invalid or expired.");
      return;
    }

    // Hard navigate to ensure a fresh server render of /dashboard
    window.location.assign("/dashboard");
  }

  if (ready === "checking") {
    return (
      <main className="confirm-wrap">
        <section className="confirm-card">
          <div className="confirm-loading">Checking your link…</div>
        </section>
      </main>
    );
  }

  if (ready === "invalid") {
    return (
      <main className="confirm-wrap">
        <section className="confirm-card">
          <h1 className="confirm-title">Link expired or invalid</h1>
          <p className="confirm-sub">No worries. Request a fresh link and try again.</p>
          <a className="confirm-btn" href="/reset">Request new link</a>
        </section>
      </main>
    );
  }

  return (
    <main className="confirm-wrap">
      <section className="confirm-card">
        <h1 className="confirm-title">Set a new password</h1>

        <form onSubmit={onSubmit} className="confirm-form">
          <label className="confirm-label" htmlFor="pw">New password</label>
          <div className="confirm-input-wrap">
            <input
              id="pw"
              type="password"
              className="confirm-input"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Enter a strong password"
              autoComplete="new-password"
              required
              inputMode="text"
            />
            <button
              type="button"
              className="confirm-eye"
              onClick={() => {
                const el = document.getElementById("pw") as HTMLInputElement | null;
                if (el) el.type = el.type === "password" ? "text" : "password";
              }}
              aria-label="Toggle password visibility"
              title="Show or hide password"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path d="M12 5C6 5 2.73 9.11 2 12c.73 2.89 4 7 10 7s9.27-4.11 10-7c-.73-2.89-4-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/>
              </svg>
            </button>
          </div>

          <div className="confirm-strength" aria-hidden>
            <div className={`bar ${strength >= 1 ? "on" : ""}`}></div>
            <div className={`bar ${strength >= 2 ? "on" : ""}`}></div>
            <div className={`bar ${strength >= 3 ? "on" : ""}`}></div>
            <div className={`bar ${strength >= 4 ? "on" : ""}`}></div>
          </div>

          <label className="confirm-label" htmlFor="pw2">Confirm password</label>
          <div className="confirm-input-wrap">
            <input
              id="pw2"
              type="password"
              className="confirm-input"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
              inputMode="text"
            />
            <button
              type="button"
              className="confirm-eye"
              onClick={() => {
                const el = document.getElementById("pw2") as HTMLInputElement | null;
                if (el) el.type = el.type === "password" ? "text" : "password";
              }}
              aria-label="Toggle confirm password visibility"
              title="Show or hide password"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path d="M12 5C6 5 2.73 9.11 2 12c.73 2.89 4 7 10 7s9.27-4.11 10-7c-.73-2.89-4-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/>
              </svg>
            </button>
          </div>

          {/* Requirements + errors */}
          {!ok && (
            <ul className="confirm-issues">
              {issues.map((it: string) => <li key={it}>{it}</li>)}
            </ul>
          )}
          {pw2.length > 0 && !confirmMatch && (
            <div className="confirm-mismatch">Passwords do not match</div>
          )}
          {error && <div className="confirm-error">{error}</div>}

          <button type="submit" className="confirm-btn" disabled={busy}>
            {busy ? "Updating..." : "Update password"}
          </button>
        </form>
      </section>
    </main>
  );
}