"use client";

import React from "react";

type Props = {
  steps: string[];
  activeIndex: number;
  uploadingPct?: number;
};

/* Optional tiny component if you want to reuse steps elsewhere later */
export default function ProgressSteps({ steps, activeIndex, uploadingPct = 0 }: Props) {
  return (
    <div className="up-steps">
      {steps.map((label, idx) => {
        const isActive = idx === activeIndex;
        const isDone = idx < activeIndex || (idx === 0 && uploadingPct === 100 && activeIndex > 0);
        return (
          <div key={label} className={`up-step ${isDone ? "up-step--done" : ""}`}>
            <div aria-hidden="true">
              {isDone ? <CheckIcon /> : isActive ? <SpinnerIcon /> : <DotIcon />}
            </div>
            <div>
              <div className="up-step-label">{label}</div>
              <div className="up-step-hint">
                {idx === 0 && isActive ? `${uploadingPct}%` : isDone ? "Done" : isActive ? "In progress" : "Pending"}
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

function CheckIcon(){ return (<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>); }
function DotIcon(){ return (<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="currentColor" opacity=".35" /></svg>); }
function SpinnerIcon(){ return (<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" style={{ transformOrigin:"center", animation:"up-spin 1s linear infinite" as any }}><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".4"/><path d="M12 4a8 8 0 0 1 8 8" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>); }