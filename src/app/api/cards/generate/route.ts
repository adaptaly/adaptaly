import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { chatCompletion } from "@/lib/ai";
import { sha256Hex } from "@/lib/hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL_MINI = process.env.MODEL_MINI || "gpt-4o-mini";

async function ensureCompressedSummary(input: {
  compressedSummary?: string | null;
  context?: string | null;
  deckId?: string | null;
}): Promise<{ compressed: string; source: "given" | "deck" | "compressed"; sumHash: string }> {
  // 1) direct compressed
  if (input.compressedSummary?.trim()) {
    const compressed = input.compressedSummary.trim();
    return { compressed, source: "given", sumHash: sha256Hex(compressed) };
  }
  // 2) from deck
  if (input.deckId) {
    const { data: deck, error } = await supabaseAdmin
      .from("decks")
      .select("compressed_summary, summary_text")
      .eq("id", input.deckId)
      .single();
    if (error || !deck) throw new Error("Deck not found");
    if (deck.compressed_summary?.trim()) {
      const c = deck.compressed_summary.trim();
      return { compressed: c, source: "deck", sumHash: sha256Hex(c) };
    }
    // compress summary_text if needed
    if (!deck.summary_text) throw new Error("No summary on deck");
    const res = await fetch(new URL("/api/summary/compress", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary: deck.summary_text }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Compression failed");
    const c = data.compressed as string;
    // store back to deck for future calls
    await supabaseAdmin.from("decks").update({ compressed_summary: c }).eq("id", input.deckId);
    return { compressed: c, source: "compressed", sumHash: sha256Hex(c) };
  }
  // 3) compress given context
  if (!input.context?.trim()) throw new Error("context or deckId or compressedSummary is required");
  const res = await fetch(new URL("/api/summary/compress", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ summary: input.context }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Compression failed");
  const c = data.compressed as string;
  return { compressed: c, source: "compressed", sumHash: sha256Hex(c) };
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const { context = null, compressedSummary = null, deckId = null, count = 4 } = await req.json();
    const n = Math.max(1, Math.min(8, Number(count) || 4));

    const { compressed, sumHash } = await ensureCompressedSummary({ compressedSummary, context, deckId });

    const cacheKey = `cards:v3:${MODEL_MINI}:${n}:${sha256Hex(compressed)}`;
    const { data: cached } = await supabaseAdmin
      .from("ai_cache")
      .select("result")
      .eq("key", cacheKey)
      .maybeSingle();
    if (cached?.result?.cards) {
      return NextResponse.json({ requested: n, cards: cached.result.cards, cached: true });
    }

    const system =
      "You create compact, exam-ready flashcards as JSON only. Keep questions specific (<=15 words) and answers factual (<=60 words). No preface.";
    const user = [
      "Context (already compressed):",
      "```",
      compressed,
      "```",
      "",
      `Generate ${n} distinct flashcards.`,
      "Return JSON as: {\"cards\":[{\"question\":\"...\",\"answer\":\"...\"}]}",
    ].join("\n");

    const { text, usage } = await chatCompletion({
      model: MODEL_MINI,
      system,
      messages: [{ role: "user", content: user }],
      max_tokens: Math.min(120 * n, 1200),
      stop: ["\n\n---", "\n\nCard:"],
      temperature: 0.2,
    });

    // extract JSON
    const match = text.match(/\{[\s\S]*\}$/);
    const jsonStr = match ? match[0] : text;
    let parsed: any = null;
    try { parsed = JSON.parse(jsonStr); } catch { /* try fenced */ 
      const fence = text.match(/```json\s*([\s\S]*?)```/i);
      if (fence) parsed = JSON.parse(fence[1]);
    }
    if (!parsed?.cards || !Array.isArray(parsed.cards)) {
      throw new Error("Model did not return cards JSON");
    }

    // cache + log usage
    await supabaseAdmin.from("ai_cache").upsert({
      key: cacheKey,
      model: MODEL_MINI,
      input_hash: sumHash,
      params: { kind: "generate", n },
      result: { cards: parsed.cards },
    });

    await supabaseAdmin.from("usage_logs").insert({
      route: "/api/cards/generate",
      action: "generate",
      model: MODEL_MINI,
      prompt_tokens: usage?.prompt_tokens || null,
      completion_tokens: usage?.completion_tokens || null,
      total_tokens: usage?.total_tokens || null,
      ms: Date.now() - t0,
      key: cacheKey,
    });

    return NextResponse.json({ requested: n, cards: parsed.cards, cached: false });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Generation failed" }, { status: 500 });
  }
}