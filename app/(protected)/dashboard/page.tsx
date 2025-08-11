// app/(protected)/dashboard/page.tsx
import "./dashboard.css";
import Hero from "./_components/Hero";
import GoalRing from "./_components/GoalRing";
import StatsRow from "./_components/StatsRow";
import FocusCard from "./_components/FocusCard";
import RecentPacks from "./_components/RecentPacks";
import UtilityPanel from "./_components/UtilityPanel";
import StickyCTA from "./_components/StickyCTA";

import { getDashboardSummary } from "@/src/lib/dashboard";
import { getServerSupabaseReadOnly } from "@/src/lib/supabaseServer";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await getServerSupabaseReadOnly();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user ?? null;
  if (!user) redirect("/signin");

  const name = user?.user_metadata?.full_name ?? null;
  const email = user?.email ?? null;

  const summary = await getDashboardSummary({
    supabase,
    userId: user.id,
    userEmail: email,
    userName: name,
  });

  const hasDocs = summary.recentDocs.length > 0;

  return (
    <main className="db-shell">
      <Hero
        name={summary.greetingName}
        dueCount={summary.dueCount}
        duePacksCount={summary.duePacksCount}
        hasDocs={hasDocs}
      />

      <div className="db-grid">
        <section className="db-left">
          <div className="db-row">
            <GoalRing
              minutesToday={summary.minutesToday}
              minutesGoal={summary.minutesGoal}
              deltaMinutes={summary.deltaMinutesVsYesterday}
            />
            <StatsRow
              streakDays={summary.streakDays}
              bestStreak={summary.bestStreak}
              cardsReviewedToday={summary.cardsReviewedToday}
              deltaCardsVsYesterday={summary.deltaCardsVsYesterday}
            />
          </div>

          <FocusCard
            averageRecallPct={summary.averageRecallPct}
            weakestTopic={summary.weakestTopic}
            strongestTopic={summary.strongestTopic}
          />

          <RecentPacks docs={summary.recentDocs} />
        </section>

        <aside className="db-right">
          <UtilityPanel />
        </aside>
      </div>

      <StickyCTA hasDocs={hasDocs} dueCount={summary.dueCount} />
    </main>
  );
}