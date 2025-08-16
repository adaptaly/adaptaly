"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/src/lib/supabaseClient";
import "./process.css";

type DocumentStatus = "uploading" | "processing" | "ready" | "error";

interface ProcessClientProps {
  documentId: string;
  initialStatus: DocumentStatus;
  filename: string | null;
  errorMessage: string | null;
}

const STATUS_MESSAGES = {
  uploading: "Uploading file...",
  processing: "Processing document...", 
  ready: "Ready!",
  error: "Error occurred"
};

const STEPS = [
  { key: "uploading", label: "Upload", description: "Uploading your file" },
  { key: "processing", label: "Process", description: "Extracting text content" },
  { key: "analyzing", label: "Analyze", description: "Generating summary" },
  { key: "flashcards", label: "Create", description: "Building flashcards" },
];

export default function ProcessClient({ 
  documentId, 
  initialStatus, 
  filename, 
  errorMessage 
}: ProcessClientProps) {
  const [status, setStatus] = useState<DocumentStatus>(initialStatus);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(errorMessage);
  const [isPolling, setIsPolling] = useState(true);
  const router = useRouter();

  // Determine current step based on status
  useEffect(() => {
    switch (status) {
      case "uploading":
        setCurrentStep(0);
        break;
      case "processing":
        setCurrentStep(1);
        break;
      case "ready":
        setCurrentStep(3);
        break;
      case "error":
        setIsPolling(false);
        break;
    }
  }, [status]);

  // Poll for status updates
  useEffect(() => {
    if (!isPolling || status === "ready" || status === "error") {
      return;
    }

    const pollStatus = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data, error } = await supabase
          .from("documents")
          .select("status,error_message")
          .eq("id", documentId)
          .single();

        if (error) {
          console.error("Failed to fetch status:", error);
          return;
        }

        if (data.status !== status) {
          setStatus(data.status);
          setError(data.error_message);

          if (data.status === "ready") {
            setIsPolling(false);
            // Auto-redirect to results after a brief delay
            setTimeout(() => {
              router.push(`/upload/result/${documentId}`);
            }, 2000);
          } else if (data.status === "error") {
            setIsPolling(false);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    const interval = setInterval(pollStatus, 1500);
    return () => clearInterval(interval);
  }, [documentId, status, isPolling, router]);

  const handleRetry = () => {
    router.push("/upload");
  };

  const handleViewResults = () => {
    router.push(`/upload/result/${documentId}`);
  };

  return (
    <div className="process-container">
      <header className="process-header">
        <h1 className="process-title">Processing Document</h1>
        <p className="process-subtitle">
          {filename ? `Processing "${filename}"` : "Processing your document"}
        </p>
      </header>

      <main className="process-main">
        <div className="process-card">
          {status === "error" ? (
            <div className="process-error" role="alert">
              <ErrorIcon />
              <h2>Processing Failed</h2>
              <p>{error || "An error occurred while processing your document."}</p>
              <div className="process-actions">
                <button className="process-btn primary" onClick={handleRetry}>
                  Try Again
                </button>
                <button className="process-btn secondary" onClick={() => router.push("/dashboard")}>
                  Go to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div className="process-steps">
              {STEPS.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep && status !== "ready";

                return (
                  <div 
                    key={step.key}
                    className={`process-step ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
                  >
                    <div className="step-indicator">
                      {isCompleted ? (
                        <CheckIcon />
                      ) : isCurrent ? (
                        <SpinnerIcon />
                      ) : (
                        <div className="step-number">{index + 1}</div>
                      )}
                    </div>
                    <div className="step-content">
                      <h3 className="step-label">{step.label}</h3>
                      <p className="step-description">{step.description}</p>
                      {isCurrent && (
                        <div className="step-status" aria-live="polite">
                          {STATUS_MESSAGES[status]}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {status === "ready" && (
            <div className="process-success" role="status">
              <CheckIcon />
              <h2>Processing Complete!</h2>
              <p>Your document has been successfully processed and is ready for review.</p>
              <button className="process-btn primary" onClick={handleViewResults}>
                View Results
              </button>
            </div>
          )}
        </div>

        <div className="process-info">
          <p>This usually takes 30-60 seconds depending on document size.</p>
          <p>You can safely close this page and return later.</p>
        </div>
      </main>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path 
        d="M20 6 9 17l-5-5" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className="process-spinner">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".4"/>
      <path d="M12 4a8 8 0 0 1 8 8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}