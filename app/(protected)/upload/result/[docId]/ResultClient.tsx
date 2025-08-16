"use client";

import React, { useState } from "react";
import Link from "next/link";

interface Summary {
  id: string;
  content: string;
  word_count: number | null;
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  hint: string | null;
  order_index: number;
}

interface ResultClientProps {
  documentId: string;
  filename: string | null;
  summary: Summary;
  flashcards: Flashcard[];
  createdAt: string;
}

export default function ResultClient({ 
  documentId, 
  filename, 
  summary, 
  flashcards, 
  createdAt 
}: ResultClientProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "flashcards">("summary");
  const [previewCard, setPreviewCard] = useState<number>(0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const nextCard = () => {
    setPreviewCard((prev) => (prev + 1) % flashcards.length);
  };

  const prevCard = () => {
    setPreviewCard((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

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
          <h1 className="up-title">Study Pack Ready</h1>
          <p className="up-subtitle">
            {filename || "Document"} • {formatDate(createdAt)}
          </p>
        </div>

        <Link className="up-help" href="/dashboard" aria-label="Go to dashboard">
          Dashboard
        </Link>
      </header>

      <main className="up-result-main">
        <div className="result-container">
          {/* Stats Overview */}
          <div className="result-stats">
            <div className="stat-item">
              <div className="stat-value">{summary.word_count || "N/A"}</div>
              <div className="stat-label">Words in summary</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{flashcards.length}</div>
              <div className="stat-label">Flashcards generated</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">Ready</div>
              <div className="stat-label">Status</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="result-tabs">
            <button
              className={`tab-btn ${activeTab === "summary" ? "active" : ""}`}
              onClick={() => setActiveTab("summary")}
              aria-pressed={activeTab === "summary"}
            >
              <SummaryIcon />
              Summary
            </button>
            <button
              className={`tab-btn ${activeTab === "flashcards" ? "active" : ""}`}
              onClick={() => setActiveTab("flashcards")}
              aria-pressed={activeTab === "flashcards"}
            >
              <FlashcardIcon />
              Flashcards ({flashcards.length})
            </button>
          </div>

          {/* Content Area */}
          <div className="result-content">
            {activeTab === "summary" && (
              <div className="summary-section">
                <div className="summary-card">
                  <div className="summary-header">
                    <h2>Document Summary</h2>
                    <div className="summary-meta">
                      {summary.word_count && (
                        <span>{summary.word_count} words</span>
                      )}
                    </div>
                  </div>
                  <div className="summary-content">
                    {summary.content.split('\n').map((paragraph, index) => (
                      paragraph.trim() && (
                        <p key={index}>{paragraph.trim()}</p>
                      )
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "flashcards" && (
              <div className="flashcards-section">
                {flashcards.length > 0 ? (
                  <>
                    <div className="flashcard-preview">
                      <div className="flashcard-header">
                        <h2>Flashcard Preview</h2>
                        <div className="flashcard-counter">
                          {previewCard + 1} of {flashcards.length}
                        </div>
                      </div>
                      
                      <div className="flashcard-container">
                        <div className="flashcard">
                          <div className="flashcard-question">
                            <h3>Question</h3>
                            <p>{flashcards[previewCard]?.question}</p>
                          </div>
                          <div className="flashcard-answer">
                            <h3>Answer</h3>
                            <p>{flashcards[previewCard]?.answer}</p>
                            {flashcards[previewCard]?.hint && (
                              <div className="flashcard-hint">
                                <strong>Hint:</strong> {flashcards[previewCard].hint}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flashcard-controls">
                        <button 
                          className="control-btn" 
                          onClick={prevCard}
                          disabled={flashcards.length <= 1}
                          aria-label="Previous flashcard"
                        >
                          <ChevronLeftIcon />
                          Previous
                        </button>
                        <button 
                          className="control-btn" 
                          onClick={nextCard}
                          disabled={flashcards.length <= 1}
                          aria-label="Next flashcard"
                        >
                          Next
                          <ChevronRightIcon />
                        </button>
                      </div>
                    </div>

                    <div className="flashcard-list">
                      <h3>All Flashcards</h3>
                      <div className="flashcard-grid">
                        {flashcards.map((card, index) => (
                          <div 
                            key={card.id} 
                            className={`flashcard-item ${index === previewCard ? "active" : ""}`}
                            onClick={() => setPreviewCard(index)}
                          >
                            <div className="flashcard-item-number">{index + 1}</div>
                            <div className="flashcard-item-content">
                              <div className="flashcard-item-question">
                                {card.question.length > 60 
                                  ? `${card.question.substring(0, 60)}...` 
                                  : card.question
                                }
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <FlashcardIcon />
                    <h3>No flashcards generated</h3>
                    <p>We couldn't generate flashcards for this document. The content might be too short or not suitable for flashcard creation.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="result-actions">
            <Link 
              className="action-btn primary" 
              href={`/review/${documentId}`}
            >
              <StudyIcon />
              Start Review Session
            </Link>
            <button className="action-btn secondary" onClick={() => window.print()}>
              <PrintIcon />
              Print Summary
            </button>
            <Link className="action-btn secondary" href="/dashboard">
              <DashboardIcon />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

// Icon components
function SummaryIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <polyline points="14,2 14,8 20,8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.5"/>
      <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function FlashcardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="9" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="9" y1="15" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function StudyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <polyline points="6 9 6 2 18 2 18 9" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="6" y="14" width="12" height="8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="14" y="3" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="14" y="14" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="3" y="14" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}