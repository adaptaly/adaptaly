// app/(protected)/dashboard/page.tsx
import "./dashboard.css";
import Hero from "./_components/Hero";
import StatTiles from "./_components/StatTiles";
import Insights from "./_components/Insights";
import RecentPacks from "./_components/RecentPacks";
import QuickActions from "./_components/QuickActions";
import OnboardingHint from "./_components/OnboardingHint";

import { getDashboardSummary } from "@/src/lib/dashboard";
import { getServerSupabaseReadOnly } from "../../../src/lib/supabaseServer"; // relative to this file

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const revalidate = 0; // always fresh

export default async function DashboardPage() {
  const supabase = await getServerSupabaseReadOnly(); // uses cookies internally in your helper
  const { data: userRes } = await supabase.auth.getUser();

  const user = userRes?.user ?? null;
  if (!user) {
    // middleware should already protect, but double-guard
    redirect("/signin");
  }

  const name = user?.user_metadata?.full_name ?? null;
  const email = user?.email ?? null;

  const summary = await getDashboardSummary({
    supabase,
    userId: user.id,
    userEmail: email,
    userName: name,
  });

  return (
    <main className="db-shell">
      <Hero name={summary.greetingName} dueCount={summary.dueCount} hasDocs={summary.recentDocs.length > 0} />

      <div className="db-grid">
        <section className="db-left">
          <StatTiles
            minutesToday={summary.minutesToday}
            cardsReviewedToday={summary.cardsReviewedToday}
            streakDays={summary.streakDays}
          />

          <Insights
            averageRecallPct={summary.averageRecallPct}
            weakestTopic={summary.weakestTopic}
          />

          <OnboardingHint />

          <RecentPacks docs={summary.recentDocs} />
        </section>

        <aside className="db-right">
          <div className="db-card">
            <h3 className="db-card-title" style={{ marginBottom: 10 }}>Quick actions</h3>
            <QuickActions />
          </div>
        </aside>
      </div>
    </main>
  );
}