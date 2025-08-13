"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function UploadHeader() {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    // If there's history, go back. If not (direct landing), go to dashboard.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <header className="up-header">
      <a className="up-back" href="#" onClick={handleBack} aria-label="Go back">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M15 19l-7-7 7-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back
      </a>

      <div className="up-head-text">
        <h1 className="up-title">Upload a file</h1>
        <p className="up-subtitle">Turn your notes into a Study Pack in seconds</p>
      </div>

      <a className="up-help" href="/help" aria-label="Open help">
        Help
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M5 12h12M13 6l6 6-6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </header>
  );
}