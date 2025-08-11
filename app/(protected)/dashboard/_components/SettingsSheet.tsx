// app/(protected)/dashboard/_components/SettingsSheet.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/src/lib/supabaseClient";
import { DEFAULT_PREFS, saveUserPrefsClient, type UserPrefs } from "@/src/lib/prefs";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  initial: UserPrefs;
};

const GOALS = [15, 20, 25, 30] as const;

export default function SettingsSheet({ open, onClose, userId, initial }: Props) {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const deviceTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prefs, setPrefs] = useState<UserPrefs>({ ...DEFAULT_PREFS, ...initial });

  useEffect(() => {
    setPrefs({ ...DEFAULT_PREFS, ...initial });
  }, [initial]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const final = { ...prefs, timezone: prefs.timezone || deviceTz };
      await saveUserPrefsClient(supabase, userId, final);
      onClose();
      router.refresh(); // reload server props (goal etc.)
    } catch (e: any) {
      setError(e?.message || "Could not save settings.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="db-sheet-root" role="dialog" aria-modal="true" aria-label="Settings">
      <div className="db-sheet-backdrop" onClick={onClose} />
      <section className="db-sheet" aria-busy={busy ? "true" : "false"}>
        <header className="db-sheet-head">
          <h3 className="db-sheet-title">Settings</h3>
          <button className="db-x" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="db-sheet-body">
          <div className="db-field">
            <div className="db-label">Daily goal</div>
            <div className="db-seg">
              {GOALS.map((g) => (
                <button
                  key={g}
                  className={`db-seg-btn ${prefs.minutes_goal === g ? "is-active" : ""}`}
                  onClick={() => setPrefs((p) => ({ ...p, minutes_goal: g }))}
                >
                  {g}m
                </button>
              ))}
            </div>
          </div>

          <div className="db-field">
            <div className="db-label">Default start action</div>
            <div className="db-radio-row">
              {(["due", "quick", "topic"] as const).map((v) => (
                <label key={v} className="db-radio">
                  <input
                    type="radio"
                    name="defaction"
                    checked={prefs.default_action === v}
                    onChange={() => setPrefs((p) => ({ ...p, default_action: v }))}
                  />
                  <span>{v === "due" ? "Review due" : v === "quick" ? "Quick 10" : "Topic focus"}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="db-field">
            <div className="db-label">
              Reminder
              <span className="db-hint"> (optional)</span>
            </div>
            <label className="db-switch">
              <input
                type="checkbox"
                checked={prefs.reminder_enabled}
                onChange={(e) => setPrefs((p) => ({ ...p, reminder_enabled: e.target.checked }))}
              />
              <span>Enable daily reminder</span>
            </label>

            <div className={`db-reminder ${prefs.reminder_enabled ? "is-on" : "is-off"}`}>
              <div className="db-subfield">
                <div className="db-sublabel">Time</div>
                <input
                  type="time"
                  value={prefs.reminder_time ?? ""}
                  onChange={(e) => setPrefs((p) => ({ ...p, reminder_time: e.target.value || null }))}
                />
              </div>

              <div className="db-subfield">
                <div className="db-sublabel">Days</div>
                <div className="db-days">
                  {["S","M","T","W","T","F","S"].map((lbl, idx) => (
                    <button
                      key={idx}
                      className={`db-day ${prefs.reminder_days.includes(idx) ? "is-on" : ""}`}
                      onClick={() =>
                        setPrefs((p) => {
                          const on = p.reminder_days.includes(idx);
                          const next = on ? p.reminder_days.filter((d) => d !== idx) : [...p.reminder_days, idx];
                          next.sort((a,b)=>a-b);
                          return { ...p, reminder_days: next };
                        })
                      }
                      type="button"
                      aria-pressed={prefs.reminder_days.includes(idx)}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="db-field">
            <div className="db-label">Time zone</div>
            <div className="db-row-inline">
              <input
                className="db-input"
                value={prefs.timezone ?? ""}
                placeholder={deviceTz}
                onChange={(e) => setPrefs((p) => ({ ...p, timezone: e.target.value || null }))}
                list="tzlist"
              />
              <datalist id="tzlist">
                <option value={deviceTz} />
                <option value="UTC" />
                <option value="Europe/Amsterdam" />
                <option value="Europe/London" />
                <option value="America/New_York" />
                <option value="America/Los_Angeles" />
                <option value="Asia/Singapore" />
              </datalist>
              <button type="button" className="db-btn db-btn-secondary" onClick={() => setPrefs((p)=>({ ...p, timezone: deviceTz }))}>
                Use device
              </button>
            </div>
          </div>

          {error && <div className="db-alert">{error}</div>}
        </div>

        <footer className="db-sheet-foot">
          <button className="db-btn db-btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="db-btn db-btn-primary" onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </footer>
      </section>
    </div>
  );
}