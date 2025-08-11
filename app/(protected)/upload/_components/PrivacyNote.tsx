import React from "react";

export default function PrivacyNote() {
  return (
    <div className="up-card up-block" aria-labelledby="privacy-note">
      <h3 id="privacy-note">Privacy</h3>
      <p style={{ margin: 0, color: "var(--up-subtext)", fontSize: 13.5 }}>
        Your file is processed securely and stored short term for generation. You can delete your
        content anytime. See our <a href="/privacy" className="up-help-link" style={{ padding: "2px 8px" }}>Privacy Policy</a>.
      </p>
    </div>
  );
}