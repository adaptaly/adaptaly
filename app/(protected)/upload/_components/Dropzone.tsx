"use client";

import React, { useRef, useState, useEffect } from "react";
import ProgressSteps from "./ProgressSteps";

type Step = "Uploading" | "Cleaning text" | "Summarizing" | "Building flashcards";
const steps: Step[] = ["Uploading", "Cleaning text", "Summarizing", "Building flashcards"];

export default function Dropzone() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Demo progress state for design only
  const [progressPct, setProgressPct] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1); // -1 means idle
  const [done, setDone] = useState(false);

  // Accessibility live region
  const [liveMsg, setLiveMsg] = useState("");

  const onChooseClick = () => inputRef.current?.click();

  const handleFiles = (files: FileList | null) => {
    setError(null);
    if (!files || files.length === 0) return;
    const file = files[0];
    const { name, size } = file;

    // Validate type
    const okExt = /\.(pdf|docx|txt|md)$/i.test(name);
    if (!okExt) {
      setError("That format is not supported yet.");
      setFileName(null);
      return;
    }

    // Validate size 15 MB
    const maxBytes = 15 * 1024 * 1024;
    if (size > maxBytes) {
      setError("This file is over 15 MB.");
      setFileName(null);
      return;
    }

    setFileName(name);
    startDemoProgress();
  };

  const startDemoProgress = () => {
    // Reset states
    setDone(false);
    setCurrentStepIdx(0);
    setProgressPct(0);
    setLiveMsg("Uploading started.");

    // Simulate progress for design preview
    // Uploading 0-100 then step complete, then the rest as discrete steps
    let pct = 0;
    const uploadTimer = setInterval(() => {
      pct += Math.random() * 15 + 8;
      if (pct >= 100) {
        pct = 100;
        clearInterval(uploadTimer);
        setProgressPct(100);
        setLiveMsg("Upload complete. Cleaning text.");
        // Progress through steps with short delays
        setTimeout(() => setCurrentStepIdx(1), 250);
        setTimeout(() => setCurrentStepIdx(2), 950);
        setTimeout(() => setCurrentStepIdx(3), 1750);
        setTimeout(() => {
          setDone(true);
          setLiveMsg("All steps complete.");
        }, 2600);
      } else {
        setProgressPct(Math.floor(pct));
      }
    }, 240);
  };

  // Drag handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // reset input value so selecting same file again still triggers change
    e.currentTarget.value = "";
  };

  useEffect(() => {
    return () => {
      // cleanup if any future timers added
    };
  }, []);

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
          <p className="up-dz-sub">We will turn it into a summary and flashcards</p>

          <div className="up-dz-actions">
            <button className="up-btn primary" onClick={onChooseClick}>
              Choose file
            </button>
            <button
              className="up-btn"
              onClick={() => inputRef.current?.click()}
              aria-label="Open file picker"
            >
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

      {/* Progress and success demo */}
      {currentStepIdx >= 0 && (
        <div className="up-card up-progress-card" aria-live="polite">
          <ProgressSteps
            steps={steps}
            activeIndex={currentStepIdx}
            uploadingPct={progressPct}
          />

          {done && (
            <div className="up-success" role="status">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckIcon />
                <span>All set. Your Study Pack is ready.</span>
              </div>
              <button className="up-btn primary" disabled title="Design demo only">
                Open Study Pack
              </button>
            </div>
          )}

          <span className="up-visually-hidden" aria-live="polite">{liveMsg}</span>
        </div>
      )}

      {/* Sticky mobile CTA */}
      <div className="up-sticky">
        <button className="up-btn primary" onClick={onChooseClick}>
          Choose file
        </button>
      </div>
    </>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="up-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6C9EFF" />
          <stop offset="1" stopColor="#9fc0ff" />
        </linearGradient>
      </defs>
      <path d="M32 40v-20m0 0l-8 8m8-8l8 8" fill="none" stroke="url(#up-g)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
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