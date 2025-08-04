"use client";
export const dynamic = "force-dynamic";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import "../result/result.css";

/* ---------- Types ---------- */
type Card = {
  id: string;
  question: string;
  answer: string;
};

type DueResponse = {
  deckId?: string | null;
  cards: Card[];
};

type ReviewOk = {
  ok: true;
  nextDueAt?: string | null;
};
type ReviewErr = { error: string };
type ReviewResult = ReviewOk | ReviewErr;

type ApiError = { error: string };

/* ---------- Page wrapper in Suspense ---------- */
export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <main className="result-shell">
          <div className="toast">Loading review…</div>
        </main>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}

/* ---------- Actual client content (uses useSearchParams) ---------- */
function ReviewContent() {
  const search = useSearchParams();
  const deckId = search?.get("deckId") || null;

  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState<number>(0);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const current = cards[index] ?? null;
  const total = cards.length;

  const stats = useMemo(
    () => ({
      done: Math.min(index, total),
      remaining: Math.max(total - index, 0),
    }),
    [index, total]
  );

  const loadDue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = deckId ? `/api/db/due?deckId=${encodeURIComponent(deckId)}` : `/api/db/due`;
      const res = await fetch(url, { cache: "no-store" });
      const data = (await res.json()) as DueResponse | ApiError;

      if (!res.ok) {
        const msg = (data as ApiError)?.error || `Failed to load due cards (${res.status})`;
        throw new Error(msg);
      }
      if (!("cards" in data) || !Array.isArray(data.cards)) {
        throw new Error("Malformed response from server.");
      }

      setCards(data.cards);
      setIndex(0);
      setShowAnswer(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load due cards";
      setError(msg);
      setCards([]);
      setIndex(0);
      setShowAnswer(false);
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    void loadDue();
  }, [loadDue]);

  const grade = useCallback(
    async (isCorrect: boolean) => {
      if (!current) return;
      setBusy(true);
      setError("");
      try {
        const res = await fetch("/api/db/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardId: current.id,
            deckId,
            grade: isCorrect ? "good" : "again",
          }),
        });

        const data = (await res.json()) as ReviewResult;

        if (!res.ok) {
          const msg = (data as ReviewErr)?.error || `Grade failed (${res.status})`;
          throw new Error(msg);
        }
        if (!("ok" in data) || !data.ok) {
          const msg = (data as ReviewErr)?.error || "Grade failed";
          throw new Error(msg);
        }

        // Advance
        setIndex((i) => Math.min(i + 1, total));
        setShowAnswer(false);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not submit grade";
        setError(msg);
      } finally {
        setBusy(false);
      }
    },
    [current, deckId, total]
  );

  const reveal = useCallback(() => setShowAnswer(true), []);

  // Keyboard: Left = correct, Right = wrong, Space/Enter = show
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (!current || busy) return;
      if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        void grade(true);
      } else if (ev.key === "ArrowRight") {
        ev.preventDefault();
        void grade(false);
      } else if (ev.key === " " || ev.key === "Enter") {
        if (!showAnswer) {
          ev.preventDefault();
          reveal();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, busy, showAnswer, reveal, grade]);

  if (loading) {
    return (
      <main className="result-shell">
        <div className="toast">Loading review…</div>
      </main>
    );
  }

  // Empty state
  if (!current) {
    return (
      <main className="result-shell">
        <header className="result-header">
          <h1 className="result-title">Review</h1>
          <div className="result-meta">{new Date().toLocaleString()}</div>
        </header>

        {error && (
          <div className="alert error">
            <span>{error}</span>
          </div>
        )}

        <section className="study-done">
          <div className="done-title">No cards due 🎉</div>
          <div className="done-actions">
            <button className="btn" onClick={() => loadDue()}>
              Refresh
            </button>
            <Link href="/decks" className="btn ghost">
              Back to decks
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="result-shell">
      <header className="result-header">
        <h1 className="result-title">Review</h1>
        <div className="result-meta">
          {stats.done}/{total} · {stats.remaining} left
        </div>
      </header>

      {error && (
        <div className="alert error">
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      <section className="study-area">
        <div className="study-card">
          <div className="study-label">QUESTION</div>
          <div className="study-q">{current.question}</div>

          {showAnswer ? (
            <>
              <div className="study-label">ANSWER</div>
              <div className="study-a">{current.answer}</div>
              <div className="study-actions">
                <button className="btn correct" disabled={busy} onClick={() => void grade(true)}>
                  ← Correct
                </button>
                <button className="btn wrong" disabled={busy} onClick={() => void grade(false)}>
                  Wrong →
                </button>
              </div>
            </>
          ) : (
            <div className="study-actions">
              <button className="btn primary" disabled={busy} onClick={reveal}>
                Show answer
              </button>
            </div>
          )}

          <div className="study-stats">
            <span>Left = Correct</span>
            <span>Right = Wrong</span>
            <span>Space/Enter = Show</span>
          </div>
        </div>
      </section>
    </main>
  );
}