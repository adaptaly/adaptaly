// app/(protected)/dashboard/_components/StickyCTA.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = { hasDocs: boolean; dueCount: number; sentinelId: string };

export default function StickyCTA({ hasDocs, dueCount, sentinelId }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById(sentinelId);
    if (!el) { setVisible(true); return; }
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [sentinelId]);

  const label = dueCount > 0 ? `Review ${dueCount} due` : hasDocs ? "Start 5-minute session" : "Upload file";
  const href = dueCount > 0 ? "/review" : hasDocs ? "/review?quick=1" : "/?upload=1";

  return (
    <div className="db-sticky-cta" style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}>
      <Link className="db-btn db-btn-primary" href={href} aria-label={label}>
        {label}
        <span className="db-btn-icon" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>
    </div>
  );
}