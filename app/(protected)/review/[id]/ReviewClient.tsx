"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adaptiveCardSelection } from "@/app/lib/adaptive-algorithm";
import { trackPerformance, getSessionStats } from "@/app/lib/performance-tracker";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  hint?: string;
  order_index: number;
  topic?: string;
}

interface CardProgress {
  flashcard_id: string;
  mastered: boolean;
  due_at: string;
  ease_factor: number;
  interval_days: number;
}

interface Review {
  card_id: string;
  correct: boolean;
  confidence: number;
  response_time: number;
  created_at: string;
}

interface ReviewClientProps {
  documentId: string;
  documentTitle: string;
  flashcards: Flashcard[];
  cardProgress: CardProgress[];
  recentReviews: Review[];
  userId: string;
}

type StudyState = {
  status: "idle" | "studying" | "complete";
  currentCard: Flashcard | null;
  showAnswer: boolean;
  cardIndex: number;
  totalCards: number;
  correctCount: number;
  sessionStartTime: number;
  cardStartTime: number;
};

export default function ReviewClient({
  documentId,
  documentTitle,
  flashcards,
  cardProgress,
  recentReviews,
  userId
}: ReviewClientProps) {
  const router = useRouter();
  
  const [state, setState] = useState<StudyState>({
    status: "idle",
    currentCard: null,
    showAnswer: false,
    cardIndex: 0,
    totalCards: 0,
    correctCount: 0,
    sessionStartTime: 0,
    cardStartTime: 0
  });

  const [selectedCards, setSelectedCards] = useState<Flashcard[]>([]);
  const [confidence, setConfidence] = useState<number>(3);

  // Initialize study session
  const startSession = useCallback(() => {
    const adaptiveCards = adaptiveCardSelection(flashcards, cardProgress, recentReviews);
    const sessionCards = adaptiveCards.slice(0, Math.min(20, adaptiveCards.length)); // Max 20 cards per session
    
    setSelectedCards(sessionCards);
    setState({
      status: "studying",
      currentCard: sessionCards[0] || null,
      showAnswer: false,
      cardIndex: 0,
      totalCards: sessionCards.length,
      correctCount: 0,
      sessionStartTime: Date.now(),
      cardStartTime: Date.now()
    });
  }, [flashcards, cardProgress, recentReviews]);

  // Handle showing answer
  const showAnswer = useCallback(() => {
    setState(prev => ({ ...prev, showAnswer: true }));
  }, []);

  // Handle confidence rating and next card
  const handleConfidence = useCallback(async (confidenceRating: number, isCorrect: boolean) => {
    if (!state.currentCard) return;

    const responseTime = Date.now() - state.cardStartTime;
    
    // Track performance
    await trackPerformance({
      userId,
      documentId,
      flashcardId: state.currentCard.id,
      correct: isCorrect,
      confidence: confidenceRating,
      responseTime,
      topic: state.currentCard.topic
    });

    // Move to next card or complete session
    const nextIndex = state.cardIndex + 1;
    const newCorrectCount = state.correctCount + (isCorrect ? 1 : 0);

    if (nextIndex >= selectedCards.length) {
      // Session complete
      setState(prev => ({
        ...prev,
        status: "complete",
        correctCount: newCorrectCount
      }));
    } else {
      // Next card
      setState(prev => ({
        ...prev,
        currentCard: selectedCards[nextIndex],
        showAnswer: false,
        cardIndex: nextIndex,
        correctCount: newCorrectCount,
        cardStartTime: Date.now()
      }));
    }
    
    setConfidence(3); // Reset confidence to neutral
  }, [state.currentCard, state.cardStartTime, state.cardIndex, state.correctCount, selectedCards, userId, documentId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (state.status !== "studying") return;

      switch (event.key) {
        case " ":
        case "Enter":
          event.preventDefault();
          if (!state.showAnswer) {
            showAnswer();
          }
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
          if (state.showAnswer) {
            event.preventDefault();
            const conf = parseInt(event.key);
            const isCorrect = conf >= 3;
            handleConfidence(conf, isCorrect);
          }
          break;
        case "Escape":
          router.push("/dashboard");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.status, state.showAnswer, showAnswer, handleConfidence, router]);

  // Render start screen
  if (state.status === "idle") {
    return (
      <div className="review-container">
        <div className="review-start">
          <div className="start-header">
            <h1>{documentTitle}</h1>
            <p className="start-subtitle">Ready to review {flashcards.length} flashcards?</p>
          </div>
          
          <div className="start-info">
            <div className="info-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M12 6v12m-3-2.818l.621.621a3 3 0 004.242 0l.621-.621M12 6A3 3 0 009 3h6a3 3 0 00-3 3z"/>
              </svg>
              <span>Adaptive algorithm selects optimal cards</span>
            </div>
            <div className="info-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Track confidence and performance</span>
            </div>
            <div className="info-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Spaced repetition for optimal learning</span>
            </div>
          </div>

          <div className="start-controls">
            <button 
              className="btn-primary start-btn"
              onClick={startSession}
            >
              Start Review Session
            </button>
            <button 
              className="btn-secondary"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </button>
          </div>

          <div className="keyboard-shortcuts">
            <p className="shortcuts-title">Keyboard shortcuts:</p>
            <div className="shortcuts-grid">
              <span>Space/Enter</span><span>Show answer</span>
              <span>1-5</span><span>Rate confidence</span>
              <span>Esc</span><span>Exit session</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render completion screen
  if (state.status === "complete") {
    const sessionTime = Math.round((Date.now() - state.sessionStartTime) / 1000);
    const accuracy = Math.round((state.correctCount / state.totalCards) * 100);
    
    return (
      <div className="review-container">
        <div className="review-complete">
          <div className="complete-header">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="complete-icon">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h1>Session Complete!</h1>
            <p className="complete-subtitle">Great work on your review session</p>
          </div>

          <div className="session-stats">
            <div className="stat-item">
              <span className="stat-value">{state.correctCount}/{state.totalCards}</span>
              <span className="stat-label">Cards Reviewed</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{accuracy}%</span>
              <span className="stat-label">Accuracy</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{Math.floor(sessionTime / 60)}:{(sessionTime % 60).toString().padStart(2, "0")}</span>
              <span className="stat-label">Session Time</span>
            </div>
          </div>

          <div className="complete-actions">
            <button 
              className="btn-primary"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setState(prev => ({ ...prev, status: "idle" }))}
            >
              Review Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render study interface
  return (
    <div className="review-container">
      <div className="review-header">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${((state.cardIndex + 1) / state.totalCards) * 100}%` }}
          />
        </div>
        <div className="progress-text">
          {state.cardIndex + 1} of {state.totalCards}
        </div>
        <button 
          className="exit-btn"
          onClick={() => router.push("/dashboard")}
          aria-label="Exit session"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div className="flashcard-container">
        <div className={`flashcard ${state.showAnswer ? "flipped" : ""}`}>
          <div className="card-front">
            <div className="card-content">
              <h2 className="card-question">{state.currentCard?.question}</h2>
              {state.currentCard?.hint && (
                <p className="card-hint">💡 {state.currentCard.hint}</p>
              )}
            </div>
            <button 
              className="show-answer-btn"
              onClick={showAnswer}
            >
              Show Answer
            </button>
          </div>

          <div className="card-back">
            <div className="card-content">
              <h3 className="card-question-small">{state.currentCard?.question}</h3>
              <div className="card-answer">
                {state.currentCard?.answer}
              </div>
            </div>

            <div className="confidence-rating">
              <p className="confidence-prompt">How confident are you?</p>
              <div className="confidence-buttons">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    className={`confidence-btn ${confidence === rating ? "selected" : ""}`}
                    onClick={() => setConfidence(rating)}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <div className="confidence-labels">
                <span>Not sure</span>
                <span>Perfect</span>
              </div>
              
              <div className="rating-actions">
                <button
                  className="btn-incorrect"
                  onClick={() => handleConfidence(confidence, false)}
                >
                  Incorrect
                </button>
                <button
                  className="btn-correct"
                  onClick={() => handleConfidence(confidence, true)}
                >
                  Correct
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}