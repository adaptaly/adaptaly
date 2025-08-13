"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Step = "Uploading" | "Cleaning text" | "Summarizing" | "Building flashcards";
const STEPS: Step[] = ["Uploading", "Cleaning text", "Summarizing", "Building flashcards"];

type InitResponse =
  | { ok: true; documentId: string; uploadUrl: string; path: string }
  | { ok: false; error: string };

type CompleteResponse =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Step 1: Functional upload
 * - Client validates PDF/DOCX/TXT, max 15MB
 * - Requests signed upload URL from /api/uploads/init
 * - Uses XHR PUT with real byte progress to Supabase Storage
 * - Calls /api/uploads/complete to mark "ready"
 * - Redirects to /upload/result/[docId]
 */
export default function Dropzone() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [mode, setMode] = useState<"idle" | "progress" | "done">("idle");
  const [activeIdx] = useState<number>(0); // Step 1 only shows "Uploading"
  const [pct, setPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const openPicker = () => inputRef.current?.click();

  function validateFile(f: File) {
    const extOk = /\.(pdf|docx|txt)$/i.test(f.name);
    const mimeOk = /(pdf|wordprocessingml\.document|text\/plain)$/i.test(f.type || "");
    const sizeOk = f.size <= 15 * 1024 * 1024;
    if (!extOk || !mimeOk || !sizeOk) {
      const reason = !extOk
        ? "Only PDF, DOCX, TXT are supported."
        : !sizeOk
        ? "File must be 15 MB or less."
        : "Unsupported file type.";
      return { ok: false as const, reason };
    }
    return { ok: true as const };
  }

  async function putWithProgress(url: string, file: File): Promise<void> {
    // Use XHR for byte-level progress
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return;
        const p = Math.max(0, Math.min(100, Math.round((e.loaded / e.total) * 100)));
        setPct(p);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed with status ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(file);
    });
  }

  async function startUpload(file: File) {
    setError(null);
    setMode("progress");
    setPct(0);

    // 1) INIT the upload (create document row + get signed upload URL)
    let initRes: InitResponse;
    try {
      const res = await fetch("/api/uploads/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, size: file.size, mime: file.type }),
      });
      initRes = await res.json();
    } catch {
      setMode("idle");
      setError("Could not start upload. Check your connection and try again.");
      return;
    }
    if (!initRes.ok) {
      setMode("idle");
      setError(initRes.error || "Could not start upload.");
      return;
    }

    const { documentId, uploadUrl } = initRes;

    // 2) Upload bytes with real progress to Supabase Storage
    try {
      await putWithProgress(uploadUrl, file);
    } catch (e: any) {
      setMode("idle");
      setError(e?.message || "Upload failed. Please try again.");
      return;
    }

    // 3) Tell server we finished uploading (for Step 1 we mark ready immediately)
    let doneRes: CompleteResponse;
    try {
      const res = await fetch("/api/uploads/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      doneRes = await res.json();
    } catch {
      setMode("idle");
      setError("Upload finished but we could not finalize the job.");
      return;
    }
    if (!doneRes.ok) {
      setMode("idle");
      setError(doneRes.error || "Could not finalize the upload.");
      return;
    }

    setPct(100);
    setMode("done");

    // 4) Redirect to result placeholder
    router.push(`/upload/result/${documentId}`);
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const f = files[0];
    const v = validateFile(f);
    if (!v.ok) {
      setError(v.reason);
      return;
    }
    startUpload(f);
  }

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

              <p className="up-formats">PDF, DOCX, TXT only. Up to 15 MB and 60 pages.</p>

              {error && (
                <div
                  role="status"
                  aria-live="assertive"
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    color: "var(--up-error)",
                    background: "#fff5f5",
                    border: "1px solid rgba(185, 28, 28, .2)",
                    padding: "8px 10px",
                    borderRadius: 10,
                  }}
                >
                  {error}
                </div>
              )}
            </div>
          )}

          {mode !== "idle" && (
            <div className="up-dz-progress" aria-live="polite">
              <h3 className="up-progress-title">Preparing your Study Pack</h3>

              {/* For Step 1 we only activate "Uploading". Other steps arrive in later steps. */}
              <div className="up-steps">
                {STEPS.map((label, i) => {
                  const isActive = i === 0; // only uploading is active for Step 1
                  const isDone = i === 0 && pct === 100;
                  return (
                    <div key={label} className={`up-step ${isDone ? "up-step--done" : ""}`}>
                      <div aria-hidden="true">
                        {isDone ? <CheckIcon /> : isActive ? <SpinnerIcon /> : <DotIcon />}
                      </div>
                      <div>
                        <div className="up-step-label">{label}</div>
                        <div className="up-step-hint">
                          {i === 0 ? `${pct}%` : "Pending"}
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
                    <span>All set. Redirecting to your Study Pack...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <input
            ref={inputRef}
            className="up-visually-hidden"
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.currentTarget.value = "";
            }}
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
function CheckIcon() {
  return (<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>);
}
function DotIcon() {
  return (<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="currentColor" opacity=".35" /></svg>);
}
function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="up-spin">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".4" />
      <path d="M12 4a8 8 0 0 1 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}