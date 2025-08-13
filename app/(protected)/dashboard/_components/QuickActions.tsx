// app/(protected)/dashboard/_components/QuickActions.tsx
"use client";
import Link from "next/link";

export default function QuickActions() {
  return (
    <section className="db-quick">
      <Link className="db-btn db-btn-secondary" href="/upload" aria-label="Upload a new file">
        <span className="db-btn-icon" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 16V4M12 4l-4 4M12 4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        Upload file
      </Link>
      <Link className="db-btn db-btn-secondary" href="/review">Review all</Link>
    </section>
  );
}