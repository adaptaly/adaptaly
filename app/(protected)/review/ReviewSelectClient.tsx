"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface Document {
  id: string;
  title: string;
  created_at: string;
  total_cards: number;
  flashcardCount: number;
  dueCount: number;
}

interface ReviewSelectClientProps {
  documents: Document[];
  userId: string;
}

export default function ReviewSelectClient({ documents }: ReviewSelectClientProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRecommendation = (dueCount: number, totalCards: number) => {
    if (dueCount === 0) return "All caught up!";
    if (dueCount <= 5) return "Quick review";
    if (dueCount <= 15) return "Short session";
    return "Long session";
  };

  const getStatusColor = (dueCount: number) => {
    if (dueCount === 0) return "success";
    if (dueCount <= 5) return "info";
    if (dueCount <= 15) return "warning";
    return "urgent";
  };

  if (documents.length === 0) {
    return (
      <div className="review-select-container">
        <div className="review-empty">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
            </svg>
          </div>
          <h2>No Study Materials Yet</h2>
          <p>Upload your first document to start reviewing flashcards.</p>
          <button 
            className="btn-primary"
            onClick={() => router.push("/upload")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m11-4l-4-4m0 0l-4 4m4-4v12"/>
            </svg>
            Upload Document
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="review-select-container">
      <div className="review-header">
        <div className="header-content">
          <h1>Choose Study Pack</h1>
          <p className="header-subtitle">Select a document to begin your review session</p>
        </div>
        <button 
          className="btn-secondary"
          onClick={() => router.push("/upload")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14m-7-7h14"/>
          </svg>
          Add Material
        </button>
      </div>

      <div className="documents-grid">
        {documents.map((doc) => (
          <div 
            key={doc.id} 
            className={`document-card ${getStatusColor(doc.dueCount)}`}
            onClick={() => router.push(`/review/${doc.id}`)}
          >
            <div className="card-header">
              <h3 className="document-title">{doc.title}</h3>
              <div className={`status-badge ${getStatusColor(doc.dueCount)}`}>
                {doc.dueCount > 0 ? `${doc.dueCount} due` : "Complete"}
              </div>
            </div>
            
            <div className="card-meta">
              <div className="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"/>
                </svg>
                <span>{doc.flashcardCount} cards</span>
              </div>
              <div className="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/>
                </svg>
                <span>{formatDate(doc.created_at)}</span>
              </div>
            </div>

            <div className="card-recommendation">
              <span className="recommendation-text">
                {getRecommendation(doc.dueCount, doc.flashcardCount)}
              </span>
              {doc.dueCount > 0 && (
                <span className="estimated-time">
                  ~{Math.ceil(doc.dueCount * 1.5)} min
                </span>
              )}
            </div>

            <div className="progress-section">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: doc.dueCount === 0 ? "100%" : 
                           `${Math.max(10, 100 - (doc.dueCount / doc.flashcardCount) * 100)}%` 
                  }}
                />
              </div>
              <span className="progress-text">
                {doc.dueCount === 0 ? "All cards reviewed" : 
                 `${doc.flashcardCount - doc.dueCount}/${doc.flashcardCount} completed`}
              </span>
            </div>

            <div className="card-action">
              <button className="start-review-btn">
                {doc.dueCount > 0 ? "Start Review" : "Practice Again"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14m-7-7l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="review-footer">
        <div className="footer-stats">
          <div className="stat">
            <span className="stat-value">{documents.length}</span>
            <span className="stat-label">Study Packs</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {documents.reduce((sum, doc) => sum + doc.dueCount, 0)}
            </span>
            <span className="stat-label">Cards Due</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {documents.reduce((sum, doc) => sum + doc.flashcardCount, 0)}
            </span>
            <span className="stat-label">Total Cards</span>
          </div>
        </div>
      </div>
    </div>
  );
}