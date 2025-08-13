import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Step 1: COMPLETE upload
 * For now, simply marks the document as "ready".
 * Later steps will trigger parsing and AI pipeline here.
 */

type Body = { documentId: string };

export async function POST(req: Request) {
  try {
    const { documentId } = (await req.json()) as Body;
    if (!documentId) {
      return NextResponse.json({ ok: false, error: "Missing documentId" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ ok: false, error: "Server misconfigured" }, { status: 500 });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
    const { data: userInfo, error: userErr } = await admin.auth.getUser(accessToken);
    if (userErr || !userInfo.user) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }
    const userId = userInfo.user.id;

    const { error: updateErr } = await admin
      .from("documents")
      .update({ status: "ready" })
      .eq("id", documentId)
      .eq("user_id", userId);

    if (updateErr) {
      return NextResponse.json({ ok: false, error: "Could not complete upload" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Unexpected error" }, { status: 500 });
  }
}