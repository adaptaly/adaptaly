"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Info chips with single-open behavior.
 * - Clicking a new chip closes the previously open one
 * - Keyboard toggle works (Enter/Space on <summary>)
 * - Type-safe ref callbacks (return void)
 */
export default function InfoChips() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const nodesRef = useRef<Array<HTMLDetailsElement | null>>([]);

  // Keep DOM <details> elements in sync with state (single open)
  useEffect(() => {
    nodesRef.current.forEach((el, idx) => {
      if (!el) return;
      // Open only the current index; close all others
      if (openIndex === idx && !el.open) el.open = true;
      if (openIndex !== idx && el.open) el.open = false;
    });
  }, [openIndex]);

  // Safe ref setter that returns void (fixes TS2322)
  const bindRef = (idx: number) => (el: HTMLDetailsElement | null): void => {
    nodesRef.current[idx] = el;
  };

  // When a details toggles, update state to enforce single-open rule
  const onToggle = (idx: number) => () => {
    setOpenIndex((curr) => (curr === idx ? null : idx));
  };

  return (
    <div className="up-info-row" aria-label="More info">
      <details className="up-pop" ref={bindRef(0)} onToggle={onToggle(0)}>
        <summary className="up-chip">
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path
              d="M4 7h16M4 12h10M4 17h16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Supported formats
        </summary>
        <div className="up-pop-panel">
          <p className="up-pop-title">Formats and limits</p>
          <ul className="up-pop-list">
            <li className="up-row">
              <span className="up-dot" /> PDF, DOCX, TXT
            </li>
            <li className="up-row">
              <span className="up-dot" /> Max 15 MB
            </li>
            <li className="up-row">
              <span className="up-dot" /> Up to 60 pages
            </li>
          </ul>
        </div>
      </details>

      <details className="up-pop" ref={bindRef(1)} onToggle={onToggle(1)}>
        <summary className="up-chip">
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path
              d="M12 3l8 4v5c0 5-8 9-8 9S4 17 4 12V7l8-4z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Privacy
        </summary>
        <div className="up-pop-panel">
          <p className="up-pop-title">Your data</p>
          <ul className="up-pop-list">
            <li className="up-row">Processed securely. Delete anytime.</li>
            <li className="up-row">
              <a href="/privacy">Privacy Policy</a>
            </li>
          </ul>
        </div>
      </details>

      <details className="up-pop" ref={bindRef(2)} onToggle={onToggle(2)}>
        <summary className="up-chip">
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path
              d="M8 7h12M4 12h16M8 17h12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Recent
        </summary>
        <div className="up-pop-panel">
          <p className="up-pop-title">Last 3</p>
          <ul className="up-pop-list">
            <li className="up-row">
              <span className="up-dot" /> Lecture 04 Thermodynamics.pdf
            </li>
            <li className="up-row">
              <span className="up-dot" /> Marketing Chapter 7.docx
            </li>
            <li className="up-row">
              <span className="up-dot" /> Notes_week3.txt
            </li>
          </ul>
        </div>
      </details>

      <details className="up-pop" ref={bindRef(3)} onToggle={onToggle(3)}>
        <summary className="up-chip">
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          How it works
        </summary>
        <div className="up-pop-panel">
          <p className="up-pop-title">3 quick steps</p>
          <ul className="up-pop-list">
            <li className="up-row">
              <span className="up-dot" /> Upload a file
            </li>
            <li className="up-row">
              <span className="up-dot" /> We clean and parse
            </li>
            <li className="up-row">
              <span className="up-dot" /> You get summary + cards
            </li>
          </ul>
        </div>
      </details>
    </div>
  );
}