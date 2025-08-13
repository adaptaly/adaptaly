import React from "react";
import Link from "next/link";
import "./result.css";

/**
 * Next.js 15 App Router types expect `params` to be a Promise in server components.
 * Make the page async and `await params` to satisfy the PageProps constraint.
 */
export const metadata = { title: "Upload Result | Adaptaly" };

export default async function ResultPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = await params;

  return (
    <div className="up-result">
      <header className="up-result-header">
        <Link href="/upload" className="up-back" aria-label="Back to upload">
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
        </Link>

        <div className="up-head-text">
          <h1 className="up-title">Study Pack ready</h1>
          <p className="up-subtitle">Document ID: {docId}</p>
        </div>

        <Link className="up-help" href="/dashboard" aria-label="Go to dashboard">
          Dashboard
        </Link>
      </header>

      <main className="up-result-main">
        <div className="up-card up-result-card">
          <h3>Placeholder</h3>
          <p>
            Step 1 complete. Your upload was accepted and the document is marked as{" "}
            <strong>ready</strong>.
          </p>
          <p>In Step 2 and Step 3 we will parse text and generate summary + flashcards here.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <Link className="up-btn primary" href="/review">
              Start Review
            </Link>
            <Link className="up-btn secondary" href="/dashboard">
              Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}