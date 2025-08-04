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
}): Promise<string> {
  if (input.compressedSummary?.trim()) return input.compressedSummary.trim();
  if (input.deckId) {
    const { data: deck, error } = await supabaseAdmin
      .from("decks")
      .select("compressed_summary, summary_text")
      .eq("id", input.deckId)
      .single();
    if (error || !deck) throw new Error("Deck not found");
    if (deck.compressed_summary?.trim()) return deck.compressed_summary.trim();

    // compress on the fly
    const res = await fetch(new URL("/api/summary/compress", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary: deck.summary_text }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Compression failed");
    const c = data.compressed as string;
    // persist
    await supabaseAdmin.from("decks").update({ compressed_summary: c }).eq("id", input.deckId);
    return c;
  }
  if (!input.context?.trim()) throw new Error("context or deckId or compressedSummary is required");
  const res = await fetch(new URL("/api/summary/compress", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ summary: input.context }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Compression failed");
  return data.compressed as string;
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const body = await req.json();
    const question = String(body.question || "").trim();
    const answer = body.answer ? String(body.answer).trim() : "";
    const mode: "answer" | "pair" = body.mode === "pair" ? "pair" : "answer";
    const deckId = body.deckId || null;
    const context = body.context || null;
    const compressedSummary = body.compressedSummary || null;

    if (!question) return NextResponse.json({ error: "question is required" }, { status: 400 });

    const compressed = await ensureCompressedSummary({ compressedSummary, context, deckId });
    const baseKey = `${sha256Hex(compressed)}:${sha256Hex(question)}${mode === "pair" && answer ? ":" + sha256Hex(answer) : ""}`;
    const cacheKey = `regen:v2:${MODEL_MINI}:${mode}:${baseKey}`;

    // cache
    const { data: cached } = await supabaseAdmin
      .from("ai_cache")
      .select("result")
      .eq("key", cacheKey)
      .maybeSingle();
    if (cached?.result) {
      return NextResponse.json({ ...cached.result, cached: true });
    }

    const systemAns =
      "You refine the answer for an existing flashcard. Return JSON only: {\"answer\":\"...\"}. Max 80 tokens. No preface.";
    const systemPair =
      "You regenerate a better QA flashcard. Return JSON only: {\"question\":\"...\",\"answer\":\"...\"}. Q<=15 words, A<=60 words. No preface.";

    let text: string;
    let usage: any;

    if (mode === "answer") {
      const { text: t, usage: u } = await chatCompletion({
        model: MODEL_MINI,
        system: systemAns,
        messages: [
          { role: "user", content: `Context:\n\`\`\`\n${compressed}\n\`\`\`\n\nQuestion:\n${question}\n\nReturn JSON.` },
        ],
        max_tokens: 120,
        stop: ["\n\n---"],
        temperature: 0.2,
      });
      text = t; usage = u;
      const match = text.match(/\{[\s\S]*\}$/);
      const jsonStr = match ? match[0] : text;
      const parsed = JSON.parse(jsonStr);
      if (!parsed?.answer) throw new Error("No answer returned");
      await supabaseAdmin.from("ai_cache").upsert({
        key: cacheKey,
        model: MODEL_MINI,
        input_hash: baseKey,
        params: { kind: "regen", mode: "answer" },
        result: { answer: parsed.answer },
      });
      await supabaseAdmin.from("usage_logs").insert({
        route: "/api/cards/regenerate",
        action: "regen-answer",
        model: MODEL_MINI,
        prompt_tokens: usage?.prompt_tokens || null,
        completion_tokens: usage?.completion_tokens || null,
        total_tokens: usage?.total_tokens || null,
        ms: Date.now() - t0,
        key: cacheKey,
      });
      return NextResponse.json({ answer: parsed.answer, cached: false });
    } else {
      const { text: t, usage: u } = await chatCompletion({
        model: MODEL_MINI,
        system: systemPair,
        messages: [
          { role: "user", content: `Context:\n\`\`\`\n${compressed}\n\`\`\`\n\nOriginal Question:\n${question}\n${answer ? `\nOriginal Answer:\n${answer}\n` : ""}\nReturn JSON.` },
        ],
        max_tokens: 160,
        stop: ["\n\n---"],
        temperature: 0.2,
      });
      text = t; usage = u;
      const match = text.match(/\{[\s\S]*\}$/);
      const jsonStr = match ? match[0] : text;
      const parsed = JSON.parse(jsonStr);
      if (!parsed?.answer) throw new Error("No answer returned");
      // fill question if missing
      if (!parsed?.question) parsed.question = question;
      await supabaseAdmin.from("ai_cache").upsert({
        key: cacheKey,
        model: MODEL_MINI,
        input_hash: baseKey,
        params: { kind: "regen", mode: "pair" },
        result: { question: parsed.question, answer: parsed.answer },
      });
      await supabaseAdmin.from("usage_logs").insert({
        route: "/api/cards/regenerate",
        action: "regen-pair",
        model: MODEL_MINI,
        prompt_tokens: usage?.prompt_tokens || null,
        completion_tokens: usage?.completion_tokens || null,
        total_tokens: usage?.total_tokens || null,
        ms: Date.now() - t0,
        key: cacheKey,
      });
      return NextResponse.json({ question: parsed.question, answer: parsed.answer, cached: false });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Regeneration failed" }, { status: 500 });
  }
}