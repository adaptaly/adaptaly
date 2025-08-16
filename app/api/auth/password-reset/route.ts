// app/api/auth/password-reset/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// swap alias for a stable relative import
import { getBaseUrl } from "@/src/lib/urls";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const redirectTo = `${getBaseUrl()}/reset/confirm`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    // Do not leak whether the email exists or not
    if (error) {
      console.error("password-reset error:", error.message);
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("password-reset fatal:", e);
    // Still neutral
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}