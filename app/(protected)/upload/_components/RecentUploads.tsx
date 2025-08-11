"use client";

import React from "react";

type Item = { id: string; title: string; meta: string; status: "ready" | "processing" | "error" };

const demo: Item[] = [
  { id: "1", title: "Lecture 04 Thermodynamics.pdf", meta: "Added 2h ago", status: "ready" },
  { id: "2", title: "Marketing Chapter 7.docx", meta: "Added 1d ago", status: "processing" },
  { id: "3", title: "Notes_week3.txt", meta: "Added 3d ago", status: "error" },
];

export default function RecentUploads() {
  return (
    <div className="up-card up-block" aria-labelledby="recent-uploads">
      <h3 id="recent-uploads">Recent uploads</h3>
      <div className="up-list">
        {demo.map((it) => (
          <div key={it.id} className="up-row">
            <div>
              <p className="up-row-title">{it.title}</p>
              <div className="up-row-meta">{it.meta}</div>
            </div>
            <div className={`up-status ${it.status === "ready" ? "ready" : it.status === "processing" ? "proc" : "err"}`}>
              {it.status === "ready" ? <ReadyIcon /> : it.status === "processing" ? <ProcIcon /> : <ErrIcon />}
              {it.status === "ready" ? "Ready" : it.status === "processing" ? "Processing" : "Error"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function ProcIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" style={{ transformOrigin: "center", animation: "up-spin 1s linear infinite" as any }}>
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
      <path d="M12 4a8 8 0 0 1 8 8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <style jsx>{`
        @keyframes up-spin { to { transform: rotate(360deg); } }
      `}</style>
    </svg>
  );
}
function ErrIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path d="M12 9v4m0 4h.01M10.29 3.86l-8.02 13.9A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3.24l-8.02-13.9a2 2 0 0 0-3.42 0z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}