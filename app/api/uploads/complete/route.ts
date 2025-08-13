// Update
// app/api/uploads/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/src/lib/supabaseServer";
import { extractPdf } from "@/src/lib/extractors/pdf";
import { extractDocx } from "@/src/lib/extractors/docx";
import { cleanText } from "@/src/lib/cleanText";

type DocRow = {
  id: string;
  user_id: string | null;
  bucket: string | null;
  object_path: string | null;
  status: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  page_count: number | null;
  cleaned_text: string | null;
  error_message: string | null;
};

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_PAGES = 60;

export async function POST(req: NextRequest) {
  // cookies() is async in your env, so our helper is async too.
  const supabase = await createServerClient();

  try {
    const body = await req.json().catch(() => ({} as any));
    const docId: string | undefined =
      body?.docId ?? new URL(req.url).searchParams.get("id") ?? undefined;

    if (!docId) {
      return NextResponse.json({ ok: false, error: "Missing docId." }, { status: 400 });
    }

    // Load document row to find storage target
    const res = await supabase.from("documents").select("*").eq("id", docId).single();
    const doc = res.data as DocRow | null;
    const docErr = res.error;

    if (docErr || !doc) {
      return NextResponse.json({ ok: false, error: "Document not found." }, { status: 404 });
    }

    if (!doc.bucket || !doc.object_path) {
      return NextResponse.json({ ok: false, error: "Document storage path missing." }, { status: 422 });
    }

    // Server side size check
    if (doc.size_bytes && doc.size_bytes > MAX_BYTES) {
      await markError(supabase, docId, "File exceeds 15 MB limit.");
      return NextResponse.json({ ok: false, error: "File exceeds 15 MB limit." }, { status: 413 });
    }

    // Download bytes from Supabase Storage
    const dl = await supabase.storage.from(doc.bucket).download(doc.object_path);
    if (dl.error || !dl.data) {
      await markError(supabase, docId, "Could not read uploaded file.");
      return NextResponse.json({ ok: false, error: "Could not read uploaded file." }, { status: 500 });
    }

    const buf = Buffer.from(await dl.data.arrayBuffer());

    // Determine type
    const lower = doc.object_path.toLowerCase();
    const ext = lower.split(".").pop() || "";
    const mime = (doc.mime_type || "").toLowerCase();

    let rawText = "";
    let pageCount: number | null = null;

    if (ext === "pdf" || mime.includes("pdf")) {
      const { text, pages } = await extractPdf(buf);
      rawText = text;
      pageCount = pages;

      if (typeof pageCount === "number" && pageCount > MAX_PAGES) {
        await markError(supabase, docId, `PDF has ${pageCount} pages. Limit is ${MAX_PAGES}.`);
        return NextResponse.json(
          { ok: false, error: `PDF has ${pageCount} pages. Limit is ${MAX_PAGES}.` },
          { status: 422 }
        );
      }
    } else if (ext === "docx" || mime.includes("wordprocessingml")) {
      const text = await extractDocx(buf);
      rawText = text;

      const est = estimatePages(rawText);
      pageCount = est;
      if (est > MAX_PAGES) {
        await markError(supabase, docId, `Document is about ${est} pages. Limit is ${MAX_PAGES}.`);
        return NextResponse.json(
          { ok: false, error: `Document is about ${est} pages. Limit is ${MAX_PAGES}.` },
          { status: 422 }
        );
      }
    } else if (ext === "txt" || mime.includes("text/plain")) {
      rawText = buf.toString("utf8");
      const est = estimatePages(rawText);
      pageCount = est;
      if (est > MAX_PAGES) {
        await markError(supabase, docId, `Text is about ${est} pages. Limit is ${MAX_PAGES}.`);
        return NextResponse.json(
          { ok: false, error: `Text is about ${est} pages. Limit is ${MAX_PAGES}.` },
          { status: 422 }
        );
      }
    } else {
      await markError(supabase, docId, "Unsupported file type. Use PDF, DOCX, or TXT.");
      return NextResponse.json(
        { ok: false, error: "Unsupported file type. Use PDF, DOCX, or TXT." },
        { status: 415 }
      );
    }

    // Clean the text
    const cleaned = cleanText(rawText, { maxLength: 1_000_000 });

    // Save result — Step 2 ends at "cleaned"
    const { error: upErr } = await supabase
      .from("documents")
      .update({
        status: "cleaned",
        page_count: pageCount,
        cleaned_text: cleaned,
        error_message: null,
      })
      .eq("id", docId);

    if (upErr) {
      await markError(supabase, docId, "Failed to save cleaned text.");
      return NextResponse.json({ ok: false, error: "Failed to save cleaned text." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: docId, status: "cleaned", pageCount });
  } catch (err: any) {
    const msg = toFriendlyError(err?.message || String(err));
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

function estimatePages(text: string): number {
  const chars = (text || "").trim().length;
  if (!chars) return 0;
  return Math.max(1, Math.ceil(chars / 1800));
}

async function markError(supabase: any, id: string, message: string) {
  await supabase.from("documents").update({ status: "error", error_message: message }).eq("id", id);
}

function toFriendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("password") || m.includes("encrypted")) {
    return "This file seems to be password locked. Please remove the password and try again.";
  }
  if (m.includes("unsupported") || m.includes("not a valid")) {
    return "This file looks corrupted or unsupported. Try exporting it again and re-upload.";
  }
  return "Something went wrong while processing the file. Please try again.";
}