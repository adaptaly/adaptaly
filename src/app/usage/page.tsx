"use client";
import React, { useEffect, useMemo, useState } from "react";
import "../result/result.css";

type Log = {
  route: string;
  action: string;
  model: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  ms: number | null;
  key: string | null;
  created_at: string;
};

const ACTION_LABELS: Record<string, string> = {
  export: "Upload/Export",
  compress: "Compress",
  generate: "Generate",
  "regen-answer": "Regenerate (Answer)",
  "regen-pair": "Regenerate (Q+A)",
};

const RANGE_OPTIONS = [
  { key: "1", label: "Today" },
  { key: "7", label: "Last 7d" },
  { key: "30", label: "Last 30d" },
  { key: "all", label: "All time" },
];

export default function UsagePage() {
  const [range, setRange] = useState<string>("7");
  const [action, setAction] = useState<string>(""); // "" = all
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState("");

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("days", range);
      params.set("limit", "1000");
      if (action) params.set("action", action);

      const res = await fetch(`/api/usage?${params.toString()}`, {
        headers: { "x-admin-key": process.env.NEXT_PUBLIC_ADMIN_KEY as string },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load usage");
      setLogs(data.logs || []);
    } catch (e: any) {
      setToast(e?.message || "Error"); setTimeout(() => setToast(""), 2000);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(load, 150); return () => clearTimeout(t); }, [range, action]);

  // Aggregations
  const totals = useMemo(() => {
    let prompt = 0, completion = 0, total = 0, count = 0;
    for (const r of logs) {
      prompt += r.prompt_tokens || 0;
      completion += r.completion_tokens || 0;
      total += r.total_tokens || ((r.prompt_tokens || 0) + (r.completion_tokens || 0));
      count += 1;
    }
    return { prompt, completion, total, count };
  }, [logs]);

  const byAction = useMemo(() => {
    const map = new Map<string, { prompt: number; completion: number; total: number; count: number }>();
    for (const r of logs) {
      const a = r.action || "unknown";
      const m = map.get(a) || { prompt: 0, completion: 0, total: 0, count: 0 };
      m.prompt += r.prompt_tokens || 0;
      m.completion += r.completion_tokens || 0;
      m.total += r.total_tokens || ((r.prompt_tokens || 0) + (r.completion_tokens || 0));
      m.count += 1;
      map.set(a, m);
    }
    // sort by total desc
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [logs]);

  return (
    <main className="result-shell">
      <header className="result-header">
        <h1 className="result-title">Usage</h1>
        {toast && <div className="toast">{toast}</div>}
      </header>

      <section className="panel">
        <div className="fc-toolbar">
          <div className="fc-left" style={{ gap: 8 }}>
            <div className="seg">
              {RANGE_OPTIONS.map(r => (
                <button
                  key={r.key}
                  className={`seg-btn ${range === r.key ? "active" : ""}`}
                  onClick={() => setRange(r.key)}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <select className="gen-select" value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="">All actions</option>
              <option value="export">{ACTION_LABELS.export}</option>
              <option value="compress">{ACTION_LABELS.compress}</option>
              <option value="generate">{ACTION_LABELS.generate}</option>
              <option value="regen-answer">{ACTION_LABELS["regen-answer"]}</option>
              <option value="regen-pair">{ACTION_LABELS["regen-pair"]}</option>
            </select>
          </div>
          <div className="fc-actions">
            <button className="btn ghost mini" onClick={load}>
              {loading ? <span className="spinner-lg" /> : "Refresh"}
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="usage-cards">
          <div className="usage-card">
            <div className="uc-title">Requests</div>
            <div className="uc-value">{totals.count.toLocaleString()}</div>
          </div>
          <div className="usage-card">
            <div className="uc-title">Prompt tokens</div>
            <div className="uc-value">{totals.prompt.toLocaleString()}</div>
          </div>
          <div className="usage-card">
            <div className="uc-title">Completion tokens</div>
            <div className="uc-value">{totals.completion.toLocaleString()}</div>
          </div>
          <div className="usage-card">
            <div className="uc-title">Total tokens</div>
            <div className="uc-value">{totals.total.toLocaleString()}</div>
          </div>
        </div>

        {/* Per-action totals */}
        <div className="usage-table">
          <div className="ut-head ut-row">
            <div>Action</div>
            <div>Requests</div>
            <div>Prompt</div>
            <div>Completion</div>
            <div>Total</div>
          </div>
          {byAction.map(([a, v]) => (
            <div className="ut-row" key={a}>
              <div className="ut-action">{ACTION_LABELS[a] || a}</div>
              <div>{v.count.toLocaleString()}</div>
              <div>{v.prompt.toLocaleString()}</div>
              <div>{v.completion.toLocaleString()}</div>
              <div className="ut-strong">{v.total.toLocaleString()}</div>
            </div>
          ))}
          {byAction.length === 0 && <div className="empty"><p>No data.</p></div>}
        </div>

        {/* Raw log list */}
        <div className="usage-table" style={{ marginTop: 14 }}>
          <div className="ut-head ut-row">
            <div>When</div>
            <div>Action</div>
            <div>Model</div>
            <div>Prompt</div>
            <div>Completion</div>
            <div>Total</div>
            <div>ms</div>
            <div>Route</div>
          </div>
          {logs.map((r, i) => (
            <div className="ut-row" key={i}>
              <div>{new Date(r.created_at).toLocaleString()}</div>
              <div className="ut-action">{ACTION_LABELS[r.action] || r.action}</div>
              <div className="ut-mono">{r.model}</div>
              <div>{(r.prompt_tokens || 0).toLocaleString()}</div>
              <div>{(r.completion_tokens || 0).toLocaleString()}</div>
              <div className="ut-strong">{(r.total_tokens || ((r.prompt_tokens || 0) + (r.completion_tokens || 0))).toLocaleString()}</div>
              <div>{r.ms ?? ""}</div>
              <div className="ut-mono">{r.route}</div>
            </div>
          ))}
          {logs.length === 0 && <div className="empty"><p>No logs in this range.</p></div>}
        </div>
      </section>
    </main>
  );
}