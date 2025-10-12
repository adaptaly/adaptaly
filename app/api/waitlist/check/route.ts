import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../../server/supabase";

function isValidEmail(email: string) {
  if (!email) return false;
  if (email.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (typeof email !== "string" || !isValidEmail(email)) {
      return NextResponse.json({ subscribed: false });
    }

    const admin = getAdminClient();
    const { data, error } = await admin
      .from("waitlist_subscribers")
      .select("email, unsubscribed_at")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !data) {
      return NextResponse.json({ subscribed: false });
    }

    // Subscribed if email exists and hasn't been unsubscribed
    const subscribed = data.unsubscribed_at === null;
    return NextResponse.json({ subscribed, email: data.email });
  } catch (e: unknown) {
    return NextResponse.json({ subscribed: false });
  }
}
