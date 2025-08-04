import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("deviceId");
    const deckId = searchParams.get("deckId"); // optional filter
    const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit") || 50)));

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
    }

    let query = supabaseAdmin
      .from("card_progress")
      .select(`
        card_id,
        box,
        due_at,
        cards!inner (
          deck_id,
          question,
          answer
        )
      `)
      .eq("device_id", deviceId)
      .lte("due_at", new Date().toISOString())
      .order("due_at", { ascending: true })
      .limit(limit);

    if (deckId) {
      // filter by joined table field
      query = query.eq("cards.deck_id", deckId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const items = (data ?? []).map((r: any) => ({
      cardId: r.card_id as string,
      box: r.box as number,
      dueAt: r.due_at as string,
      deckId: r.cards?.deck_id as string,
      question: r.cards?.question as string,
      answer: r.cards?.answer as string,
    }));

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to load due cards" }, { status: 500 });
  }
}