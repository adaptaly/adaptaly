// app/(auth)/reset/page.tsx
"use client";

import { useState } from "react";
import "./reset.css";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // ignore
    } finally {
      setSubmitted(true);
      setBusy(false);
    }
  }

  return (
    <main className="reset-wrap">
      <section className="reset-card">
        <h1 className="reset-title">Reset your password</h1>
        {submitted ? (
          <div className="reset-message">
            If there is an account for <b>{email || "that email"}</b> you will receive a reset link within a minute.
            Check your inbox and spam. You can close this window.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="reset-form">
            <label className="reset-label" htmlFor="email">Email address</label>
            <div className="reset-input-wrap">
              <svg className="reset-mail" width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path d="M4 6h16a2 2 0 0 1 2 2v.3l-10 5.6L2 8.3V8a2 2 0 0 1 2-2Zm0 4.7 7.55 4.23a1 1 0 0 0 .9 0L20 10.7V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5.3Z" />
              </svg>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="reset-input"
                autoComplete="email"
              />
            </div>

            <button type="submit" className="reset-btn" disabled={busy}>
              {busy ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <a className="reset-back" href="/signin">Back to sign in</a>
      </section>
    </main>
  );
}