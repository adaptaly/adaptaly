// app/(protected)/dashboard/DashboardClient.tsx
"use client";

import { useMemo, useState } from "react";
import Hero from "./_components/Hero";
import GoalRing from "./_components/GoalRing";
import StatsRow from "./_components/StatsRow";
import FocusCard from "./_components/FocusCard";
import RecentPacks from "./_components/RecentPacks";
import UtilityPanel from "./_components/UtilityPanel";
import StickyCTA from "./_components/StickyCTA";
import SettingsSheet from "./_components/SettingsSheet";
import HeroChecklist from "./_components/HeroChecklist";
import StreakStrip from "./_components/StreakStripe";

import type { DashboardSummary } from "@/src/lib/dashboard";
import type { UserPrefs } from "@/src/lib/prefs";

type Props = {
  userId: string;
  summary: DashboardSummary;
  prefs: UserPrefs;
};

export default function DashboardClient({ userId, summary, prefs }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const tip = useMemo(() => {
    if (summary.minutesToday < prefs.minutes_goal && summary.dueCount > 0) {
      const remain = Math.max(0, prefs.minutes_goal - summary.minutesToday);
      return `You're ${remain}m from your ${prefs.minutes_goal}m goal — try a 10-card sprint.`;
    }
    if (summary.dueCount > 50) return "Big due pile? Split into 3 short sessions.";
    if (summary.streakDays === 0) return "Start small: do 10 cards to kick off your streak.";
    return "Short 15–25 minute sessions improve retention.";
  }, [summary, prefs]);

  const hasDocs = summary.recentDocs.length > 0;
  const minutesGoal = prefs.minutes_goal ?? summary.minutesGoal;

  return (
    <>
      <div
        id="db-top-sentinel"
        style={{ position: "absolute", top: 0, left: 0, width: 1, height: 1 }}
      />

      <Hero
        name={summary.greetingName}
        dueCount={summary.dueCount}
        duePacksCount={summary.duePacksCount}
        hasDocs={hasDocs}
        onSettings={() => setSettingsOpen(true)}
      />

      <HeroChecklist
        dueCount={summary.dueCount}
        hasDocs={hasDocs}
        latestDocTitle={summary.recentDocs[0]?.title ?? null}
      />

      <div className="db-grid">
        <section className="db-left">
          <div className="db-row">
            <GoalRing
              minutesToday={summary.minutesToday}
              minutesGoal={minutesGoal}
              deltaMinutes={summary.deltaMinutesVsYesterday}
              onEditGoal={() => setSettingsOpen(true)}
            />

            <div className="db-stats-wrap">
              <StatsRow
                streakDays={summary.streakDays}
                bestStreak={summary.bestStreak}
                cardsReviewedToday={summary.cardsReviewedToday}
                deltaCardsVsYesterday={summary.deltaCardsVsYesterday}
              />
              <StreakStrip streakDays={summary.streakDays} />
            </div>
          </div>

          <FocusCard
            averageRecallPct={summary.averageRecallPct}
            weakestTopic={summary.weakestTopic}
            strongestTopic={summary.strongestTopic}
          />

          <RecentPacks
            userId={userId}
            docs={summary.recentDocs}
            pinnedDocId={prefs.pinned_doc_id ?? null}
          />
        </section>

        <aside className="db-right">
          <UtilityPanel tip={tip} />
        </aside>
      </div>

      <StickyCTA
        hasDocs={hasDocs}
        dueCount={summary.dueCount}
        sentinelId="db-top-sentinel"
      />

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userId={userId}
        initial={prefs}
      />
    </>
  );
}