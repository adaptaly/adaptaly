"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import "./result.css";
import { getDeviceId } from "@/lib/device";

const STORAGE = {
  summary: "adaptaly:summary",
  flashcards: "adaptaly:flashcards",
  meta: "adaptaly:meta",
} as const;

type Flashcard = { question: string; answer: string };

function readLocal<T = unknown>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
function readText(key: string): string { return localStorage.getItem(key) ?? ""; }
function saveFlashcards(cards: Flashcard[]) { localStorage.setItem(STORAGE.flashcards, JSON.stringify(cards)); }
async function copyText(text: string, onToast: (t: string) => void) {
  try { await navigator.clipboard.writeText(text); onToast("Copied."); setTimeout(()=>onToast(""),1200);} catch {}
}
function downloadFile(name: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function normalizeQ(s: string) { return s.toLowerCase().replace(/\s+/g," ").replace(/[?\s]+$/g,"").trim(); }

export default function Result() {
  const [summary, setSummary] = useState<string>("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [filename, setFilename] = useState<string | null>(null);
  const [processedAt, setProcessedAt] = useState<string | null>(null);

  const [tab, setTab] = useState<"summary" | "flashcards">("summary");
  const [view, setView] = useState<"grid" | "study">("grid");
  const [toast, setToast] = useState<string>("");

  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [revealAll, setRevealAll] = useState(false);
  const [regenBusy, setRegenBusy] = useState<Record<number, boolean>>({});
  const [genCount, setGenCount] = useState<number>(4);
  const [genBusy, setGenBusy] = useState(false);
  const [alert, setAlert] = useState<{ type: "error" | "warn" | "info"; text: string } | null>(null);
  const [undoOpen, setUndoOpen] = useState(false);
  const [undoAdded, setUndoAdded] = useState(0);
  const [undoRequested, setUndoRequested] = useState(0);
  const backupRef = useRef<Flashcard[] | null>(null);

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");

  const [studyQueue, setStudyQueue] = useState<number[]>([]);
  const [studyTotal, setStudyTotal] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);

  // Load from URL ?deckId=...
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const deckId = sp.get("deckId");
    if (!deckId) {
      // fallback to local data
      setSummary(readText(STORAGE.summary));
      setFlashcards(readLocal<Flashcard[]>(STORAGE.flashcards, []));
      const meta = readLocal<{ filename?: string; processedAtISO?: string }>(STORAGE.meta, {});
      setFilename(meta.filename ?? null);
      setProcessedAt(meta.processedAtISO ?? null);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/db/decks/${encodeURIComponent(deckId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load deck");
        const summaryText: string = data.deck?.summary_text || "";
        const cards: { question: string; answer: string }[] = (data.cards || []).map((c: any) => ({
          question: c.question, answer: c.answer
        }));
        setSummary(summaryText);
        setFlashcards(cards);
        saveFlashcards(cards);
        localStorage.setItem(STORAGE.summary, summaryText);
        localStorage.setItem(STORAGE.meta, JSON.stringify({ filename: data.deck?.source_filename || null, processedAtISO: data.deck?.created_at || null }));
        setFilename(data.deck?.source_filename || null);
        setProcessedAt(data.deck?.created_at || null);
        setToast("Deck loaded from cloud."); setTimeout(()=>setToast(""),1500);
      } catch (e: any) {
        setToast(e?.message || "Could not load deck."); setTimeout(()=>setToast(""),2000);
      }
    })();
  }, []);

  const hasSummary = summary.trim().length > 0;
  const hasCards = flashcards.length > 0;
  const studyDone = view === "study" && studyQueue.length === 0;
  const currentStudyIndex = studyQueue[0] ?? 0;
  const studyCard = flashcards[currentStudyIndex] ?? null;

  function toggleFlip(i: number) { if (revealAll) return; setFlipped((m)=>({...m,[i]:!m[i]})); }
  function doRevealAll(){ setRevealAll(true); setFlipped({}); }
  function doHideAll(){ setRevealAll(false); setFlipped({}); }
  function doShuffle(){
    const shuffled=[...flashcards].sort(()=>Math.random()-0.5);
    setFlashcards(shuffled); saveFlashcards(shuffled);
    setFlipped({}); setRevealAll(false); setupStudy(shuffled.length);
  }

  function setupStudy(len = flashcards.length){
    const queue = Array.from({length: len},(_,i)=>i);
    setStudyQueue(queue); setStudyTotal(queue.length);
    setShowAnswer(false); setCorrect(0); setWrong(0);
  }
  function enterStudy(){ setupStudy(); setView("study"); }
  function studyReset(){ setupStudy(); }
  function markCorrect(){ if(!studyQueue.length) return; const [, ...rest]=studyQueue; setStudyQueue(rest); setShowAnswer(false); setCorrect(c=>c+1); }
  function markWrong(){ if(!studyQueue.length) return; const [first,...rest]=studyQueue; setStudyQueue([...rest, first]); setShowAnswer(false); setWrong(w=>w+1); }

  useEffect(() => {
    function onKey(e: KeyboardEvent){
      if (view !== "study" || studyDone) return;
      if (e.key === " " || e.code === "Space"){ e.preventDefault(); setShowAnswer(s=>!s); return; }
      if (e.key === "ArrowLeft"){ e.preventDefault(); markCorrect(); return; }
      if (e.key === "ArrowRight"){ e.preventDefault(); markWrong(); return; }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, studyDone, studyQueue]);

  async function regenerateAt(index: number, mode: "pair" | "answer" = "pair"){
    try{
      const target = flashcards[index]; if(!target) return;
      setRegenBusy(m=>({...m,[index]:true}));
      const res = await fetch("/api/cards/regenerate",{ method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ question: target.question, context: summary, mode })
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok || data?.error) throw new Error(data?.error || `Server error (${res.status})`);
      const updated=[...flashcards];
      if (mode==="pair" && data?.question){
        updated[index] = { question: String(data.question).trim() || target.question, answer: String(data.answer||"").trim() || target.answer };
      } else {
        updated[index] = { ...target, answer: String(data.answer||"").trim() || target.answer };
      }
      setFlashcards(updated); saveFlashcards(updated);
      setToast(mode==="pair"?"Question & answer regenerated.":"Answer regenerated."); setTimeout(()=>setToast(""),2000);
    }catch(e:any){ setToast(e?.message || "Could not regenerate."); setTimeout(()=>setToast(""),2500);
    }finally{ setRegenBusy(m=>({...m,[index]:false})); }
  }

  function startEdit(i:number){ const c=flashcards[i]; if(!c) return; setEditIndex(i); setEditQ(c.question); setEditA(c.answer); }
  function cancelEdit(){ setEditIndex(null); setEditQ(""); setEditA(""); }
  function saveEdit(){
    if (editIndex===null) return;
    const q=editQ.trim(), a=editA.trim();
    if(!q || !a){ setToast("Question and answer can’t be empty."); setTimeout(()=>setToast(""),1500); return; }
    const updated=[...flashcards]; updated[editIndex]={question:q, answer:a};
    setFlashcards(updated); saveFlashcards(updated); cancelEdit(); setToast("Card updated."); setTimeout(()=>setToast(""),1200);
  }

  function downloadSummaryTxt(){
    const meta = [
      filename ? `File: ${filename}` : null,
      processedAt ? `Processed: ${new Date(processedAt).toLocaleString()}` : null,
    ].filter(Boolean).join("\n");
    const content = (meta ? meta + "\n\n" : "") + (summary || "");
    downloadFile("summary.txt", content, "text/plain;charset=utf-8");
  }
  function downloadCardsJSON(){
    const json = JSON.stringify(flashcards, null, 2);
    downloadFile("flashcards.json", json, "application/json;charset=utf-8");
  }

  async function generateMore(){
    if (!summary.trim()){ setAlert({type:"error", text:"No summary available to generate from."}); return; }
    setGenBusy(true); setAlert(null);
    try{
      const res = await fetch("/api/cards/generate",{ method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ context: summary, count: genCount }) });
      const data = await res.json().catch(()=>({}));
      if (!res.ok || data?.error) throw new Error(data?.error || `Server error (${res.status})`);
      const requested = Number(data?.requested ?? genCount);
      const cards = (data?.cards as Flashcard[]) || [];
      const existing = new Set(flashcards.map(c=>normalizeQ(c.question)));
      const unique = cards.filter(c=>{ const k=normalizeQ(c.question||""); if(!k || existing.has(k)) return false; existing.add(k); return true; });
      if (!unique.length){ setAlert({type:"error", text:"No new cards could be created from the current summary."}); return; }
      if (unique.length < requested){ setAlert({ type:"warn", text:`Could only create ${unique.length} of ${requested} cards.` }); }
      backupRef.current = [...flashcards];
      setUndoAdded(unique.length); setUndoRequested(requested);
      const merged = [...flashcards, ...unique]; setFlashcards(merged); saveFlashcards(merged);
      setUndoOpen(true);
    }catch(e:any){ setAlert({ type:"error", text: e?.message || "Could not generate cards." });
    }finally{ setGenBusy(false); }
  }
  function undoLastGenerate(){
    const backup = backupRef.current; if(!backup) return;
    setFlashcards(backup); saveFlashcards(backup); backupRef.current=null; setUndoOpen(false);
    setToast("Reverted last add."); setTimeout(()=>setToast(""),1200);
  }

  async function saveDeckToCloud(){
    try{
      const deviceId = getDeviceId();
      if (!flashcards.length){ setToast("No cards to save."); setTimeout(()=>setToast(""),1200); return; }
      const meta = readLocal<{ filename?: string }>(STORAGE.meta, {});
      const res = await fetch("/api/db/export", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          deviceId,
          filename: meta.filename || null,
          deckName: "Adaptaly Deck",
          summary,
          cards: flashcards
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Export failed");
      setToast(`Saved deck (${data.count} cards).`); setTimeout(()=>setToast(""),1500);
    }catch(e:any){ setToast(e?.message || "Could not save."); setTimeout(()=>setToast(""),2000); }
  }

  const metaText = useMemo(() => {
    const parts: string[] = [];
    if (filename) parts.push(`File: ${filename}`);
    if (processedAt){ try{ parts.push(`Processed: ${new Date(processedAt).toLocaleString()}`);}catch{parts.push(`Processed: ${processedAt}`);} }
    return parts.join("  •  ");
  }, [filename, processedAt]);

  return (
    <main className="result-shell">
      <header className="result-header">
        <h1 className="result-title">AI Results</h1>
        {metaText && <div className="result-meta">{metaText}</div>}
      </header>

      {toast && <div className="toast">{toast}</div>}

      <nav className="tabbar" aria-label="Result sections">
        <button className={`tab ${tab === "summary" ? "active" : ""}`} onClick={() => setTab("summary")}>Summary</button>
        <button className={`tab ${tab === "flashcards" ? "active" : ""}`} onClick={() => setTab("flashcards")}>Flashcards</button>
      </nav>

      {tab === "summary" ? (
        <section className="panel">
          <h2 className="panel-title">Summary</h2>
          {summary ? (
            <article className="summary-card">
              <div className="summary-row">
                <div className="summary-actions">
                  <button className="btn ghost mini" onClick={() => copyText(summary, setToast)}>Copy</button>
                  <button className="btn mini" onClick={downloadSummaryTxt}>Download .txt</button>
                </div>
              </div>
              <div className="summary-content">{summary}</div>
            </article>
          ) : (
            <div className="empty">
              <p>No summary available yet.</p>
              <a href="/" className="cta">Upload another document</a>
            </div>
          )}
        </section>
      ) : (
        <section className="panel">
          <div className="fc-toolbar">
            <div className="fc-left">
              <h2 className="panel-title">Flashcards</h2>
              <span className="fc-count">{flashcards.length}</span>
              <div className="fc-subtabs" role="tablist" aria-label="View mode">
                <button className={`sub ${view === "grid" ? "active" : ""}`} onClick={() => { setView("grid"); setRevealAll(false); setFlipped({}); }}>Grid</button>
                <button className={`sub ${view === "study" ? "active" : ""}`} onClick={enterStudy}>Study</button>
              </div>
            </div>

            <div className="fc-actions">
              <button className="btn ghost mini" onClick={downloadCardsJSON}>Download JSON</button>
              <button className="btn mini" onClick={saveDeckToCloud}>Save to Cloud</button>

              <div className="gen-group" aria-label="Generate more cards">
                <select className="gen-select" value={genCount} onChange={(e) => setGenCount(Math.max(1, Math.min(8, Number(e.target.value))))} disabled={genBusy}>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <button className="btn mini" onClick={generateMore} disabled={genBusy}>
                  {genBusy ? "Creating…" : `Create ${genCount}`}
                </button>
              </div>

              {view === "grid" && hasCards && (
                <>
                  {!revealAll ? <button className="btn" onClick={doRevealAll}>Reveal all</button> : <button className="btn" onClick={doHideAll}>Hide all</button>}
                  <button className="btn ghost" onClick={doShuffle}>Shuffle</button>
                </>
              )}
              {view === "study" && hasCards && <button className="btn ghost" onClick={studyReset}>Reset</button>}
            </div>
          </div>

          {alert && (
            <div className={`alert ${alert.type === "error" ? "error" : alert.type === "warn" ? "warn" : "info"}`}>
              <span>{alert.text}</span>
              <button className="alert-close" onClick={() => setAlert(null)} aria-label="Close">×</button>
            </div>
          )}

          {undoOpen && (
            <div className="undo-bar">
              <span>Added {undoAdded} card{undoAdded === 1 ? "" : "s"}{undoRequested > undoAdded ? ` (of ${undoRequested})` : ""}.</span>
              <div className="undo-actions">
                <button className="btn ghost mini" onClick={undoLastGenerate}>Undo</button>
                <button className="btn mini" onClick={() => setUndoOpen(false)}>Dismiss</button>
              </div>
            </div>
          )}

          {!hasCards ? (
            <div className="empty">
              <p>No flashcards available.</p>
              <a href="/" className="cta">Upload another document</a>
            </div>
          ) : view === "grid" ? (
            <ul className="fc-grid" role="list">
              {flashcards.map((c, i) => {
                const isFlipped = revealAll || flipped[i];
                const busy = !!regenBusy[i];
                const editing = editIndex === i;
                return (
                  <li key={i} className="fc-card">
                    <div className={`fc-card-inner ${isFlipped ? "is-flipped" : ""}`} onClick={() => !editing && toggleFlip(i)} aria-label={isFlipped ? "Hide answer" : "Reveal answer"}>
                      {busy && <div className="busy-overlay" aria-hidden="true"><div className="spinner" /></div>}
                      <div className="fc-face fc-front">
                        <div className="fc-label">QUESTION</div>
                        <div className="fc-text">{c.question}</div>
                        <div className="fc-hint">Click to reveal answer</div>
                      </div>
                      <div className="fc-face fc-back">
                        <div className="fc-label">ANSWER</div>
                        <div className="fc-text">{c.answer}</div>
                        <div className="fc-hint">Click to flip back</div>
                      </div>
                    </div>

                    <div className="fc-row-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="btn ghost mini" onClick={() => copyText(c.answer, setToast)}>Copy</button>
                      <button className="btn mini" disabled={busy} onClick={() => regenerateAt(i, "pair")}>{busy ? "Regenerating…" : "Regenerate (Q+A)"}</button>
                      <button className="btn ghost mini" disabled={busy} onClick={() => regenerateAt(i, "answer")}>Answer only</button>
                      <button className="btn ghost mini" onClick={() => startEdit(i)}>Edit</button>
                    </div>

                    {editing && (
                      <div className="fc-edit" onClick={(e) => e.stopPropagation()}>
                        <label>Question</label>
                        <textarea value={editQ} onChange={(e) => setEditQ(e.target.value)} />
                        <label>Answer</label>
                        <textarea value={editA} onChange={(e) => setEditA(e.target.value)} />
                        <div className="fc-edit-actions">
                          <button className="btn mini" onClick={saveEdit}>Save</button>
                          <button className="btn ghost mini" onClick={cancelEdit}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="study-area">
              {!studyDone && studyCard && (
                <div className="study-card">
                  <div className="study-label">{studyTotal - studyQueue.length + 1} / {studyTotal}</div>
                  <div className="study-q">{studyCard.question}</div>
                  {!showAnswer ? (
                    <button className="btn primary" onClick={() => setShowAnswer(true)}>Show answer (Space)</button>
                  ) : (
                    <>
                      <div className="study-a">{studyCard.answer}</div>
                      <div className="study-actions">
                        <button className="btn correct" onClick={markCorrect}>I got it (←)</button>
                        <button className="btn wrong" onClick={markWrong}>Didn’t get it (→)</button>
                      </div>
                    </>
                  )}
                  <div className="study-stats"><span>Correct: {correct}</span><span>Wrong: {wrong}</span></div>
                </div>
              )}
              {studyDone && (
                <div className="study-done">
                  <div className="done-title">Mastery complete</div>
                  <div className="done-stats"><span>Correct: {correct}</span><span>Wrong: {wrong}</span></div>
                  <div className="done-actions"><button className="btn ghost" onClick={studyReset}>Repeat</button><button className="btn" onClick={doShuffle}>Shuffle & restart</button></div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}