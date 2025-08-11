"use client";

import React, { useRef, useState } from "react";
import ProgressSteps from "./ProgressSteps";

type Step = "Uploading" | "Cleaning text" | "Summarizing" | "Building flashcards";
const steps: Step[] = ["Uploading", "Cleaning text", "Summarizing", "Building flashcards"];

export default function Dropzone() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressPct, setProgressPct] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1);
  const [done, setDone] = useState(false);

  const onChooseClick = () => inputRef.current?.click();

  const handleFiles = (files: FileList | null) => {
    setError(null);
    if (!files || files.length === 0) return;
    const file = files[0];

    // type
    const okExt = /\.(pdf|docx|txt|md)$/i.test(file.name);
    if (!okExt) {
      setError("That format is not supported yet.");
      return;
    }
    // size
    const maxBytes = 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError("This file is over 15 MB.");
      return;
    }
    startDemoProgress();
  };

  const startDemoProgress = () => {
    setDone(false);
    setCurrentStepIdx(0);
    setProgressPct(0);

    let pct = 0;
    const t = setInterval(() => {
      pct += Math.random() * 15 + 8;
      if (pct >= 100) {
        pct = 100;
        clearInterval(t);
        setProgressPct(100);
        setTimeout(() => setCurrentStepIdx(1), 250);
        setTimeout(() => setCurrentStepIdx(2), 950);
        setTimeout(() => setCurrentStepIdx(3), 1750);
        setTimeout(() => setDone(true), 2600);
      } else {
        setProgressPct(Math.floor(pct));
      }
    }, 240);
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); handleFiles(e.dataTransfer.files); };
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => { handleFiles(e.target.files); e.currentTarget.value = ""; };

  return (
    <>
      <div
        className={`up-card up-dropzone ${dragActive ? "is-active" : ""}`}
        role="region"
        aria-label="File upload zone"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="up-dropzone-inner">
          <UploadIcon className="up-dz-icon" />
          <p className="up-dz-title">Choose a file to upload</p>
          <p className="up-dz-sub">We transform it into a clean summary and quality flashcards</p>

          <div className="up-dz-actions">
            <button className="up-btn primary" onClick={onChooseClick}>
              Choose file
            </button>
            <button className="up-btn secondary" onClick={onChooseClick} aria-label="Open file picker">
              Or drag and drop
            </button>
          </div>

          <p className="up-dz-formats">PDF, DOCX, TXT, MD. Up to 15 MB and 60 pages.</p>

          <input
            ref={inputRef}
            className="up-visually-hidden"
            type="file"
            accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
            onChange={onChange}
            tabIndex={-1}
          />
        </div>
      </div>

      {error && (
        <div className="up-alert" role="alert">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M12 9v4m0 4h.01M10.29 3.86l-8.02 13.9A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3.24l-8.02-13.9a2 2 0 0 0-3.42 0z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <strong style={{ display: "block", marginBottom: 2 }}>Upload error</strong>
            {error}
          </div>
        </div>
      )}

      {currentStepIdx >= 0 && (
        <div className="up-card up-progress-card" aria-live="polite">
          <ProgressSteps steps={steps} activeIndex={currentStepIdx} uploadingPct={progressPct} />

          {done && (
            <div className="up-success" role="status">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckIcon />
                <span>All set. Your Study Pack is ready.</span>
              </div>
              <button className="up-btn primary" disabled title="Design preview">Open Study Pack</button>
            </div>
          )}
        </div>
      )}

      {/* Mobile sticky primary CTA */}
      <div className="up-sticky">
        <button className="up-btn primary" onClick={onChooseClick}>Choose file</button>
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
      <path d="M32 40V18m0 0l-8 8m8-8l8 8" fill="none" stroke="url(#up-g)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="12" y="40" width="40" height="12" rx="6" fill="none" stroke="url(#up-g)" strokeWidth="2"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}