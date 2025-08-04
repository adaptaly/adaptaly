import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("deviceId");
    if (!deviceId) return NextResponse.json({ error: "deviceId is required" }, { status: 400 });

    // Decks + card_count
    const { data, error } = await supabaseAdmin
      .from("decks")
      .select(`
        id,
        name,
        source_filename,
        summary_text,
        created_at,
        cards:cards(count)
      `)
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const decks = (data ?? []).map((row: any) => ({
      id: row.id as string,
      name: row.name as string | null,
      source_filename: row.source_filename as string | null,
      summary_text: row.summary_text as string | null,
      created_at: row.created_at as string,
      card_count: (row.cards?.[0]?.count as number) ?? 0,
    }));

    return NextResponse.json({ decks });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load decks" }, { status: 500 });
  }
}