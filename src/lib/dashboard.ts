// src/lib/dashboard.ts
// Aggregates for the v2 dashboard with fallbacks.
// Works even if some tables or views are missing.

import { startOfUtcDay, startOfDayDaysAgoUtc, iso } from "@/src/lib/date";

export type RecentDoc = {
  id: string;
  title: string;
  createdAt: string;
  totalCards: number;
  masteredCount: number;
  dueCount: number;
};

export type DashboardSummary = {
  greetingName: string | null;

  // Mission
  dueCount: number;
  duePacksCount: number;

  // Tiles
  minutesToday: number;
  minutesGoal: number;         // default 25
  deltaMinutesVsYesterday: number;
  cardsReviewedToday: number;
  deltaCardsVsYesterday: number;
  streakDays: number;
  bestStreak: number;

  // Focus
  averageRecallPct: number | null;
  weakestTopic: string | null;
  strongestTopic: string | null;

  // List
  recentDocs: RecentDoc[];
};

type SB = any;

export async function getDashboardSummary(opts: {
  supabase: SB;
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
}): Promise<DashboardSummary> {
  const { supabase, userId, userEmail = null, userName = null } = opts;

  const minutesGoal = 25;

  // Time windows (UTC-based; consistent & simple)
  const todayStart = startOfUtcDay();
  const yesterdayStart = startOfDayDaysAgoUtc(1);
  const twoDaysAgoStart = startOfDayDaysAgoUtc(2);
  const nowIso = iso(new Date());

  // ---------- Mission: total due + distinct packs with due ----------
  let dueCount = 0;
  let duePacksCount = 0;
  try {
    const { data: dueRows, error } = await supabase
      .from("cards")
      .select("document_id, mastered, due_at")
      .eq("user_id", userId)
      .eq("mastered", false)
      .lte("due_at", nowIso);
    if (!error && Array.isArray(dueRows)) {
      dueCount = dueRows.length;
      const set = new Set<string>();
      for (const r of dueRows) if (r.document_id) set.add(r.document_id);
      duePacksCount = set.size;
    }
  } catch {}

  // ---------- Recent documents (limit 3) with mastered + due per pack ----------
  const recentDocs: RecentDoc[] = [];
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
        let packDue = 0;
        try {
          const { count: mCount } = await supabase
            .from("cards")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("document_id", d.id)
            .eq("mastered", true);
          masteredCount = typeof mCount === "number" ? mCount : 0;

          const { data: dueRows } = await supabase
            .from("cards")
            .select("id")
            .eq("user_id", userId)
            .eq("document_id", d.id)
            .eq("mastered", false)
            .lte("due_at", nowIso);
          packDue = Array.isArray(dueRows) ? dueRows.length : 0;
        } catch {}
        recentDocs.push({
          id: d.id,
          title: d.title ?? "Untitled",
          createdAt: d.created_at,
          totalCards: d.total_cards ?? 0,
          masteredCount,
          dueCount: packDue,
        });
      }
    }
  } catch {}

  // ---------- Reviews today / yesterday ----------
  let cardsReviewedToday = 0;
  let cardsReviewedYesterday = 0;
  try {
    const { count } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", iso(todayStart));
    cardsReviewedToday = typeof count === "number" ? count : 0;

    const { count: yCount } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", iso(yesterdayStart))
      .lt("created_at", iso(todayStart));
    cardsReviewedYesterday = typeof yCount === "number" ? yCount : 0;
  } catch {}
  const deltaCardsVsYesterday = cardsReviewedToday - cardsReviewedYesterday;

  // ---------- Minutes today / yesterday from study_sessions (fallback 0) ----------
  let minutesToday = 0;
  let minutesYesterday = 0;
  try {
    const { data: sToday } = await supabase
      .from("study_sessions")
      .select("duration_seconds, started_at")
      .eq("user_id", userId)
      .gte("started_at", iso(todayStart));
    if (Array.isArray(sToday)) {
      const total = sToday.reduce((acc: number, r: any) => acc + (r.duration_seconds ?? 0), 0);
      minutesToday = Math.round(total / 60);
    }
    const { data: sY } = await supabase
      .from("study_sessions")
      .select("duration_seconds, started_at")
      .eq("user_id", userId)
      .gte("started_at", iso(yesterdayStart))
      .lt("started_at", iso(todayStart));
    if (Array.isArray(sY)) {
      const total = sY.reduce((acc: number, r: any) => acc + (r.duration_seconds ?? 0), 0);
      minutesYesterday = Math.round(total / 60);
    }
  } catch {}
  const deltaMinutesVsYesterday = minutesToday - minutesYesterday;

  // ---------- Avg recall 7d, Weakest & Strongest topics ----------
  let averageRecallPct: number | null = null;
  let weakestTopic: string | null = null;
  let strongestTopic: string | null = null;
  try {
    const { data: rec } = await supabase
      .from("v_user_recall_7d")
      .select("recall_pct")
      .eq("user_id", userId)
      .maybeSingle();
    if (rec?.recall_pct != null) averageRecallPct = Number(rec.recall_pct);
  } catch {}
  try {
    const { data: weak } = await supabase
      .from("v_user_weak_topic_7d")
      .select("topic, incorrect_count")
      .eq("user_id", userId)
      .order("incorrect_count", { ascending: false })
      .limit(1);
    if (Array.isArray(weak) && weak[0]?.topic) weakestTopic = weak[0].topic;
  } catch {}
  // Strongest = most correct in 7d (fallback compute)
  try {
    const { data: rows } = await supabase
      .from("reviews")
      .select("correct, created_at, card_id")
      .eq("user_id", userId);
    if (Array.isArray(rows) && rows.length > 0) {
      const sevenAgo = startOfDayDaysAgoUtc(6);
      const filtered = rows.filter((r: any) => new Date(r.created_at).getTime() >= sevenAgo.getTime());
      // need topics
      if (filtered.length > 0) {
        const ids = filtered.map((r: any) => r.card_id).filter(Boolean);
        if (ids.length > 0) {
          const { data: cards } = await supabase
            .from("cards")
            .select("id, topic")
            .in("id", ids);
          const byTopic = new Map<string, { c: number; total: number }>();
          for (const r of filtered) {
            const t = cards?.find((c: any) => c.id === r.card_id)?.topic ?? null;
            if (!t) continue;
            const m = byTopic.get(t) ?? { c: 0, total: 0 };
            m.total += 1;
            if (r.correct) m.c += 1;
            byTopic.set(t, m);
          }
          let best: string | null = null;
          let bestPct = -1;
          byTopic.forEach((v, k) => {
            if (v.total >= 3) {
              const pct = v.c / v.total;
              if (pct > bestPct) {
                bestPct = pct;
                best = k;
              }
            }
          });
          strongestTopic = best;
        }
      }
    }
  } catch {}

  // ---------- Streak + best streak (last ~180 days) ----------
  let streakDays = 0;
  let bestStreak = 0;
  try {
    const { data } = await supabase
      .from("reviews")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", iso(startOfDayDaysAgoUtc(180)));
    if (Array.isArray(data)) {
      const days = new Set<string>();
      for (const r of data) {
        const d = new Date(r.created_at);
        days.add(d.toISOString().slice(0, 10));
      }
      // current streak (ending today or yesterday)
      const todayStr = new Date().toISOString().slice(0, 10);
      const y = startOfDayDaysAgoUtc(1).toISOString().slice(0, 10);
      let cursor = days.has(todayStr)
        ? new Date()
        : days.has(y)
        ? new Date(startOfDayDaysAgoUtc(1))
        : null;
      let cur = 0;
      while (cursor) {
        const key = cursor.toISOString().slice(0, 10);
        if (!days.has(key)) break;
        cur += 1;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }
      streakDays = cur;

      // best streak across window
      // walk from oldest to newest
      const sorted = Array.from(days).sort();
      let prev: string | null = null;
      let run = 0;
      bestStreak = 0;
      for (const k of sorted) {
        if (prev) {
          const dPrev = new Date(prev);
          dPrev.setUTCDate(dPrev.getUTCDate() + 1);
          const should = dPrev.toISOString().slice(0, 10);
          if (k === should) run += 1;
          else run = 1;
        } else {
          run = 1;
        }
        if (run > bestStreak) bestStreak = run;
        prev = k;
      }
    }
  } catch {}

  return {
    greetingName: userName || userEmail || null,

    dueCount,
    duePacksCount,

    minutesToday,
    minutesGoal,
    deltaMinutesVsYesterday,
    cardsReviewedToday,
    deltaCardsVsYesterday,
    streakDays,
    bestStreak,

    averageRecallPct,
    weakestTopic,
    strongestTopic,

    recentDocs,
  };
}