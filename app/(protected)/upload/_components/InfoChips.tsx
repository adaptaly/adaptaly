"use client";

import React, { useState, useCallback } from "react";

/**
 * Controlled <details> so only ONE chip can be open at a time.
 * Prevents the native toggle flicker and rapid switching issues.
 */
export default function InfoChips() {
  const [openId, setOpenId] = useState<null | "formats" | "privacy" | "recent" | "how">(null);

  // Toggle handler that cleanly closes previous popover before opening the new one
  const toggle = useCallback(
    (id: "formats" | "privacy" | "recent" | "how") => (e: React.MouseEvent | React.KeyboardEvent) => {
      // stop native <summary> toggle to avoid race/flicker
      e.preventDefault();
      e.stopPropagation();
      setOpenId((prev) => (prev === id ? null : id));
    },
    []
  );

  // Keyboard support for Enter/Space on summary
  const keyToggle = (id: "formats" | "privacy" | "recent" | "how") => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpenId((prev) => (prev === id ? null : id));
    }
  };

  return (
    <div className="up-info-row" aria-label="More info">
      <details className="up-pop" open={openId === "formats"}>
        <summary className="up-chip" onClick={toggle("formats")} onKeyDown={keyToggle("formats")} role="button" tabIndex={0}>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M4 7h16M4 12h10M4 17h16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Supported formats
        </summary>
        <div className="up-pop-panel" role="dialog" aria-label="Formats and limits">
          <p className="up-pop-title">Formats and limits</p>
          <ul className="up-pop-list">
            <li className="up-row"><span className="up-dot" /> PDF, DOCX, TXT, MD</li>
            <li className="up-row"><span className="up-dot" /> Max 15 MB</li>
            <li className="up-row"><span className="up-dot" /> Up to 60 pages</li>
          </ul>
        </div>
      </details>

      <details className="up-pop" open={openId === "privacy"}>
        <summary className="up-chip" onClick={toggle("privacy")} onKeyDown={keyToggle("privacy")} role="button" tabIndex={0}>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M12 3l8 4v5c0 5-8 9-8 9S4 17 4 12V7l8-4z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Privacy
        </summary>
        <div className="up-pop-panel" role="dialog" aria-label="Your data">
          <p className="up-pop-title">Your data</p>
          <ul className="up-pop-list">
            <li className="up-row">Processed securely. Delete anytime.</li>
            <li className="up-row"><a href="/privacy">Privacy Policy</a></li>
          </ul>
        </div>
      </details>

      <details className="up-pop" open={openId === "recent"}>
        <summary className="up-chip" onClick={toggle("recent")} onKeyDown={keyToggle("recent")} role="button" tabIndex={0}>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M8 7h12M4 12h16M8 17h12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Recent
        </summary>
        <div className="up-pop-panel" role="dialog" aria-label="Recent uploads">
          <p className="up-pop-title">Last 3</p>
          <ul className="up-pop-list">
            <li className="up-row"><span className="up-dot" /> Lecture 04 Thermodynamics.pdf</li>
            <li className="up-row"><span className="up-dot" /> Marketing Chapter 7.docx</li>
            <li className="up-row"><span className="up-dot" /> Notes_week3.txt</li>
          </ul>
        </div>
      </details>

      <details className="up-pop" open={openId === "how"}>
        <summary className="up-chip" onClick={toggle("how")} onKeyDown={keyToggle("how")} role="button" tabIndex={0}>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          How it works
        </summary>
        <div className="up-pop-panel" role="dialog" aria-label="How it works">
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