// src/lib/dashboard.ts
// Server-only helpers to aggregate dashboard data for the signed-in user.
// Works even if some tables do not exist yet. All errors degrade gracefully.

import { startOfUtcDay, sevenDaysAgoUtc } from "../lib/date";

export type RecentDoc = {
  id: string;
  title: string;
  createdAt: string;
  totalCards: number;
  masteredCount: number;
};

export type DashboardSummary = {
  greetingName: string | null;
  dueCount: number | null;
  streakDays: number;
  minutesToday: number;
  cardsReviewedToday: number;
  averageRecallPct: number | null;
  weakestTopic: string | null;
  recentDocs: RecentDoc[];
};

type Supabase = {
  from: (table: string) => any;
  rpc?: (fn: string, args?: Record<string, any>) => any;
};

export async function getDashboardSummary(opts: {
  supabase: Supabase;
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
}): Promise<DashboardSummary> {
  const { supabase, userId, userEmail = null, userName = null } = opts;

  // Defaults
  let dueCount: number | null = null;
  let streakDays = 0;
  let minutesToday = 0;
  let cardsReviewedToday = 0;
  let averageRecallPct: number | null = null;
  let weakestTopic: string | null = null;
  const recentDocs: RecentDoc[] = [];

  // Dates
  const todayStart = startOfUtcDay();
  const sevenDaysStart = sevenDaysAgoUtc();

  // Due count: try view first, fall back to raw
  try {
    const { data, error } = await supabase.from("v_user_due_today").select("due_count").eq("user_id", userId).maybeSingle?.() ?? {};
    if (!error && data) dueCount = Number(data.due_count) || 0;
  } catch {
    // fall back to raw cards query
    try {
      const { data, error } = await supabase
        .from("cards")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .lte("due_at", new Date().toISOString())
        .eq("mastered", false);
      if (!error && typeof data?.length !== "undefined") {
        // supabase-js returns count on head queries via data?.length? Not always; safer to fetch count via .range
      }
      // better: do a non-head count
      const { count } = await supabase
        .from("cards")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .lte("due_at", new Date().toISOString())
        .eq("mastered", false);
      if (typeof count === "number") dueCount = count;
    } catch {
      /* ignore */
    }
  }

  // Recent documents (limit 3)
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("id, title, created_at, total_cards")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);
    if (!error && Array.isArray(data)) {
      for (const d of data) {
        let masteredCount = 0;
        try {
          const { count } = await supabase
            .from("cards")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("document_id", d.id)
            .eq("mastered", true);
          masteredCount = typeof count === "number" ? count : 0;
        } catch {
          masteredCount = 0;
        }
        recentDocs.push({
          id: d.id,
          title: d.title ?? "Untitled",
          createdAt: d.created_at,
          totalCards: d.total_cards ?? 0,
          masteredCount,
        });
      }
    }
  } catch {
    /* ignore */
  }

  // Reviews today (cardsReviewedToday)
  try {
    const { count } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", todayStart.toISOString());
    if (typeof count === "number") cardsReviewedToday = count;
  } catch {
    /* ignore */
  }

  // Minutes today from study_sessions; fallback 0
  try {
    const { data, error } = await supabase
      .from("study_sessions")
      .select("duration_seconds")
      .eq("user_id", userId)
      .gte("started_at", todayStart.toISOString());
    if (!error && Array.isArray(data)) {
      const total = data.reduce((acc, row) => acc + (row.duration_seconds ?? 0), 0);
      minutesToday = Math.max(0, Math.round(total / 60));
    }
  } catch {
    /* ignore */
  }

  // Average recall 7d
  try {
    const { data, error } = await supabase
      .from("v_user_recall_7d")
      .select("recall_pct")
      .eq("user_id", userId)
      .maybeSingle?.();
    if (!error && data) {
      averageRecallPct = data.recall_pct == null ? null : Number(data.recall_pct);
    }
    if (averageRecallPct == null) {
      // fallback: compute from raw reviews
      const { data: r } = await supabase
        .from("reviews")
        .select("correct")
        .eq("user_id", userId)
        .gte("created_at", sevenDaysStart.toISOString());
      if (Array.isArray(r) && r.length > 0) {
        const total = r.length;
        const correct = r.filter(x => x.correct).length;
        averageRecallPct = Math.round((100 * correct) / total);
      }
    }
  } catch {
    /* ignore */
  }

  // Weakest topic 7d
  try {
    const { data, error } = await supabase
      .from("v_user_weak_topic_7d")
      .select("topic, incorrect_count")
      .eq("user_id", userId)
      .order("incorrect_count", { ascending: false })
      .limit(1);
    if (!error && Array.isArray(data) && data[0]?.topic) {
      weakestTopic = data[0].topic;
    } else {
      // fallback from raw join
      const { data: rows } = await supabase
        .from("cards")
        .select("topic, id")
        .eq("user_id", userId)
        .not("topic", "is", null)
        .neq("topic", "");
      if (Array.isArray(rows) && rows.length > 0) {
        weakestTopic = null; // cannot compute without reviews; keep null
      }
    }
  } catch {
    /* ignore */
  }

  // Streak calculation (simple): count consecutive days with >= 1 review, ending today or yesterday
  try {
    const { data } = await supabase
      .from("reviews")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 21 * 86400000).toISOString()); // 3 week window
    if (Array.isArray(data)) {
      const days = new Set<string>();
      for (const r of data) {
        const d = new Date(r.created_at);
        days.add(d.toISOString().slice(0, 10)); // YYYY-MM-DD
      }
      // compute streak ending at today (UTC) or yesterday
      const todayStr = new Date().toISOString().slice(0, 10);
      const yest = new Date(); yest.setUTCDate(yest.getUTCDate() - 1);
      const yestStr = yest.toISOString().slice(0, 10);
      let cursor = days.has(todayStr) ? new Date() : days.has(yestStr) ? yest : null;
      let streak = 0;
      while (cursor) {
        const key = cursor.toISOString().slice(0, 10);
        if (!days.has(key)) break;
        streak += 1;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }
      streakDays = streak;
    }
  } catch {
    /* ignore */
  }

  return {
    greetingName: userName || userEmail || null,
    dueCount,
    streakDays,
    minutesToday,
    cardsReviewedToday,
    averageRecallPct,
    weakestTopic,
    recentDocs,
  };
}