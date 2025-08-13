"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import "./upload.css";
import Dropzone from "./_components/Dropzone";
import InfoChips from "./_components/InfoChips";

export const metadata = { title: "Upload | Adaptaly" };

/**
 * Client page so we can control "Back" properly.
 * Back: go back if possible, otherwise fall back to /dashboard.
 * Help: goes to /help (not /help/upload).
 */
export default function UploadPage() {
  const router = useRouter();

  const handleBack = useCallback(() => {
    // If there's no meaningful history (e.g., direct entry), push to dashboard
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  }, [router]);

  const goHelp = useCallback(() => {
    router.push("/help");
  }, [router]);

  return (
    <div className="up-page" data-page="upload">
      <header className="up-header">
        <button
          type="button"
          className="up-back"
          onClick={handleBack}
          aria-label="Go back"
        >
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
        </button>

        <div className="up-head-text">
          <h1 className="up-title">Upload a file</h1>
          <p className="up-subtitle">
            Turn your notes into a Study Pack in seconds
          </p>
        </div>

        <button
          type="button"
          className="up-help"
          onClick={goHelp}
          aria-label="Open help"
        >
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
        </button>
      </header>

      <main className="up-main">
        <Dropzone />
        <InfoChips />
      </main>
    </div>
  );
}