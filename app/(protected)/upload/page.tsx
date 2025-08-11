import React from "react";
import "./upload.css";
import Dropzone from "./_components/Dropzone";
import HowItWorks from "./_components/HowItWorks";
import ExamplePreview from "./_components/ExamplePreview";
import PrivacyNote from "./_components/PrivacyNote";
import RecentUploads from "./_components/RecentUploads";

export const metadata = {
  title: "Upload | Adaptaly",
};

export default function UploadPage() {
  // Server component shell, all interactivity lives in child client components
  return (
    <div className="up-page">
      <header className="up-header">
        <div>
          <h1 className="up-title">Upload a file</h1>
          <p className="up-subtitle">Turn your notes into a Study Pack in seconds</p>
        </div>
        <a className="up-help-link" href="/help/upload" aria-label="Open upload help">
          Help
          <svg className="up-icon-arrow" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M5 12h12M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </header>

      <main className="up-grid">
        <section className="up-left">
          <Dropzone />
        </section>

        <aside className="up-right">
          <HowItWorks />
          <ExamplePreview />
          <PrivacyNote />
          <RecentUploads />
        </aside>
      </main>
    </div>
  );
}