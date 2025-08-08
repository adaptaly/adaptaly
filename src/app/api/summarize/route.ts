import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* --------------------------- Types & constants --------------------------- */

type Flashcard = { question: string; answer: string };

const SERVER_FILE_LIMIT = 10 * 1024 * 1024; // 10MB
const MAX_CHARS = 200_000;
const CHUNK_SIZE = 6_000;
const TIMEOUT_MS = 45_000;

const AIMLAPI_BASE =
  process.env.AIMLAPI_BASE_URL?.replace(/\/+$/, "") || "https://api.aimlapi.com";
const AIMLAPI_MODEL = process.env.AIMLAPI_MODEL || "gpt-4o";

/* ------------------------------ Route: POST ------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (file.size > SERVER_FILE_LIMIT) {
      return NextResponse.json(
        { error: "File is too large for the server limit (10MB)." },
        { status: 413 }
      );
    }

    const filename = file.name || "document";
    const mime = file.type || "application/octet-stream";
    const buf = Buffer.from(await file.arrayBuffer());

    // ✅ Proper text extraction for TXT, PDF, DOCX
    const rawText = await extractText(buf, filename, mime);
    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "Could not read text content from the file." },
        { status: 422 }
      );
    }

    const apiKey = process.env.AIMLAPI_KEY;
    if (apiKey) {
      try {
        const result = await summarizeWithAIMLAPI(rawText, filename);
        return NextResponse.json({
          summary: result.summary,
          flashcards: result.flashcards,
          filename,
        });
      } catch {
        // Fallback to local summarizer if AIMLAPI fails
        const summary = localSummary(rawText, 1300);
        const flashcards = localFlashcards(summary, 8);
        return NextResponse.json({
          summary,
          flashcards,
          filename,
          note: "Used local fallback due to AI error.",
        });
      }
    } else {
      // No API key -> local summarization
      const summary = localSummary(rawText, 1300);
      const flashcards = localFlashcards(summary, 8);
      return NextResponse.json({ summary, flashcards, filename });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unexpected error during summarize.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ----------------------------- Text extraction --------------------------- */

async function extractText(buf: Buffer, filename: string, mime: string) {
  const lower = (filename || "").toLowerCase();

  // Plain text / markdown
  if (mime === "text/plain" || lower.endsWith(".txt") || lower.endsWith(".md")) {
    return new TextDecoder("utf-8", { fatal: false }).decode(buf).slice(0, MAX_CHARS);
  }

  // DOCX via mammoth
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    try {
      const mammoth = await import("mammoth");
      const res = await mammoth.extractRawText({ buffer: buf });
      return (res.value || "").slice(0, MAX_CHARS);
    } catch (e) {
      // fall through to best-effort decode
    }
  }

  // PDF via pdf-parse
  if (mime === "application/pdf" || lower.endsWith(".pdf")) {
    try {
      // pdf-parse default export is a function
      const pdfParse = (await import("pdf-parse")).default as unknown as (
        data: Buffer
      ) => Promise<{ text: string }>;
      const data = await pdfParse(buf);
      return (data.text || "").slice(0, MAX_CHARS);
    } catch (e) {
      // fall through to best-effort decode
    }
  }

  // Best-effort fallback (in case libs are missing or file is unusual)
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
  const sniff = text.trim();
  return sniff ? sniff.slice(0, MAX_CHARS) : "";
}

/* --------------------------- Local (fallback) NL -------------------------- */

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

/* ------------------------------ AIMLAPI calls ---------------------------- */

async function summarizeWithAIMLAPI(text: string, filename: string) {
  const chunks = chunkText(text, CHUNK_SIZE);

  // 1) Map: summarize each chunk to 3–6 bullets
  const bullets: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const out = await aimlapiChat(
      [
        {
          role: "system",
          content:
            "You summarize text into short, factual bullet points. Use concise, plain language.",
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

  // 2) Reduce: produce final summary & flashcards in strict JSON
  const finalJsonText = await aimlapiChat(
    [
      {
        role: "system",
        content:
          "You are an assistant that returns STRICT JSON. No markdown fences, no commentary.",
      },
      {
        role: "user",
        content:
          `From the following bullet points, create:\n` +
          `1) "summary": a readable 6–10 bullet summary (single string with line breaks),\n` +
          `2) "flashcards": an array of up to 12 objects { "question": string, "answer": string } aimed at recall.\n\n` +
          `Constraints:\n- Be faithful to the bullets\n- Keep answers short (1–3 sentences)\n- JSON only.\n\n` +
          `BULLETS:\n` +
          bullets.map((b) => `- ${b}`).join("\n"),
      },
      {
        role: "user",
        content:
          `Return JSON EXACTLY like:\n` +
          `{"summary":"...","flashcards":[{"question":"...","answer":"..."},{"question":"...","answer":"..."}]}`,
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

    const content =
      data?.choices?.[0]?.message?.content?.trim() ?? "";
    if (!content) throw new Error("Empty completion from AIMLAPI.");
    return content;
  } finally {
    clearTimeout(t);
  }
}

/* --------------------------------- utils -------------------------------- */

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