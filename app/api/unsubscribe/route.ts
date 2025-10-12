import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../server/supabase";

export const runtime = "nodejs";

function isValidEmail(email: string) {
  if (!email) return false;
  if (email.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const admin = getAdminClient();

    if (typeof body?.token === "string" && body.token.length > 0) {
      // Token-based unsubscribe (from email links)
      const { error } = await admin
        .from("waitlist_subscribers")
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq("unsubscribe_token", body.token);

      if (error) {
        console.error("Unsubscribe error (token redacted):", error.code);
        return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    if (typeof body?.email === "string" && isValidEmail(body.email)) {
      const normalizedEmail = body.email.toLowerCase();

      // Soft unsubscribe: set unsubscribed_at
      // Always return 200 to prevent email enumeration (don't reveal if email exists)
      await admin
        .from("waitlist_subscribers")
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq("email", normalizedEmail);

      // Always return success, even if email doesn't exist (privacy)
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Missing token or valid email" }, { status: 400 });
  } catch (e: unknown) {
    console.error("Unsubscribe API error:", e instanceof Error ? e.message : "Unknown");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
