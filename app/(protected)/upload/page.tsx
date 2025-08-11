import React from "react";
import "./upload.css";
import Dropzone from "./_components/Dropzone";
import InfoChips from "./_components/InfoChips";

export const metadata = { title: "Upload | Adaptaly" };

export default function UploadPage() {
  return (
    <div className="up-page" data-page="upload">
      <header className="up-header">
        <a className="up-back" href="/dashboard" aria-label="Go back to dashboard">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </a>

        <div className="up-head-text">
          <h1 className="up-title">Upload a file</h1>
          <p className="up-subtitle">Turn your notes into a Study Pack in seconds</p>
        </div>

        <a className="up-help" href="/help/upload" aria-label="Open upload help">
          Help
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M5 12h12M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </header>

      <main className="up-main">
        <Dropzone />
        <InfoChips />
      </main>
    </div>
  );
}