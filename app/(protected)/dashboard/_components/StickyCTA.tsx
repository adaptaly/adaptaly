// app/(protected)/dashboard/_components/StickyCTA.tsx
"use client";

import Link from "next/link";

type Props = { hasDocs: boolean; dueCount: number };

export default function StickyCTA({ hasDocs, dueCount }: Props) {
  const label =
    dueCount > 0 ? `Review ${dueCount} due` : hasDocs ? "Start 5-minute session" : "Upload file";
  const href = dueCount > 0 ? "/review" : hasDocs ? "/review?quick=1" : "/?upload=1";

  return (
    <div className="db-sticky-cta">
      <Link className="db-btn db-btn-primary" href={href} aria-label={label}>
        {label}
        <span className="db-btn-icon" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14M13 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </Link>
    </div>
  );
}