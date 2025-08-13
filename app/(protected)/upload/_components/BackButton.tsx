"use client";

import { useRouter } from "next/navigation";
import React from "react";

/** Back button that actually goes back in history; falls back to /dashboard. */
export default function BackButton() {
  const router = useRouter();

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <a className="up-back" href="/dashboard" onClick={onClick} aria-label="Go back">
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </a>
  );
}