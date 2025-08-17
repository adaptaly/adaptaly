import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

import { extractPdf } from "@/src/lib/extractors/pdf";
import { extractDocx } from "@/src/lib/extractors/docx";
import { cleanText } from "@/src/lib/cleanText";

// Your Supabase helper is here in your repo
import { createServerClient } from "@/src/lib/supabaseServer";

type DocRow = {
  id: string;
  user_id: string | null;
  filename: string | null;
  mime: string | null;
  size_bytes: number | null;
  status: "uploading" | "processing" | "ready" | "error";
  page_count: number | null;
  storage_path: string | null;
  storage_bucket?: string | null;
};

function isSupportedMime(m: string | null): boolean {
  if (!m) return false;
  if (m === "application/pdf") return true;
  if (m === "text/plain") return true;
  if (m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return true;
  return false;
}

function isMarkdownMime(m: string | null): boolean {
  if (!m) return false;
  return m.includes("markdown") || m === "text/markdown";
}

export async function POST(req: NextRequest) {
  try {
    const { documentId } = (await req.json()) as { documentId?: string };

    if (!documentId || typeof documentId !== "string") {
      return NextResponse.json({ ok: false, error: "Missing documentId" }, { status: 400 });
    }

    // FIX: await the async client factory
    const supabase = await createServerClient();

    // 1) Load the document row
    const { data: doc, error: docErr } = await supabase
      .from("documents")
      .select(
        "id,user_id,filename,mime,size_bytes,status,page_count,storage_path,storage_bucket"
      )
      .eq("id", documentId)
      .single<DocRow>();

    if (docErr || !doc) {
      return NextResponse.json({ ok: false, error: "Document not found" }, { status: 404 });
    }

    // 2) Mark processing
    await supabase
      .from("documents")
      .update({ status: "processing" })
      .eq("id", documentId);

    // 3) Validate MIME on server
    if (isMarkdownMime(doc.mime) || !isSupportedMime(doc.mime)) {
      await supabase
        .from("documents")
        .update({ status: "error" })
        .eq("id", documentId);
      return NextResponse.json({ ok: false, error: "Unsupported file type" }, { status: 400 });
    }

    // 4) Resolve storage bucket and path
    const bucket = doc.storage_bucket || "uploads";
    const storagePath = doc.storage_path;
    if (!storagePath) {
      await supabase
        .from("documents")
        .update({ status: "error" })
        .eq("id", documentId);
      return NextResponse.json({ ok: false, error: "Missing storage path" }, { status: 400 });
    }

    // 5) Download original file bytes
    const downloadRes = await supabase.storage.from(bucket).download(storagePath);
    if (downloadRes.error) {
      await supabase
        .from("documents")
        .update({ status: "error" })
        .eq("id", documentId);
      return NextResponse.json({ ok: false, error: "Download failed" }, { status: 500 });
    }

    const arrayBuffer = await downloadRes.data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6) Extract text
    let rawText = "";
    let pageCount: number | null = null;

    if (doc.mime === "application/pdf") {
      const pdf = await extractPdf(buffer);
      rawText = pdf.text;
      pageCount = typeof pdf.pageCount === "number" ? pdf.pageCount : 0;

      // Enforce the 60-page cap after parsing
      if (pageCount !== null && pageCount > 60) {
        await supabase
          .from("documents")
          .update({
            status: "error",
            page_count: pageCount,
          })
          .eq("id", documentId);
        return NextResponse.json({ ok: false, error: "Your PDF has more than 60 pages after parsing. Please upload a shorter PDF or split it." }, { status: 400 });
      }
    } else if (doc.mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const docx = await extractDocx(buffer);
      rawText = docx.text;
    } else if (doc.mime === "text/plain") {
      rawText = buffer.toString("utf-8");
    } else {
      await supabase
        .from("documents")
        .update({ status: "error" })
        .eq("id", documentId);
      return NextResponse.json({ ok: false, error: "Unsupported file type. Please upload PDF, DOCX, or TXT." }, { status: 400 });
    }

    if (!rawText || rawText.trim().length === 0) {
      await supabase
        .from("documents")
        .update({ status: "error" })
        .eq("id", documentId);
      return NextResponse.json({ ok: false, error: "We could not extract text from this file. If it is a scanned PDF, try exporting a text-based PDF." }, { status: 422 });
    }

    // 7) Clean text
    const cleaned = cleanText(rawText);

    // 8) Persist: update page_count if available
    await supabase
      .from("documents")
      .update({
        page_count: pageCount
      })
      .eq("id", documentId);

    // 9) Store cleaned text alongside the original, as clean.txt in the same folder
    const lastSlash = storagePath.lastIndexOf("/");
    const baseDir = lastSlash >= 0 ? storagePath.slice(0, lastSlash) : "";
    const cleanPath = baseDir ? `${baseDir}/clean.txt` : `${documentId}/clean.txt`;

    const uploadClean = await supabase.storage.from(bucket).upload(cleanPath, cleaned, {
      contentType: "text/plain; charset=utf-8",
      upsert: true
    });

    if (uploadClean.error) {
      await supabase
        .from("documents")
        .update({ status: "error" })
        .eq("id", documentId);
      return NextResponse.json({ ok: false, error: "Text was extracted but saving the cleaned text failed. Please try again." }, { status: 500 });
    }

    // 10) Mark ready to keep Step 1 redirect behavior
    await supabase
      .from("documents")
      .update({ status: "ready" })
      .eq("id", documentId);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("complete route error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ 
      ok: false, 
      error: "Server error", 
      details: errorMessage,
      stack: err instanceof Error ? err.stack : undefined
    }, { status: 500 });
  }
}