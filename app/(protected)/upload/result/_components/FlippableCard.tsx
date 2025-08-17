"use client";

import React, { useState, useEffect } from "react";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  hint: string | null;
  order_index: number;
}

interface FlippableCardProps {
  flashcard: Flashcard;
  isActive: boolean;
  onFlip?: (isFlipped: boolean) => void;
}

export default function FlippableCard({ flashcard, isActive, onFlip }: FlippableCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip state when card changes
  useEffect(() => {
    if (isActive) {
      setIsFlipped(false);
      onFlip?.(false);
    }
  }, [flashcard.id, isActive, onFlip]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        handleFlip();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isActive, isFlipped]);

  const handleFlip = () => {
    const newFlipped = !isFlipped;
    setIsFlipped(newFlipped);
    onFlip?.(newFlipped);
  };

  return (
    <div className="flip-card-container">
      <div 
        className={`flip-card ${isFlipped ? "flipped" : ""}`}
        onClick={handleFlip}
        role="button"
        tabIndex={isActive ? 0 : -1}
        aria-label={isFlipped ? "Show question" : "Show answer"}
        aria-describedby="flip-instructions"
      >
        <div className="flip-card-inner">
          {/* Front side - Question */}
          <div className="flip-card-front">
            <div className="flip-card-header">
              <h3>Question</h3>
              <div className="flip-hint">
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                Click to reveal
              </div>
            </div>
            <div className="flip-card-content">
              <p>{flashcard.question}</p>
            </div>
            {flashcard.hint && (
              <div className="flip-card-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="12" cy="17" r="1" fill="currentColor"/>
                </svg>
                <strong>Hint:</strong> {flashcard.hint}
              </div>
            )}
          </div>

          {/* Back side - Answer */}
          <div className="flip-card-back">
            <div className="flip-card-header">
              <h3>Answer</h3>
              <div className="flip-hint success">
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                Revealed
              </div>
            </div>
            <div className="flip-card-content">
              <p>{flashcard.answer}</p>
            </div>
            <div className="flip-card-action">
              <span>Click to hide answer</span>
            </div>
          </div>
        </div>
      </div>
      
      <p id="flip-instructions" className="sr-only">
        Use spacebar or enter to flip the card and reveal the answer
      </p>
    </div>
  );
}