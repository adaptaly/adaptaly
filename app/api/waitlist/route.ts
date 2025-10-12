import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../server/supabase";
import { sendParentConsentEmail } from "../../../server/email";
import crypto from "node:crypto";

export const runtime = "nodejs";

function isValidEmail(email: string) {
  if (!email) return false;
  if (email.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body?.email ?? "").toLowerCase();
    const isMinor = Boolean(body?.isMinor);
    const parentEmail = isMinor ? String(body?.parentEmail ?? "").toLowerCase() : "";

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (isMinor && !isValidEmail(parentEmail)) {
      return NextResponse.json({ error: "Parent email required" }, { status: 400 });
    }

    const admin = getAdminClient();
    const token = crypto.randomUUID();

    // Rate limit: 5 attempts / 10 minutes / IP
    try {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "0.0.0.0";
      const ipHash = crypto.createHash("sha256").update(ip).digest("hex");
      await admin.from("api_rate_events").insert({ ip_hash: ipHash, route: "waitlist" });
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { count } = await admin
        .from("api_rate_events")
        .select("*", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .eq("route", "waitlist")
        .gte("created_at", tenMinAgo);
      if ((count ?? 0) > 5) {
        return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
      }
    } catch (e) {
      console.error("[rate-limit] skipped:", e instanceof Error ? e.message : e);
    }

    if (isMinor) {
      // Under-16: Create pending consent record
      const { error } = await admin
        .from("waitlist_pending_consents")
        .insert({ token, child_email: email, parent_email: parentEmail });

      if (error) {
        console.error("Pending consent error (email redacted):", error.message || error.code || "Unknown error");
        return NextResponse.json({ error: "Failed to create consent request" }, { status: 500 });
      }

      // Send email to parent via Resend
      const origin = req.nextUrl.origin;
      const consentUrl = `${origin}/api/consent/parent?token=${token}`;
      try {
        await sendParentConsentEmail({
          parentEmail,
          childEmail: email,
          consentUrl,
        });
      } catch (e) {
        console.error("[email] send failed:", e instanceof Error ? e.message : e);
        // do not fail client UX; parent can still be contacted manually if needed
      }

      return NextResponse.json({ ok: true, pending: true });
    }

    // 16+: Direct upsert, clear unsubscribed_at
    const { error } = await admin
      .from("waitlist_subscribers")
      .upsert(
        {
          email,
          unsubscribe_token: token,
          unsubscribed_at: null,
          is_minor: false,
          parent_email: null,
          parent_consented_at: null
        },
        { onConflict: "email" }
      );

    if (error) {
      console.error("Subscription error (email redacted):", error.message || error.code || "Unknown error");
      return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("Waitlist API error:", e instanceof Error ? e.message : "Unknown");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
