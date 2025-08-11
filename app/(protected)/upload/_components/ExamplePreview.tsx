import React from "react";

export default function ExamplePreview() {
  return (
    <div className="up-card up-block" aria-labelledby="example-preview">
      <h3 id="example-preview">What you will get</h3>
      <div className="up-preview">
        <div className="up-preview-card">
          <p className="up-mini-title">Summary preview</p>
          <div className="up-summary-line" style={{ width: "92%" }} />
          <div className="up-summary-line" style={{ width: "86%" }} />
          <div className="up-summary-line" style={{ width: "70%" }} />
        </div>

        <div className="up-preview-card up-flashcard">
          <p className="up-mini-title">Flashcards</p>
          <div className="up-chip">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" fill="none"/></svg>
            Question
          </div>
          <div className="up-chip">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" fill="none"/></svg>
            Answer
          </div>
        </div>
      </div>
    </div>
  );
}