"use client";

import React from "react";

type Props = {
  steps: string[];
  activeIndex: number; // 0..n
  uploadingPct?: number; // used for step 0 bar
};

export default function ProgressSteps({ steps, activeIndex, uploadingPct = 0 }: Props) {
  return (
    <div className="up-progress-steps">
      {steps.map((label, idx) => {
        const isActive = idx === activeIndex;
        const isDone = idx < activeIndex;
        const isError = false; // reserved styling
        return (
          <div
            key={label}
            className={`up-step ${isActive ? "up-step--active" : ""} ${isDone ? "up-step--done" : ""} ${isError ? "up-step--error" : ""}`}
          >
            <div aria-hidden="true">
              {isDone ? <CheckIcon /> : isActive ? <SpinnerIcon /> : <DotIcon />}
            </div>
            <div>
              <div className="up-step-label">{label}</div>
              <div className="up-step-hint">
                {idx === 0 && isActive ? `${uploadingPct}%` : isDone ? "Done" : isActive ? "In progress" : "Queued"}
              </div>
              {idx === 0 && (
                <div className="up-bar-wrap" aria-hidden={idx !== 0}>
                  <div className="up-bar" style={{ width: `${Math.max(0, Math.min(100, uploadingPct))}%` }} />
                </div>
              )}
            </div>
            <div className="up-pill">{isDone ? "Completed" : isActive ? "Active" : "Pending"}</div>
          </div>
        );
      })}
    </div>
  );
}

function DotIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <circle cx="12" cy="12" r="5" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" style={{ transformOrigin: "center", animation: "up-spin 1s linear infinite" as any }}>
      <defs>
        <linearGradient id="up-spin-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6C9EFF" />
          <stop offset="1" stopColor="#9fc0ff" />
        </linearGradient>
      </defs>
      <path d="M12 3a9 9 0 1 0 9 9" fill="none" stroke="url(#up-spin-g)" strokeWidth="2" strokeLinecap="round"/>
      <style jsx>{`
        @keyframes up-spin { to { transform: rotate(360deg); } }
      `}</style>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}