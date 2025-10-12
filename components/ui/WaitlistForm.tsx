"use client";
import { useEffect, useRef, useState } from "react";
import styles from "../../styles/components/WaitlistForm.module.css";

type Props = { className?: string };

const STORAGE_KEY = "adaptaly_waitlist_status";
const SUCCESS_DURATION = 3000; // 3 seconds

export default function WaitlistForm({ className }: Props) {
  const [email, setEmail] = useState("");
  const [age, setAge] = useState<"16plus" | "under16">("16plus");
  const [parentEmail, setParentEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPendingConsent, setIsPendingConsent] = useState(false);
  const [showUnsubscribed, setShowUnsubscribed] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Verify subscription status from database on mount
  useEffect(() => {
    async function checkSubscription() {
      const storedStatus = localStorage.getItem(STORAGE_KEY);
      if (storedStatus) {
        const { savedEmail, subscribed, showingUnsubscribe, showingSuccess, pendingParent } = JSON.parse(storedStatus);

        // Check for pending parent consent
        if (pendingParent) {
          setIsPendingConsent(true);
          setShowSuccess(true);
          return; // Stay in pending state, no unsubscribe
        }

        // If we have a saved email and think we're subscribed, verify with database
        if (savedEmail && subscribed) {
          try {
            const res = await fetch("/api/waitlist/check", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ email: savedEmail })
            });
            const data = await res.json();

            // Update state based on database truth
            if (data.subscribed) {
              setIsSubscribed(true);
            } else {
              // Email not in database - retry subscribe silently and keep unsubscribe state
              setIsSubscribed(true); // Keep showing unsubscribe

              // Retry API call in background
              fetch("/api/waitlist", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email: savedEmail })
              }).catch(err => {
                console.error("Retry subscribe error", err);
              });
            }
          } catch (err) {
            console.error("Check subscription error", err);
            // On error, keep the subscribed state
            setIsSubscribed(subscribed);
          }
        } else {
          setIsSubscribed(subscribed);
        }

        setEmail(""); // Always start with empty email
        if (showingUnsubscribe) setShowUnsubscribed(true);
        if (showingSuccess) setShowSuccess(true);
      }
    }

    checkSubscription();

    // Listen for custom sync events (for same-page forms)
    const handleSyncEvent = (e: Event) => {
      const storedStatus = localStorage.getItem(STORAGE_KEY);
      if (storedStatus) {
        const { subscribed, showingUnsubscribe, showingSuccess, pendingParent } = JSON.parse(storedStatus);
        if (pendingParent) {
          setIsPendingConsent(true);
          setShowSuccess(true);
        } else {
          setIsSubscribed(subscribed);
          setShowUnsubscribed(!!showingUnsubscribe);
          setShowSuccess(!!showingSuccess);
        }
        setEmail(""); // Always keep email empty
      }
    };

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const { subscribed, showingUnsubscribe, showingSuccess, pendingParent } = JSON.parse(e.newValue);
        if (pendingParent) {
          setIsPendingConsent(true);
          setShowSuccess(true);
        } else {
          setIsSubscribed(subscribed);
          setShowUnsubscribed(!!showingUnsubscribe);
          setShowSuccess(!!showingSuccess);
        }
        setEmail(""); // Always keep email empty
      }
    };

    window.addEventListener("waitlistSync", handleSyncEvent);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("waitlistSync", handleSyncEvent);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) return;

    // Remove focus from button
    if (buttonRef.current) {
      buttonRef.current.blur();
    }

    if (isSubscribed) {
      // Show confirmation modal before unsubscribing
      setShowConfirmModal(true);
    } else {
      // Subscribe action
      const emailToSave = email;
      const isMinor = age === "under16";
      const parentEmailToSave = isMinor ? parentEmail : "";

      // Call API and wait for response
      const payload: { email: string; isMinor?: boolean; parentEmail?: string } = { email: emailToSave };
      if (isMinor) {
        payload.isMinor = true;
        payload.parentEmail = parentEmailToSave;
      }

      try {
        const res = await fetch("/api/waitlist", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok) {
          console.error("Waitlist error", data);
          return;
        }

        // Check if pending parent consent
        if (data.pending === true) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            subscribed: false,
            savedEmail: "",
            showingUnsubscribe: false,
            showingSuccess: true,
            pendingParent: true
          }));
          setShowSuccess(true);
          setIsPendingConsent(true);
          window.dispatchEvent(new Event("waitlistSync"));
          // Stay in pending state - no timeout, no unsubscribe
          return;
        }

        // Regular 16+ flow
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          subscribed: true,
          savedEmail: emailToSave,
          showingUnsubscribe: false,
          showingSuccess: true,
          pendingParent: false
        }));
        setShowSuccess(true);
        setIsPendingConsent(false);
        window.dispatchEvent(new Event("waitlistSync"));

        // After SUCCESS_DURATION, hide success and show unsubscribe form
        setTimeout(() => {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            subscribed: true,
            savedEmail: emailToSave,
            showingUnsubscribe: false,
            showingSuccess: false,
            pendingParent: false
          }));
          setShowSuccess(false);
          setIsSubscribed(true);
          setEmail(""); // Clear email after subscribing
          setParentEmail(""); // Clear parent email
          window.dispatchEvent(new Event("waitlistSync"));
        }, SUCCESS_DURATION);
      } catch (err) {
        console.error("Waitlist error", err);
      }
    }
  }

  async function confirmUnsubscribe() {
    // Unsubscribe action - call API
    setShowConfirmModal(false);

    try {
      // Use current input email if valid, otherwise use saved email
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      let emailToUnsubscribe = "";

      if (email && isValidEmail) {
        // User typed a new email, use that
        emailToUnsubscribe = email;
      } else {
        // Fall back to saved email from localStorage
        const storedStatus = localStorage.getItem(STORAGE_KEY);
        if (storedStatus) {
          const { savedEmail } = JSON.parse(storedStatus);
          emailToUnsubscribe = savedEmail;
        }
      }

      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: emailToUnsubscribe })
      });

      if (!res.ok) {
        let errorMessage = "Failed to unsubscribe";
        try {
          const errorData = await res.json();
          console.error("Unsubscribe error", errorData);
          errorMessage = errorData.error || "Failed to unsubscribe";
        } catch (e) {
          console.error("Error parsing response", e);
        }

        // Clear all states and show error
        setShowSuccess(false);
        setShowUnsubscribed(false);
        setErrorMessage(errorMessage);
        setShowError(true);

        // Keep subscribed state TRUE so form stays on "Unsubscribe"
        // Don't update localStorage or isSubscribed state

        // Hide error after 3 seconds and return to unsubscribe form
        setTimeout(() => {
          setShowError(false);
          setErrorMessage("");
        }, SUCCESS_DURATION);
        return;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        subscribed: true,
        savedEmail: "",
        showingUnsubscribe: true,
        showingSuccess: false
      }));
      setShowUnsubscribed(true);
      window.dispatchEvent(new Event("waitlistSync")); // Trigger sync for same-page forms

      // After SUCCESS_DURATION, reset to subscribe form
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          subscribed: false,
          savedEmail: "",
          showingUnsubscribe: false,
          showingSuccess: false
        }));
        setShowUnsubscribed(false);
        setIsSubscribed(false);
        setEmail("");
        window.dispatchEvent(new Event("waitlistSync")); // Trigger sync for same-page forms
      }, SUCCESS_DURATION);
    } catch (err) {
      console.error(err);
      // Clear other states and show error, keep subscribed state
      setShowSuccess(false);
      setShowUnsubscribed(false);
      setErrorMessage("Network error");
      setShowError(true);

      // Hide error after 3 seconds and return to unsubscribe form
      setTimeout(() => {
        setShowError(false);
        setErrorMessage("");
      }, SUCCESS_DURATION);
    }
  }

  function cancelUnsubscribe() {
    setShowConfirmModal(false);
  }

  if (showSuccess) {
    return (
      <div
        className={styles.okBar}
        role="status"
        aria-live="polite"
      >
        {isPendingConsent
          ? "Thanks! We've emailed your parent to confirm. Waiting for parental approval."
          : "Thanks for joining the waitlist"}
      </div>
    );
  }

  if (showUnsubscribed) {
    return (
      <div
        className={styles.unsubscribeBar}
        role="status"
        aria-live="polite"
      >
        You've been unsubscribed
      </div>
    );
  }

  if (showError) {
    return (
      <div
        className={styles.errorBar}
        role="alert"
        aria-live="assertive"
      >
        {errorMessage}
      </div>
    );
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidParentEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail);

  // Check if we have a saved email for unsubscribe fallback (client-side only)
  const hasSavedEmail = (() => {
    if (typeof window === 'undefined') return false;
    const storedStatus = localStorage.getItem(STORAGE_KEY);
    if (storedStatus) {
      const { savedEmail } = JSON.parse(storedStatus);
      return !!savedEmail;
    }
    return false;
  })();

  // Button is disabled if:
  // - Subscribe mode: no email or invalid email, OR (under 16 AND no/invalid parent email)
  // - Unsubscribe mode: no current email AND no saved email, OR current email is invalid
  const isButtonDisabled = isSubscribed
    ? (email && !isValidEmail) || (!email && !hasSavedEmail)
    : !email || !isValidEmail || (age === "under16" && (!parentEmail || !isValidParentEmail));

  return (
    <>
      <form
        className={[styles.form, className].filter(Boolean).join(" ")}
        onSubmit={onSubmit}
        noValidate
      >
        <label htmlFor="waitlist-email" className={styles.srOnly}>
          Email address
        </label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          placeholder="Enter your email"
          aria-invalid={email !== "" && !isValidEmail}
          aria-describedby="email-feedback"
        />

        {!isSubscribed && (
          <fieldset className={styles.ageGroup} aria-label="Age confirmation">
            <legend className={styles.srOnly}>Age confirmation</legend>
            <label className={styles.radio}>
              <input
                type="radio"
                name="age"
                value="16plus"
                checked={age === "16plus"}
                onChange={() => setAge("16plus")}
                required
              />
              <span>I am 16 or older</span>
            </label>
            <label className={styles.radio}>
              <input
                type="radio"
                name="age"
                value="under16"
                checked={age === "under16"}
                onChange={() => setAge("under16")}
                required
              />
              <span>I am under 16</span>
            </label>
          </fieldset>
        )}

        {!isSubscribed && age === "under16" && (
          <>
            <label htmlFor="parent-email" className={styles.srOnly}>
              Parent/guardian email
            </label>
            <input
              id="parent-email"
              name="parentEmail"
              type="email"
              autoComplete="email"
              required
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              className={styles.input}
              placeholder="Parent/guardian email"
              aria-invalid={parentEmail !== "" && !isValidParentEmail}
            />
          </>
        )}

        <button
          ref={buttonRef}
          type="submit"
          className={styles.button}
          disabled={isButtonDisabled}
        >
          {isSubscribed ? "Unsubscribe" : "Join Waitlist"}
        </button>
        <span id="email-feedback" className={styles.visFeedback} aria-live="polite">
          {email && !isValidEmail ? "Enter a valid email" : ""}
        </span>
      </form>

      {showConfirmModal && (() => {
        // Determine which email will be unsubscribed for display
        const isValidInputEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        let displayEmail = "";
        if (email && isValidInputEmail) {
          displayEmail = email;
        } else if (typeof window !== 'undefined') {
          const storedStatus = localStorage.getItem(STORAGE_KEY);
          if (storedStatus) {
            const { savedEmail } = JSON.parse(storedStatus);
            displayEmail = savedEmail;
          }
        }

        return (
          <div className={styles.modalOverlay} onClick={cancelUnsubscribe}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3 className={styles.modalTitle}>Unsubscribe from waitlist?</h3>
              <p className={styles.modalText}>
                Are you sure you want to unsubscribe {displayEmail ? `${displayEmail} ` : ""}from the waitlist? You won't receive updates about Adaptaly's launch.
              </p>
            <div className={styles.modalActions}>
              <button
                onClick={cancelUnsubscribe}
                className={styles.modalCancelButton}
              >
                Cancel
              </button>
              <button
                onClick={confirmUnsubscribe}
                className={styles.modalConfirmButton}
              >
                Yes, Unsubscribe
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </>
  );
}
