"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Controlled <details> so only ONE chip can be open at a time.
 * Also closes when clicking outside — removes the “glitch”/toggling effect.
 */
export default function InfoChips() {
  const [openKey, setOpenKey] = useState<"formats" | "privacy" | "recent" | "how" | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // click outside to close all
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpenKey(null);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const toggle = (key: typeof openKey) => () => setOpenKey(prev => (prev === key ? null : key));

  return (
    <div ref={wrapRef} className="up-info-row" aria-label="More info">
      <details className="up-pop" open={openKey === "formats"}>
        <summary className="up-chip" onClick={toggle("formats")}>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M4 7h16M4 12h10M4 17h16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Supported formats
        </summary>
        <div className="up-pop-panel">
          <p className="up-pop-title">Formats and limits</p>
          <ul className="up-pop-list">
            <li className="up-row"><span className="up-dot" /> PDF, DOCX, TXT, MD</li>
            <li className="up-row"><span className="up-dot" /> Max 15 MB</li>
            <li className="up-row"><span className="up-dot" /> Up to 60 pages</li>
          </ul>
        </div>
      </details>

      <details className="up-pop" open={openKey === "privacy"}>
        <summary className="up-chip" onClick={toggle("privacy")}>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 3l8 4v5c0 5-8 9-8 9S4 17 4 12V7l8-4z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Privacy
        </summary>
        <div className="up-pop-panel">
          <p className="up-pop-title">Your data</p>
          <ul className="up-pop-list">
            <li className="up-row">Processed securely. Delete anytime.</li>
            <li className="up-row"><a href="/privacy">Privacy Policy</a></li>
          </ul>
        </div>
      </details>

      <details className="up-pop" open={openKey === "recent"}>
        <summary className="up-chip" onClick={toggle("recent")}>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M8 7h12M4 12h16M8 17h12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Recent
        </summary>
        <div className="up-pop-panel">
          <p className="up-pop-title">Last 3</p>
          <ul className="up-pop-list">
            <li className="up-row"><span className="up-dot" /> Lecture 04 Thermodynamics.pdf</li>
            <li className="up-row"><span className="up-dot" /> Marketing Chapter 7.docx</li>
            <li className="up-row"><span className="up-dot" /> Notes_week3.txt</li>
          </ul>
        </div>
      </details>

      <details className="up-pop" open={openKey === "how"}>
        <summary className="up-chip" onClick={toggle("how")}>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          How it works
        </summary>
        <div className="up-pop-panel">
          <p className="up-pop-title">3 quick steps</p>
          <ul className="up-pop-list">
            <li className="up-row"><span className="up-dot" /> Upload a file</li>
            <li className="up-row"><span className="up-dot" /> We clean and parse</li>
            <li className="up-row"><span className="up-dot" /> You get summary + cards</li>
          </ul>
        </div>
      </details>
    </div>
  );
}