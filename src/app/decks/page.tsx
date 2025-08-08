"use client";
import React, { useEffect, useMemo, useState } from "react";
import "../result/result.css";
import { getDeviceId } from "@/lib/device";
import { useRouter } from "next/navigation";

type DeckRow = {
  id: string;
  name: string | null;
  source_filename: string | null;
  summary_text: string | null;
  created_at: string;
  dueCount: number;
};

export default function DecksPage() {
  const router = useRouter();

  const [decks, setDecks] = useState<DeckRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"due" | "created">("due");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [openingId, setOpeningId] = useState<string | null>(null);

  /* -------- fetch decks -------- */
  async function loadDecks() {
    setLoading(true);
    try {
      const deviceId = getDeviceId();
      const params = new URLSearchParams({ deviceId });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/db/decks?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load decks");
      setDecks(data.decks || []);
    } catch (e: any) {
      setToast(e?.message || "Error"); setTimeout(() => setToast(""), 2000);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDecks(); /* on mount */ }, []);
  /* refetch when search changes (debounced) */
  useEffect(() => { const t = setTimeout(loadDecks, 350); return () => clearTimeout(t); }, [search]);

  /* -------- derived list -------- */
  const list = useMemo(() => {
    const sorted = [...decks];
    if (sortKey === "due") {
      sorted.sort((a,b) => b.dueCount - a.dueCount || b.created_at.localeCompare(a.created_at));
    } else {
      sorted.sort((a,b) => b.created_at.localeCompare(a.created_at));
    }
    return sorted;
  }, [decks, sortKey]);

  /* -------- actions -------- */
  async function renameDeck(id: string) {
    if (!editValue.trim()) return;
    const name = editValue.trim();
    try {
      const res = await fetch(`/api/db/decks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Rename failed");
      setDecks(prev => prev.map(d => d.id === id ? { ...d, name } : d));
      setEditingId(null);
    } catch (e: any) {
      setToast(e?.message || "Error"); setTimeout(()=>setToast(""),2000);
    }
  }

  async function deleteDeck(id: string) {
    if (!confirm("Delete this deck? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/db/decks/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      setDecks(prev => prev.filter(d => d.id !== id));
    } catch (e: any) {
      setToast(e?.message || "Error"); setTimeout(()=>setToast(""),2000);
    }
  }

  function openDeck(id: string) {
    setOpeningId(id);
    router.push(`/result?deckId=${encodeURIComponent(id)}`);
  }

  /* -------- UI -------- */
  return (
    <main className="result-shell">
      <header className="result-header">
        <h1 className="result-title">Your Decks</h1>
        {toast && <div className="toast">{toast}</div>}
      </header>

      <section className="panel">
        <div className="fc-toolbar">
          <div className="fc-left">
            <input
              className="search-input"
              placeholder="Search decks…"
              value={search}
              onChange={(e)=> setSearch(e.target.value)}
            />
          </div>
          <div className="fc-actions">
            <select className="gen-select" value={sortKey} onChange={(e)=> setSortKey(e.target.value as any)}>
              <option value="due">Sort: Most due</option>
              <option value="created">Sort: Newest</option>
            </select>
            <button className="btn ghost mini" onClick={loadDecks}>Refresh</button>
          </div>
        </div>

        {loading ? (
          <div className="empty"><p>Loading decks…</p></div>
        ) : list.length === 0 ? (
          <div className="empty"><p>No decks yet.</p></div>
        ) : (
          <ul className="deck-list" role="list">
            {list.map(d => {
              const editing = editingId === d.id;
              return (
                <li className="deck-item" key={d.id}>
                  <div className="deck-main">
                    {editing ? (
                      <input
                        className="search-input"
                        value={editValue}
                        onChange={(e)=> setEditValue(e.target.value)}
                        onKeyDown={(e)=> e.key==="Enter" && renameDeck(d.id)}
                        autoFocus
                      />
                    ) : (
                      <div className="deck-name">
                        {d.name || "Untitled Deck"}
                        {d.dueCount > 0 && (
                          <span className="badge-due">{d.dueCount} due</span>
                        )}
                      </div>
                    )}
                    <div className="deck-meta">
                      <span>{new Date(d.created_at).toLocaleString()}</span>
                      {d.source_filename && <span>• {d.source_filename}</span>}
                    </div>
                  </div>

                  <div className="deck-actions">
                    {editing ? (
                      <>
                        <button className="btn mini" onClick={()=> renameDeck(d.id)}>Save</button>
                        <button className="btn ghost mini" onClick={()=> setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="btn mini" onClick={()=> openDeck(d.id)}>
                          {openingId===d.id ? <span className="spinner-lg" /> : "Open"}
                        </button>
                        <button className="btn ghost mini" onClick={()=> router.push(`/review?deckId=${d.id}`)}>Review</button>
                        <button className="btn ghost mini" onClick={()=> { setEditingId(d.id); setEditValue(d.name ?? ""); }}>Rename</button>
                        <button className="btn ghost mini" onClick={()=> deleteDeck(d.id)}>Delete</button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}