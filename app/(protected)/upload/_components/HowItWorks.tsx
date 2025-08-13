// Update
import React from "react";

export default function HowItWorks() {
  return (
    <div className="up-card up-block" aria-labelledby="how-it-works">
      <h3 id="how-it-works" className="up-block-title">How it works</h3>
      <ul className="up-how-list" role="list">
        <li className="up-how-item">
          <span aria-hidden="true">
            <StepIcon />
          </span>
          <span>
            <strong>Upload</strong> your file with one click.
          </span>
        </li>
        <li className="up-how-item">
          <span aria-hidden="true">
            <StepIcon />
          </span>
          <span>
            We <strong>clean and parse</strong> your text for accuracy.
          </span>
        </li>
        <li className="up-how-item">
          <span aria-hidden="true">
            <StepIcon />
          </span>
          <span>
            You get a <strong>summary and flashcards</strong> to study.
          </span>
        </li>
      </ul>
    </div>
  );
}

function StepIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <path d="M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}