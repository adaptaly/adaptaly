"use client";
import React, { useEffect, useMemo, useState } from "react";
import "../result/result.css";
import { getDeviceId } from "@/lib/device";
import { useSearchParams } from "next/navigation";

type DueItem = { cardId: string; box: number; dueAt: string; deckId: string; question: string; answer: string; };

const LS = {
  goal: "adaptaly:review:goal",         // number
  todayCount: "adaptaly:review:today",  // { date: 'YYYY-MM-DD', count: number }
  streak: "adaptaly:review:streak",     // { lastDate: 'YYYY-MM-DD', streak: number }
};

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0,10);
}

export default function ReviewPage(){
  const sp = useSearchParams();
  const deckId = sp.get("deckId"); // optional
  const [queue, setQueue] = useState<DueItem[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [goal, setGoal] = useState<number>(() => Number(localStorage.getItem(LS.goal) || 20));
  const [today, setToday] = useState<{ date: string; count: number }>(() => {
    try { return JSON.parse(localStorage.getItem(LS.todayCount) || "") } catch { return { date: todayStr(), count: 0 }; }
  });
  const [streak, setStreak] = useState<{ lastDate: string; streak: number }>(() => {
    try { return JSON.parse(localStorage.getItem(LS.streak) || "") } catch { return { lastDate: "", streak: 0 }; }
  });

  useEffect(() => { localStorage.setItem(LS.goal, String(goal)); }, [goal]);

  // Reset today counter if the day changed
  useEffect(() => {
    const now = todayStr();
    if (today.date !== now) {
      const next = { date: now, count: 0 };
      setToday(next);
      localStorage.setItem(LS.todayCount, JSON.stringify(next));
    }
  }, []);

  async function loadDue(){
    setLoading(true);
    try{
      const deviceId = getDeviceId();
      const url = new URL(`/api/db/due`, window.location.origin);
      url.searchParams.set("deviceId", deviceId);
      url.searchParams.set("limit", "100");
      if (deckId) url.searchParams.set("deckId", deckId);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load due cards");
      setQueue(data.items || []);
    }catch(e:any){
      setToast(e?.message || "Error"); setTimeout(()=>setToast(""),2000);
    }finally{ setLoading(false); }
  }
  useEffect(() => { loadDue(); /* load on mount and deck change */ }, [deckId]);

  async function grade(result: "correct" | "wrong"){
    const current = queue[0]; if(!current) return;
    try{
      const deviceId = getDeviceId();
      const res = await fetch("/api/db/review",{ method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ deviceId, cardId: current.cardId, result })
      });
      const data = await res.json(); if (!res.ok) throw new Error(data?.error || "Review failed");

      // Update mastery queue UX: wrong -> re-queue, correct -> remove
      if (result === "correct"){ setCorrect(c=>c+1); setQueue(([, ...rest]) => rest); }
      else { setWrong(w=>w+1); setQueue(([, ...rest]) => [...rest, current]); }
      setShowAnswer(false);

      // Update daily goal + streak
      const now = todayStr();
      let t = today;
      if (t.date !== now) t = { date: now, count: 0 };
      const t2 = { date: now, count: t.count + 1 };
      setToday(t2);
      localStorage.setItem(LS.todayCount, JSON.stringify(t2));

      if (t2.count >= goal) {
        // Achieved goal today—update streak if not already counted for today
        if (streak.lastDate !== now) {
          const last = streak.lastDate;
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const yStr = yesterday.toISOString().slice(0,10);
          const continuous = (last === yStr) || (last === "");
          const s2 = { lastDate: now, streak: continuous ? (streak.streak + 1) : 1 };
          setStreak(s2);
          localStorage.setItem(LS.streak, JSON.stringify(s2));
        }
      }
    }catch(e:any){
      setToast(e?.message || "Error"); setTimeout(()=>setToast(""),2000);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent){
      if (!queue.length) return;
      if (e.key === " " || e.code === "Space"){ e.preventDefault(); setShowAnswer(s=>!s); }
      if (e.key === "ArrowLeft"){ e.preventDefault(); grade("correct"); }
      if (e.key === "ArrowRight"){ e.preventDefault(); grade("wrong"); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [queue, goal, today, streak]);

  const current = queue[0];
  const progress = useMemo(() => Math.min(100, Math.round((today.count / Math.max(1, goal)) * 100)), [today.count, goal]);

  return (
    <main className="result-shell">
      <header className="result-header">
        <h1 className="result-title">Review {deckId ? "· This Deck" : ""}</h1>
        {toast && <div className="toast">{toast}</div>}
      </header>

      <section className="panel">
        <div className="fc-toolbar">
          <div className="fc-left">
            <h2 className="panel-title">Daily Goal</h2>
            <div className="deck-meta">
              <span>Goal: {goal}</span>
              <span>• Today: {today.count}</span>
              <span>• Streak: {streak.streak} day{streak.streak===1?"":"s"}</span>
            </div>
          </div>
          <div className="fc-actions">
            <input
              type="number"
              className="gen-select"
              min={5}
              max={200}
              value={goal}
              onChange={(e)=> setGoal(Math.max(5, Math.min(200, Number(e.target.value)||20)))}
              title="Daily goal"
            />
            <button className="btn ghost mini" onClick={loadDue}>Refresh due</button>
            <a className="btn mini" href="/decks">All decks</a>
          </div>
        </div>

        <div className="progress-wrap">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>

        {loading ? (
          <div className="empty"><p>Loading due cards…</p></div>
        ) : !current ? (
          <div className="empty">
            <p>No cards due {deckId ? "in this deck " : ""}right now.</p>
            <button className="btn" onClick={loadDue}>Refresh</button>
          </div>
        ) : (
          <div className="study-area">
            <div className="study-card">
              <div className="study-label">{correct + wrong + 1} / {queue.length + correct + wrong}</div>
              <div className="study-q">{current.question}</div>

              {!showAnswer ? (
                <button className="btn primary" onClick={() => setShowAnswer(true)}>
                  Show answer (Space)
                </button>
              ) : (
                <>
                  <div className="study-a">{current.answer}</div>
                  <div className="study-actions">
                    <button className="btn correct" onClick={() => grade("correct")}>I got it (←)</button>
                    <button className="btn wrong" onClick={() => grade("wrong")}>Didn’t get it (→)</button>
                  </div>
                </>
              )}

              <div className="study-stats">
                <span>Correct: {correct}</span>
                <span>Wrong: {wrong}</span>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}