"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/src/lib/supabaseClient";

type Step = "Uploading" | "Cleaning text" | "Summarizing" | "Building flashcards";
const STEPS: Step[] = ["Uploading", "Cleaning text", "Summarizing", "Building flashcards"];

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];

interface Message {
  text: string;
  type: "error" | "success" | "warning";
}

export default function Dropzone() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [mode, setMode] = useState<"idle" | "progress" | "done" | "error">("idle");
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [pct, setPct] = useState(0);
  const [message, setMessage] = useState<Message | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const router = useRouter();

  const openPicker = () => inputRef.current?.click();

  const showMessage = (text: string, type: Message["type"]) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 7000);
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" is too large. Max size is 15 MB.`;
    }
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
      return `"${file.name}" is not supported. Use PDF, DOCX, TXT, or MD.`;
    }
    return null;
  };

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];

    const error = validateFile(file);
    if (error) {
      showMessage(error, "error");
      return;
    }

    setIsUploading(true);
    setMode("progress");
    setActiveIdx(0);
    setPct(0);

    try {
      // Get current user from Supabase client
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Step 1: Initialize upload in database
      const { data: initData, error: initError } = await fetch("/api/uploads/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          size: file.size,
          mime: file.type,
          userId: user.id,
        }),
      }).then(res => res.json());

      if (!initData.ok) {
        throw new Error(initData.error || "Failed to initialize upload");
      }

      const { documentId, bucket, path } = initData;

      // Step 2: Upload file to Supabase Storage
      let uploadProgress = 0;
      const progressInterval = setInterval(() => {
        uploadProgress = Math.min(90, uploadProgress + Math.random() * 15 + 5);
        setPct(Math.floor(uploadProgress));
      }, 300);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      clearInterval(progressInterval);
      setPct(100);

      if (uploadError) {
        throw new Error("Failed to upload file");
      }

      // Step 3: Process the uploaded file
      setTimeout(() => setActiveIdx(1), 250);
      
      const { data: processData, error: processError } = await fetch("/api/uploads/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      }).then(res => res.json());

      if (!processData.ok) {
        throw new Error(processData.error || "Failed to process file");
      }

      // Step 4: Generate summary and flashcards
      setTimeout(() => setActiveIdx(2), 500);
      setTimeout(() => setActiveIdx(3), 1000);

      const { data: summaryData, error: summaryError } = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      }).then(res => res.json());

      if (summaryError || !summaryData) {
        throw new Error("Failed to generate summary and flashcards");
      }

      // Success!
      setTimeout(() => {
        setMode("done");
        showMessage(`"${file.name}" processed successfully!`, "success");
      }, 1500);

      // Store documentId for success button navigation
      setDocumentId(documentId);

      // Auto-redirect to results after a brief delay
      setTimeout(() => {
        router.push(`/upload/result/${documentId}`);
      }, 3000);

    } catch (err: any) {
      setMode("error");
      showMessage(err.message || "Upload failed. Please try again.", "error");
      setIsUploading(false);
    }
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
                <button 
                  className="up-btn primary" 
                  onClick={openPicker}
                  disabled={isUploading}
                  aria-describedby="file-formats"
                >
                  Choose file
                </button>
                <button 
                  className="up-btn secondary" 
                  onClick={openPicker} 
                  disabled={isUploading}
                  aria-label="Open file picker"
                >
                  Or drag and drop
                </button>
              </div>

              <p className="up-formats" id="file-formats">PDF, DOCX, TXT, MD. Up to 15 MB and 60 pages.</p>
              
              {message && (
                <div 
                  className={`message ${message.type}-message`}
                  role={message.type === "error" ? "alert" : "status"}
                  aria-live="polite"
                >
                  {message.text}
                </div>
              )}
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
                  <button 
                    className="up-btn primary" 
                    onClick={() => documentId && router.push(`/upload/result/${documentId}`)}
                    disabled={!documentId}
                  >
                    Open Study Pack
                  </button>
                </div>
              )}

              {mode === "error" && (
                <div className="up-error" role="alert">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <ErrorIcon />
                    <span>Upload failed. Please try again.</span>
                  </div>
                  <button 
                    className="up-btn primary" 
                    onClick={() => {
                      setMode("idle");
                      setIsUploading(false);
                      setMessage(null);
                    }}
                  >
                    Try Again
                  </button>
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
        <button 
          className="up-btn primary" 
          onClick={openPicker}
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Choose file"}
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
function ErrorIcon(){ return (<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>); }