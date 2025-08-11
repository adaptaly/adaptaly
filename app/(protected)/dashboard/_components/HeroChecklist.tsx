// app/(protected)/dashboard/_components/HeroChecklist.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  dueCount: number;
  hasDocs: boolean;
  latestDocTitle: string | null;
};

type Item = { id: string; label: string; done: boolean };

function dayKey(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function HeroChecklist({ dueCount, hasDocs, latestDocTitle }: Props) {
  const base: Item[] = useMemo(() => {
    const items: Item[] = [];
    if (dueCount > 0) items.push({ id: "review-due", label: `Review ${dueCount} due`, done: false });
    else if (hasDocs) items.push({ id: "quick-10", label: "Quick 10-card session", done: false });
    if (latestDocTitle) items.push({ id: "open-summary", label: `Open "${latestDocTitle}" summary`, done: false });
    return items.slice(0, 3);
  }, [dueCount, hasDocs, latestDocTitle]);

  const storageKey = `dashChecklist:${dayKey()}`;
  const [items, setItems] = useState<Item[]>(base);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed: Item[] = JSON.parse(raw);
        setItems(parsed);
      } catch {
        setItems(base);
      }
    } else {
      setItems(base);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [storageKey, items]);

  if (items.length === 0) return null;

  return (
    <section className="db-card db-checklist">
      <div className="db-card-head">
        <h3 className="db-card-title">Today’s plan</h3>
      </div>
      <ul className="db-checklist-list">
        {items.map((it, idx) => (
          <li key={it.id} className={`db-check-item ${it.done ? "is-done" : ""}`}>
            <label className="db-check-label">
              <input
                type="checkbox"
                checked={it.done}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...it, done: e.target.checked };
                  setItems(next);
                }}
              />
              <span>{it.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}