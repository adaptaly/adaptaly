import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getCompressed(summary: string): Promise<string> {
  const res = await fetch(new URL("/api/summary/compress", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ summary }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Compression failed");
  return data.compressed as string;
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const { deviceId, filename = null, deckName = "Adaptaly Deck", summary, cards } = await req.json();
    if (!deviceId) return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
    if (!summary) return NextResponse.json({ error: "summary is required" }, { status: 400 });
    if (!Array.isArray(cards) || cards.length === 0) return NextResponse.json({ error: "cards[] required" }, { status: 400 });

    const compressed = await getCompressed(String(summary));

    const { data: deck, error: dErr } = await supabaseAdmin
      .from("decks")
      .insert({
        device_id: deviceId,
        name: deckName,
        source_filename: filename,
        summary_text: summary,
        compressed_summary: compressed,
      })
      .select("id")
      .single();
    if (dErr) throw dErr;

    const deckId = deck.id as string;

    const rows = cards.map((c: any) => ({
      deck_id: deckId,
      question: String(c.question || "").slice(0, 500),
      answer: String(c.answer || "").slice(0, 4000),
    }));
    const { data: ins, error: cErr } = await supabaseAdmin.from("cards").insert(rows).select("id");
    if (cErr) throw cErr;

    const now = new Date().toISOString();
    const prog = (ins || []).map((r: any) => ({ device_id: deviceId, card_id: r.id, box: 1, due_at: now }));
    if (prog.length) await supabaseAdmin.from("card_progress").insert(prog);

    // usage log (no tokens—this is a DB operation)
    await supabaseAdmin.from("usage_logs").insert({
      route: "/api/db/export",
      action: "export",
      model: "n/a",
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      ms: Date.now() - t0,
      key: deckId,
    });

    return NextResponse.json({ ok: true, deckId, count: rows.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Export failed" }, { status: 500 });
  }
}