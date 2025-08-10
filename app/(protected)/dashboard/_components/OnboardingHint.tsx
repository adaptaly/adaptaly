// app/(protected)/dashboard/_components/OnboardingHint.tsx
"use client";
import { useEffect, useState } from "react";

const KEY = "adaptaly:dashboard:hint:dismissed";

export default function OnboardingHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const dismissed = typeof window !== "undefined" && localStorage.getItem(KEY) === "1";
    setShow(!dismissed);
  }, []);
  if (!show) return null;

  return (
    <div className="db-hint" role="note" aria-label="Dashboard tip">
      <span className="db-hint-dot" aria-hidden />
      Tip: Upload a file to generate your first Study Pack.
      <button className="db-hint-dismiss" onClick={() => { localStorage.setItem(KEY, "1"); setShow(false); }} aria-label="Dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}