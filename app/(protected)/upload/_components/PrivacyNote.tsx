// Update
import React from "react";

export default function PrivacyNote() {
  return (
    <div className="up-card up-block" aria-labelledby="privacy-note">
      <h3 id="privacy-note" className="up-block-title">Privacy</h3>
      <p className="up-subtext">
        Your file is processed securely and stored short term for generation. You can delete your
        content anytime. See our{" "}
        <a href="/privacy" className="up-help-link">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}