"use client";

import React, { useRef, useState } from "react";

/**
 * Design-only dropzone with fixed MIN-height.
 * Now grows naturally when inner content (errors, progress, etc.) grows.
 * The previous “Not authenticated” badge was removed to avoid false states.
 */
type Step = "Uploading" | "Cleaning text" | "Summarizing" | "Building flashcards";
const STEPS: Step[] = ["Uploading", "Cleaning text", "Summarizing", "Building flashcards"];

export default function Dropzone() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // demo state for design
  const [mode, setMode] = useState<"idle" | "progress" | "done">("idle");
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [pct, setPct] = useState(0);

  const openPicker = () => inputRef.current?.click();

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const f = files[0];
    const ok = /\.(pdf|docx|txt|md)$/i.test(f.name) && f.size <= 15 * 1024 * 1024;
    if (!ok) {
      alert("Design demo: unsupported file type or > 15 MB.");
      return;
    }
    setMode("progress");
    setActiveIdx(0);
    setPct(0);
    let p = 0;
    const t = setInterval(() => {
      p += Math.random() * 15 + 8;
      if (p >= 100) {
        p = 100;
        clearInterval(t);
        setPct(100);
        setTimeout(() => setActiveIdx(1), 250);
        setTimeout(() => setActiveIdx(2), 900);
        setTimeout(() => setActiveIdx(3), 1650);
        setTimeout(() => setMode("done"), 2400);
      } else {
        setPct(Math.floor(p));
      }
    }, 240);
  }

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); handleFiles(e.dataTransfer.files); };

  return (
    <>
      <section
        className={`up-card up-dz ${dragActive ? "is-active" : ""}`}
        aria-label="File upload"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="up-dz-inner">
          {mode === "idle" && (
            <div className="up-dz-idle" aria-live="polite">
              <UploadIcon className="up-icon" />
              <p className="up-h1">{dragActive ? "Drop to upload" : "Choose a file to upload"}</p>
              <p className="up-h2">We turn it into a summary and quality flashcards</p>

              <div className="up-actions">
                <button className="up-btn primary" onClick={openPicker}>Choose file</button>
                <button className="up-btn secondary" onClick={openPicker} aria-label="Open file picker">
                  Or drag and drop
                </button>
              </div>

              <p className="up-formats">PDF, DOCX, TXT, MD. Up to 15 MB and 60 pages.</p>
            </div>
          )}

          {mode !== "idle" && (
            <div className="up-dz-progress" aria-live="polite">
              <h3 className="up-progress-title">Preparing your Study Pack</h3>

              <div className="up-steps">
                {STEPS.map((label, i) => {
                  const isActive = i === activeIdx;
                  const isDone = i < activeIdx || (i === 0 && pct === 100 && activeIdx > 0);
                  return (
                    <div key={label} className={`up-step ${isDone ? "up-step--done" : ""}`}>
                      <div aria-hidden="true">
                        {isDone ? <CheckIcon /> : isActive ? <SpinnerIcon /> : <DotIcon />}
                      </div>
                      <div>
                        <div className="up-step-label">{label}</div>
                        <div className="up-step-hint">
                          {i === 0 && isActive ? `${pct}%` : isDone ? "Done" : isActive ? "In progress" : "Pending"}
                        </div>
                        {i === 0 && (
                          <div className="up-bar-wrap" aria-hidden={i !== 0}>
                            <div className="up-bar" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
                          </div>
                        )}
                      </div>
                      <div className="up-pill">{isDone ? "Completed" : isActive ? "Active" : "Pending"}</div>
                    </div>
                  );
                })}
              </div>

              {mode === "done" && (
                <div className="up-success" role="status">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckIcon />
                    <span>All set. Your Study Pack is ready.</span>
                  </div>
                  <button className="up-btn primary" title="Design only" disabled>Open Study Pack</button>
                </div>
              )}
            </div>
          )}

          <input
            ref={inputRef}
            className="up-visually-hidden"
            type="file"
            accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
            onChange={(e) => { handleFiles(e.target.files); e.currentTarget.value = ""; }}
            tabIndex={-1}
          />
        </div>
      </section>

      {/* Mobile sticky CTA */}
      <div className="up-sticky">
        <button className="up-btn primary" onClick={openPicker}>Choose file</button>
      </div>
    </>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="up-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4BC3B7" />
          <stop offset="1" stopColor="#8fe1d8" />
        </linearGradient>
      </defs>
      <path d="M32 40V18m0 0l-8 8m8-8l8 8" fill="none" stroke="url(#up-g)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="12" y="40" width="40" height="12" rx="6" fill="none" stroke="url(#up-g)" strokeWidth="2" />
    </svg>
  );
}
function CheckIcon(){ return (<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>); }
function DotIcon(){ return (<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="currentColor" opacity=".35" /></svg>); }
function SpinnerIcon(){ return (<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="up-spin"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".4"/><path d="M12 4a8 8 0 0 1 8 8" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>); }