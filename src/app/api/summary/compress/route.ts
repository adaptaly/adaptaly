import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai"; // uses AIML_API_*
import { sha256Hex } from "@/lib/hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL_MINI = process.env.MODEL_MINI || "gpt-4o-mini";

/** Lazy import Supabase admin client; return null if not available or throws */
async function getSupabaseSafe():
  Promise<null | { from: (table: string) => any }>
{
  try {
    // dynamic import avoids top-level throw if env vars are missing
    const mod = await import("@/lib/supabaseAdmin");
    return (mod as any).supabaseAdmin ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const { summary } = await req.json();
    const raw = String(summary || "").trim();
    if (!raw) {
      return NextResponse.json({ error: "summary is required" }, { status: 400 });
    }

    const sumHash = sha256Hex(raw);
    const cacheKey = `compress:v1:${sumHash}`;

    // Try cache (if Supabase configured)
    const supa = await getSupabaseSafe();
    if (supa) {
      const { data: cached, error: cErr } = await (supa as any)
        .from("ai_cache")
        .select("result")
        .eq("key", cacheKey)
        .maybeSingle();
      if (!cErr && cached?.result?.compressed) {
        return NextResponse.json({ compressed: cached.result.compressed, key: cacheKey, cached: true });
      }
    }

    const system =
      "You compress study notes for flashcard generation. Output <=300 tokens, bullet-y, keep key terminology, formulas, names. No preface.";
    const { text, usage } = await chatCompletion({
      model: MODEL_MINI,
      system,
      messages: [{ role: "user", content: raw }],
      max_tokens: 350,
      stop: ["\n\n---"],
      temperature: 0.2,
    });

    const compressed = text.trim();

    // Write cache + usage if Supabase is available
    if (supa) {
      await (supa as any).from("ai_cache").upsert({
        key: cacheKey,
        model: MODEL_MINI,
        input_hash: sumHash,
        params: { kind: "compress", max_tokens: 350 },
        result: { compressed },
      });

      await (supa as any).from("usage_logs").insert({
        route: "/api/summary/compress",
        action: "compress",
        model: MODEL_MINI,
        prompt_tokens: usage?.prompt_tokens || null,
        completion_tokens: usage?.completion_tokens || null,
        total_tokens: usage?.total_tokens || null,
        ms: Date.now() - t0,
        key: cacheKey,
      });
    }

    return NextResponse.json({ compressed, key: cacheKey, cached: false });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Compression failed" }, { status: 500 });
  }
}