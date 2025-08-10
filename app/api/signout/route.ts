// app/api/signout/route.ts
import { NextResponse } from "next/server";
// Use a stable relative path to src/lib (avoid "@/..." unless you set a tsconfig path alias)
import { getServerSupabaseWritable } from "@/lib/supabaseServer";

// Optional: force Node runtime (good default for Supabase auth in route handlers)
export const runtime = "nodejs";

export async function POST() {
  const supabase = await getServerSupabaseWritable();

  // Sign out the current session and clear the auth cookies
  const { error } = await supabase.auth.signOut();
  if (error) {
    // Return 200 anyway to avoid leaking anything to client logic,
    // but log on the server for debugging.
    console.error("signout error:", error.message);
  }

  return NextResponse.json({ ok: true });
}