"use client";

import { FunctionComponent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./loadingpage.css";

const STORAGE = {
  status: "adaptaly:status", // "pending" | "done" | "error"
  error: "adaptaly:error",
} as const;

const POLL_MS = 750;
const MAX_WAIT_MS = 120_000; // 2 minutes

function sanitizeError(raw: string): string {
  if (!raw) return "Something went wrong.";
  const noTags = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return noTags.slice(0, 300) + (noTags.length > 300 ? " …" : "");
}

const LoadingFiles: FunctionComponent = () => {
  const router = useRouter();

  // UI
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing…");
  const [elapsed, setElapsed] = useState(0);

  // states
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [pollToken, setPollToken] = useState(0); // restart polling after timeout

  // Cosmetic progress
  useEffect(() => {
    const steps = [
      { at: 0, msg: "Initializing…" },
      { at: 15, msg: "Reading document…" },
      { at: 35, msg: "Processing content…" },
      { at: 55, msg: "Extracting key information…" },
      { at: 75, msg: "Generating summary & cards…" },
      { at: 90, msg: "Finalizing…" },
    ];
    let i = 0;
    const id = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + (Math.random() * 2 + 0.5), 99);
        if (i + 1 < steps.length && next >= steps[i + 1].at) {
          i++;
          setStatusText(steps[i].msg);
        }
        return next;
      });
    }, 120);
    return () => clearInterval(id);
  }, []);

  // Elapsed timer
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  // Real completion/error poll + timeout guard
  useEffect(() => {
    const deadline = Date.now() + MAX_WAIT_MS;
    const id = setInterval(() => {
      const s = localStorage.getItem(STORAGE.status);

      if (s === "done") {
        clearInterval(id);
        setIsComplete(true);
        setProgress(100);
        router.push("/result");
        return;
      }
      if (s === "error") {
        clearInterval(id);
        const raw = localStorage.getItem(STORAGE.error) || "We couldn’t analyze that file.";
        setError(sanitizeError(raw));
        return;
      }

      if (!s || s === "pending") {
        if (Date.now() > deadline) {
          clearInterval(id);
          setTimedOut(true);
        }
      }
    }, POLL_MS);

    return () => clearInterval(id);
  }, [router, pollToken]);

  function keepWaiting() {
    setTimedOut(false);
    setPollToken((t) => t + 1);
  }

  return (
    <div className="loadingfiles">
      <div className="loading-files-parent">
        <div className="loading-files">Analyzing your document…</div>

        {!error && !timedOut && (
          <>
            <div className="status-text">{statusText}</div>

            <div className="frame-child">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
              />
            </div>

            <div className="loading-percentage">
              {Math.round(progress)}% • Elapsed {elapsed}s
            </div>

            {!isComplete && (
              <div className="loading-dots" aria-hidden="true">
                <div className="dot" />
                <div className="dot" />
                <div className="dot" />
              </div>
            )}
          </>
        )}

        {isComplete && !error && (
          <div className="completion-message">
            <div className="check-icon">✓</div>
            Analysis Done! Redirecting…
          </div>
        )}

        {error && (
          <div className="error-block">
            <p>{error}</p>
            <a href="/" className="retry-link">Try again</a>
          </div>
        )}

        {timedOut && !error && (
          <div className="error-block">
            <p>
              This is taking longer than usual. You can keep waiting or cancel and
              re-upload.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button className="retry-link" onClick={keepWaiting}>
                Keep waiting
              </button>
              <a href="/" className="retry-link">Cancel</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingFiles;