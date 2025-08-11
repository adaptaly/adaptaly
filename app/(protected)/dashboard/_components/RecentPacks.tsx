// app/(protected)/dashboard/_components/RecentPacks.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { supabaseBrowser } from "@/src/lib/supabaseClient";
import { setPinnedDocClient } from "@/src/lib/prefs";

type Doc = {
  id: string;
  title: string;
  createdAt: string;
  totalCards: number;
  masteredCount: number;
  dueCount: number;
};

export default function RecentPacks({
  userId,
  docs,
  pinnedDocId,
}: {
  userId: string;
  docs: Doc[];
  pinnedDocId: string | null;
}) {
  const supabase = supabaseBrowser();
  const [localPinned, setLocalPinned] = useState<string | null>(pinnedDocId);
  const [items, setItems] = useState<Doc[]>(docs);

  const pin = async (id: string | null) => {
    setLocalPinned(id);
    try {
      await setPinnedDocClient(supabase, userId, id);
    } catch {
      // revert on error
      setLocalPinned(pinnedDocId);
    }
  };

  const rename = async (id: string) => {
    const current = items.find((d) => d.id === id);
    const next = window.prompt("Rename pack", current?.title ?? "Untitled");
    if (!next || next.trim() === current?.title) return;
    const title = next.trim();
    const { error } = await supabase.from("documents").update({ title }).eq("id", id);
    if (!error) setItems((arr) => arr.map((d) => (d.id === id ? { ...d, title } : d)));
  };

  const remove = async (id: string) => {
    const ok = window.confirm("Delete this pack? This cannot be undone.");
    if (!ok) return;
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (!error) {
      setItems((arr) => arr.filter((d) => d.id !== id));
      if (localPinned === id) await pin(null);
    }
  };

  if (items.length === 0) {
    return (
      <section className="db-card db-empty">
        <svg className="db-empty-illustration" width="42" height="42" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        <h3 className="db-empty-title">No Study Packs yet</h3>
        <p className="db-empty-sub">Upload a file to generate flashcards and summaries.</p>
        <Link className="db-btn db-btn-primary" href="/?upload=1">Upload file</Link>
      </section>
    );
  }

  // If one is pinned, show it as a small featured tile
  const pinned = localPinned ? items.find((d) => d.id === localPinned) ?? null : null;
  const rest = pinned ? items.filter((d) => d.id !== pinned.id) : items;

  return (
    <>
      {pinned && (
        <section className="db-card">
          <div className="db-card-head">
            <h3 className="db-card-title">Pinned</h3>
          </div>
          <ul className="db-doclist">
            <DocRow key={pinned.id} doc={pinned} isPinned onPin={() => pin(null)} onRename={() => rename(pinned.id)} onDelete={() => remove(pinned.id)} />
          </ul>
        </section>
      )}

      <section className="db-card">
        <div className="db-card-head">
          <h3 className="db-card-title">Recent Study Packs</h3>
        </div>
        <ul className="db-doclist">
          {rest.map((d) => (
            <DocRow
              key={d.id}
              doc={d}
              isPinned={localPinned === d.id}
              onPin={() => pin(localPinned === d.id ? null : d.id)}
              onRename={() => rename(d.id)}
              onDelete={() => remove(d.id)}
            />
          ))}
        </ul>
      </section>
    </>
  );
}

function DocRow({
  doc,
  isPinned,
  onPin,
  onRename,
  onDelete,
}: {
  doc: Doc;
  isPinned: boolean;
  onPin: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const masteredPct = doc.totalCards > 0 ? Math.round((100 * doc.masteredCount) / doc.totalCards) : 0;

  const primaryLabel =
    doc.dueCount > 0 ? `Review ${doc.dueCount} due` : doc.totalCards > 0 ? "Practice 10" : "Open";
  const href = doc.dueCount > 0 ? `/review?doc=${doc.id}` : `/review?quick=1&doc=${doc.id}`;

  return (
    <li className="db-doc">
      <div>
        <div className="db-doc-title">{doc.title || "Untitled pack"}</div>
        <div className="db-doc-meta">
          <span>{doc.totalCards} cards</span>
          <span>·</span>
          <span>{doc.masteredCount} mastered</span>
          <span>·</span>
          <span>{doc.dueCount} due</span>
        </div>
        <div className="db-progress">
          <div className="db-progress-bar" style={{ width: `${masteredPct}%` }} />
        </div>
        <div className="db-progress-label">{masteredPct}% mastered</div>
      </div>
      <div className="db-doc-actions">
        <Link className="db-btn db-btn-secondary" href={href}>{primaryLabel}</Link>
        <button type="button" className="db-btn db-btn-ghost" onClick={onRename}>Rename</button>
        <button type="button" className="db-btn db-btn-ghost" onClick={onPin}>{isPinned ? "Unpin" : "Pin"}</button>
        <button type="button" className="db-btn db-btn-ghost" onClick={onDelete}>Delete</button>
      </div>
    </li>
  );
}