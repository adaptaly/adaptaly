// app/(protected)/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getServerSupabaseReadOnly } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await getServerSupabaseReadOnly(); // await is required
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/signin");
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Welcome back, {data.user.email}</p>
    </main>
  );
}