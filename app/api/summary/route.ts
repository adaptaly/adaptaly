// app/api/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/src/lib/supabaseServer";
import { aimlapi, createLocalSummary, createLocalFlashcards } from "@/app/lib/aimlapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Flashcard = { question: string; answer: string; hint?: string };

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

    // 4) Generate summary and flashcards using new AIMLAPI client
    let summary: string;
    let flashcards: Flashcard[];

    console.log("🤖 Summary API: Starting AI generation for document:", {
      documentId,
      filename: doc.filename,
      textLength: rawText.length,
      isConfigured: aimlapi.isConfigured()
    });

    if (aimlapi.isConfigured()) {
      console.log("✅ AIMLAPI is configured - calling generateSummary");
      try {
        const result = await aimlapi.generateSummary(rawText, doc.filename || "document");
        summary = result.summary;
        flashcards = result.flashcards;
        console.log("✅ AIMLAPI succeeded - got summary and flashcards:", {
          summaryLength: summary.length,
          flashcardsCount: flashcards.length
        });
      } catch (error) {
        console.error("❌ AIMLAPI failed, using local fallback:", error);
        // Fallback to local summarizer
        summary = createLocalSummary(rawText, 1300);
        flashcards = createLocalFlashcards(summary, 8);
        console.log("⚠️ Using local fallback:", {
          summaryLength: summary.length,
          flashcardsCount: flashcards.length
        });
      }
    } else {
      console.warn("⚠️ AIMLAPI is NOT configured - using local fallback only");
      summary = createLocalSummary(rawText, 1300);
      flashcards = createLocalFlashcards(summary, 8);
      console.log("📝 Local fallback generated:", {
        summaryLength: summary.length,
        flashcardsCount: flashcards.length
      });
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

