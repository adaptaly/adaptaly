// app/api/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/src/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Flashcard = { question: string; answer: string; hint?: string };

const AIMLAPI_BASE = process.env.AIMLAPI_BASE_URL?.replace(/\/+$/, "") || "https://api.aimlapi.com";
const AIMLAPI_MODEL = process.env.AIMLAPI_MODEL || "gpt-4o";
const TIMEOUT_MS = 45_000;
const CHUNK_SIZE = 6_000;

export async function POST(req: NextRequest) {
  try {
    const { documentId } = (await req.json()) as { documentId?: string };

    if (!documentId || typeof documentId !== "string") {
      return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
    }

    const supabase = await createServerClient();

    // 1) Load the document and check if it's ready
    const { data: doc, error: docErr } = await supabase
      .from("documents")
      .select("id,filename,status,storage_path,storage_bucket")
      .eq("id", documentId)
      .single();

    if (docErr || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (doc.status !== "ready") {
      return NextResponse.json({ error: "Document not ready for processing" }, { status: 400 });
    }

    // 2) Check if summary already exists
    const { data: existingSummary } = await supabase
      .from("summaries")
      .select("id,content")
      .eq("document_id", documentId)
      .single();

    if (existingSummary) {
      const { data: flashcards } = await supabase
        .from("flashcards")
        .select("question,answer,hint")
        .eq("document_id", documentId)
        .order("created_at");

      return NextResponse.json({
        summary: existingSummary.content,
        flashcards: flashcards || [],
        filename: doc.filename,
      });
    }

    // 3) Download clean text
    const bucket = doc.storage_bucket || "uploads";
    const storagePath = doc.storage_path;
    if (!storagePath) {
      return NextResponse.json({ error: "Missing storage path" }, { status: 400 });
    }

    const lastSlash = storagePath.lastIndexOf("/");
    const baseDir = lastSlash >= 0 ? storagePath.slice(0, lastSlash) : "";
    const cleanPath = baseDir ? `${baseDir}/clean.txt` : `${documentId}/clean.txt`;

    const downloadRes = await supabase.storage.from(bucket).download(cleanPath);
    if (downloadRes.error) {
      return NextResponse.json({ error: "Could not access processed text" }, { status: 500 });
    }

    const rawText = await downloadRes.data.text();

    // 4) Generate summary and flashcards
    const apiKey = process.env.AIMLAPI_KEY;
    let summary: string;
    let flashcards: Flashcard[];

    if (apiKey) {
      try {
        const result = await summarizeWithAIMLAPI(rawText, doc.filename || "document");
        summary = result.summary;
        flashcards = result.flashcards;
      } catch {
        // Fallback to local summarizer
        summary = localSummary(rawText, 1300);
        flashcards = localFlashcards(summary, 8);
      }
    } else {
      summary = localSummary(rawText, 1300);
      flashcards = localFlashcards(summary, 8);
    }

    // 5) Store summary in database
    const { data: summaryData, error: summaryErr } = await supabase
      .from("summaries")
      .insert({
        document_id: documentId,
        content: summary,
        word_count: summary.split(/\s+/).length,
      })
      .select("id")
      .single();

    if (summaryErr) {
      return NextResponse.json({ error: "Failed to save summary" }, { status: 500 });
    }

    // 6) Store flashcards in database
    if (flashcards.length > 0) {
      const flashcardInserts = flashcards.map((card, index) => ({
        document_id: documentId,
        summary_id: summaryData.id,
        question: card.question,
        answer: card.answer,
        hint: card.hint || null,
        order_index: index,
      }));

      const { error: flashcardErr } = await supabase
        .from("flashcards")
        .insert(flashcardInserts);

      if (flashcardErr) {
        console.error("Failed to save flashcards:", flashcardErr);
        return NextResponse.json({ 
          error: "Summary generated but failed to save flashcards", 
          details: flashcardErr.message 
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      summary,
      flashcards,
      filename: doc.filename,
    });
  } catch (err: unknown) {
    console.error("Summary route error:", err);
    const msg = err instanceof Error ? err.message : "Unexpected error during summarization.";
    return NextResponse.json({ 
      error: msg,
      details: err instanceof Error ? err.stack : undefined
    }, { status: 500 });
  }
}

// Local fallback functions
function localSummary(text: string, maxChars = 1300) {
  const cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
  if (cleaned.length <= maxChars) return cleaned;
  const slice = cleaned.slice(0, maxChars);
  const lastSentence = Math.max(
    slice.lastIndexOf("."),
    slice.lastIndexOf("!"),
    slice.lastIndexOf("?")
  );
  return (lastSentence > 300 ? slice.slice(0, lastSentence + 1) : slice) + " …";
}

function localFlashcards(summary: string, maxCards: number): Flashcard[] {
  const sentences = summary
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40 && s.length <= 240);
  return sentences.slice(0, maxCards).map((s, i) => ({
    question: `What is the key point #${i + 1}?`,
    answer: s,
  }));
}

// AI-powered summarization
async function summarizeWithAIMLAPI(text: string, filename: string) {
  const chunks = chunkText(text, CHUNK_SIZE);

  // Map: summarize each chunk to bullets
  const bullets: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const out = await aimlapiChat(
      [
        {
          role: "system",
          content: "You summarize text into short, factual bullet points. Use concise, plain language.",
        },
        {
          role: "user",
          content: `TEXT (part ${i + 1}/${chunks.length}, from ${filename}):\n\n${
            chunks[i]
          }\n\nWrite 3-6 concise bullets capturing key points. Output plain bullets, no numbering.`,
        },
      ],
      { temperature: 0.2 }
    );
    out
      .split(/\n+/)
      .map((l) => l.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean)
      .forEach((b) => bullets.push(b));
  }

  // Reduce: produce final summary & flashcards
  const finalJsonText = await aimlapiChat(
    [
      {
        role: "system",
        content: "You are an assistant that returns STRICT JSON. No markdown fences, no commentary.",
      },
      {
        role: "user",
        content:
          `From the following bullet points, create:\n` +
          `1) "summary": a readable 6–10 bullet summary (single string with line breaks),\n` +
          `2) "flashcards": an array of up to 12 objects { "question": string, "answer": string, "hint"?: string } aimed at recall.\n\n` +
          `Constraints:\n- Be faithful to the bullets\n- Keep answers short (1–3 sentences)\n- JSON only.\n\n` +
          `BULLETS:\n` +
          bullets.map((b) => `- ${b}`).join("\n"),
      },
      {
        role: "user",
        content:
          `Return JSON EXACTLY like:\n` +
          `{"summary":"...","flashcards":[{"question":"...","answer":"...","hint":"..."},{"question":"...","answer":"..."}]}`,
      },
    ],
    { temperature: 0.2 }
  );

  const parsed = safeJson<{ summary: string; flashcards: Flashcard[] }>(
    finalJsonText,
    { summary: localSummary(bullets.join("\n"), 1300), flashcards: [] }
  );

  return parsed;
}

async function aimlapiChat(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  opts?: { temperature?: number }
): Promise<string> {
  const apiKey = process.env.AIMLAPI_KEY!;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${AIMLAPI_BASE}/v1/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AIMLAPI_MODEL,
        temperature: opts?.temperature ?? 0.2,
        messages,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AIMLAPI error ${res.status}: ${text || res.statusText}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data?.choices?.[0]?.message?.content?.trim() ?? "";
    if (!content) throw new Error("Empty completion from AIMLAPI.");
    return content;
  } finally {
    clearTimeout(t);
  }
}

function chunkText(s: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
  return out;
}

function safeJson<T>(raw: string, fallback: T): T {
  const cleaned = raw
    .replace(/```json\s*([\s\S]*?)```/gi, "$1")
    .replace(/```([\s\S]*?)```/gi, "$1")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}