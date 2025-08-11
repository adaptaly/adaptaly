// src/lib/dashboard.ts
// Aggregates for the v2 dashboard with fallbacks.

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
  minutesGoal: number; // default 25
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
  const now = new Date();
  const todayStart: Date = startOfUtcDay(now);
  const yesterdayStart: Date = startOfDayDaysAgoUtc(1, now);
  const twoDaysAgoStart: Date = startOfDayDaysAgoUtc(2, now);
  const nowIso = iso(now);

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
      for (const r of dueRows) if (r.document_id) set.add(r.document_id as string);
      duePacksCount = set.size;
    }
  } catch {
    /* ignore */
  }

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
        } catch {
          /* ignore */
        }
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
  } catch {
    /* ignore */
  }

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
  } catch {
    /* ignore */
  }
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
  } catch {
    /* ignore */
  }
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
  } catch {
    /* ignore */
  }
  try {
    const { data: weak } = await supabase
      .from("v_user_weak_topic_7d")
      .select("topic, incorrect_count")
      .eq("user_id", userId)
      .order("incorrect_count", { ascending: false })
      .limit(1);
    if (Array.isArray(weak) && weak[0]?.topic) weakestTopic = weak[0].topic;
  } catch {
    /* ignore */
  }
  // Strongest topic (simple heuristic: highest correct ratio in last 7 days, min 3 reviews)
  try {
    const { data: rows } = await supabase
      .from("reviews")
      .select("correct, created_at, card_id")
      .eq("user_id", userId);
    if (Array.isArray(rows) && rows.length > 0) {
      const sevenAgo: Date = startOfDayDaysAgoUtc(6, now);
      const filtered = rows.filter(
        (r: any) => new Date(r.created_at).getTime() >= sevenAgo.getTime()
      );
      if (filtered.length > 0) {
        const ids: string[] = filtered.map((r: any) => r.card_id).filter(Boolean);
        if (ids.length > 0) {
          const { data: cards } = await supabase
            .from("cards")
            .select("id, topic")
            .in("id", ids);
          const byTopic = new Map<string, { c: number; total: number }>();
          for (const r of filtered) {
            const t: string | null =
              cards?.find((c: any) => c.id === r.card_id)?.topic ?? null;
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
  } catch {
    /* ignore */
  }

  // ---------- Streak + best streak (last ~180 days) ----------
  let streakDays = 0;
  let bestStreak = 0;
  try {
    const { data } = await supabase
      .from("reviews")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", iso(startOfDayDaysAgoUtc(180, now)));
    if (Array.isArray(data)) {
      // Build a set of day strings YYYY-MM-DD in UTC
      const days = new Set<string>();
      for (const r of data) {
        const d = new Date(r.created_at as string);
        const dayKey = d.toISOString().slice(0, 10);
        days.add(dayKey);
      }

      // Current streak: walk backwards from today or yesterday
      const todayStr: string = new Date().toISOString().slice(0, 10);
      const yStr: string = startOfDayDaysAgoUtc(1, now).toISOString().slice(0, 10);

      let cursor: Date | null = null;
      if (days.has(todayStr)) {
        cursor = startOfUtcDay(new Date());
      } else if (days.has(yStr)) {
        cursor = startOfDayDaysAgoUtc(1, new Date());
      }

      let current = 0;
      while (cursor) {
        const key = cursor.toISOString().slice(0, 10);
        if (!days.has(key)) break;
        current += 1;
        const nextCursor = new Date(cursor);
        nextCursor.setUTCDate(nextCursor.getUTCDate() - 1);
        cursor = nextCursor;
      }
      streakDays = current;

      // Best streak across the window
      const sorted: string[] = Array.from(days).sort();
      let prevStr: string | null = null;
      let run = 0;
      let best = 0;
      for (const k of sorted) {
        if (prevStr) {
          const prevDate: Date = new Date(prevStr + "T00:00:00Z");
          const prevPlusOne: Date = new Date(prevDate);
          prevPlusOne.setUTCDate(prevPlusOne.getUTCDate() + 1);

          const prevPlusOneKey: string = prevPlusOne.toISOString().slice(0, 10);
          if (k === prevPlusOneKey) {
            run += 1;
          } else {
            run = 1;
          }
        } else {
          run = 1;
        }
        if (run > best) best = run;
        prevStr = k;
      }
      bestStreak = best;
    }
  } catch {
    /* ignore */
  }

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