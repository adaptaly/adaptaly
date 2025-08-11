// app/(protected)/dashboard/page.tsx
import "./dashboard.css";
import { getDashboardSummary } from "@/src/lib/dashboard";
import { getServerSupabaseReadOnly } from "@/src/lib/supabaseServer";
import { getUserPrefsServer } from "@/src/lib/prefs";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await getServerSupabaseReadOnly();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user ?? null;
  if (!user) redirect("/signin");

  const email = user.email ?? null;
  const name =
    (user.user_metadata?.name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    null;

  const summary = await getDashboardSummary({
    supabase,
    userId: user.id,
    userEmail: email,
    userName: name,
  });

  const prefs = await getUserPrefsServer(supabase, user.id);

  return (
    <main className="db-shell">
      <DashboardClient userId={user.id} summary={summary} prefs={prefs} />
    </main>
  );
}