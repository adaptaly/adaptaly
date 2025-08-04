import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/db/decks?deviceId=...             – all decks for device
 *                                            adds dueCount per deck
 * Optional: ?search=foo  (server-side LIKE filter, case-insensitive)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("deviceId");
    const search   = searchParams.get("search")?.trim() ?? "";

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
    }

    /* ---------- 1) base deck rows ---------- */
    let dQuery = supabaseAdmin
      .from("decks")
      .select("id, name, source_filename, summary_text, created_at")
      .eq("device_id", deviceId);

    if (search) {
      dQuery = dQuery.ilike("name", `%${search}%`);
    }

    const { data: decks, error: dErr } = await dQuery.order("created_at", { ascending: false });
    if (dErr) throw dErr;

    /* ---------- 2) due-count per deck ---------- */
    const { data: dueRows, error: dueErr } = await supabaseAdmin
      .from("card_progress")
      .select(
        "card_id, cards!inner(deck_id)"
      )
      .eq("device_id", deviceId)
      .lte("due_at", new Date().toISOString());
    if (dueErr) throw dueErr;

    const dueMap = new Map<string, number>();
    (dueRows ?? []).forEach((r: any) => {
      const deck = r.cards?.deck_id as string;
      if (!deck) return;
      dueMap.set(deck, (dueMap.get(deck) || 0) + 1);
    });

    const payload = (decks ?? []).map((d: any) => ({
      ...d,
      dueCount: dueMap.get(d.id) || 0,
      card_count: undefined,      // not returned anymore
    }));

    return NextResponse.json({ decks: payload });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load decks" }, { status: 500 });
  }
}