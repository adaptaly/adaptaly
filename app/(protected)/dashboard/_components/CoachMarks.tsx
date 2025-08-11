// app/(protected)/dashboard/_components/CoachMarks.tsx
"use client";

import { useEffect, useState } from "react";

const KEY = "coachmarks_v23_dismissed";

export default function CoachMarks() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v !== "1") setOpen(true);
    } catch {
      // ignore storage errors
    }
  }, []);

  if (!open) return null;

  const dismiss = () => {
    try { localStorage.setItem(KEY, "1"); } catch {}
    setOpen(false);
  };

  return (
    <div className="db-coach" role="dialog" aria-modal="false" aria-label="Tips for getting started">
      <div className="db-coach-inner">
        <div className="db-coach-row">
          <div className="db-coach-tip">
            <strong>Goal ring</strong> shows progress to your daily minutes.
          </div>
          <div className="db-coach-tip">
            <strong>Primary button</strong> starts your default action.
          </div>
          <div className="db-coach-tip">
            <strong>Upload</strong> to create your first study pack.
          </div>
        </div>
        <button className="db-btn db-btn-primary" onClick={dismiss} aria-label="Got it">Got it</button>
      </div>
    </div>
  );
}