"use client";
import React, { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useAuth } from "@/lib/auth";

export function AuthMenu() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  if (loading) return null;

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    await supabaseBrowser.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: location.origin },
    });
    alert("Check your email for the magic sign-in link.");
    setOpen(false);
    setEmail("");
  }

  if (user) {
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 900 }}>
          Hi {user.email}
        </span>
        <button className="btn ghost mini" onClick={() => supabaseBrowser.auth.signOut()}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <>
      <button className="btn ghost mini" onClick={() => setOpen(true)}>
        Sign in
      </button>
      {open && (
        <div className="modal-back" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Sign in</h3>
            <form onSubmit={sendLink}>
              <input
                className="search-input"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button className="btn mini" style={{ marginTop: 8 }} type="submit">
                Send magic link
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}