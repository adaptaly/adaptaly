// app/api/signout/route.ts
import { NextResponse } from "next/server";
import { getServerSupabaseWritable } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await getServerSupabaseWritable();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("signout error:", error.message);
  }
  return NextResponse.json({ ok: true });
}