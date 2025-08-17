// app/api/uploads/init/route.ts
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

// Keep using your server Supabase helper (awaitable)
import { createServerClient } from "@/src/lib/supabaseServer";

type Body = {
  filename?: string;
  size?: number;
  mime?: string;
  userId?: string;
};

function isSupportedMime(m: string | undefined | null) {
  return (
    m === "application/pdf" ||
    m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    m === "text/plain"
  );
}
function isMarkdownMime(m: string | undefined | null) {
  return m === "text/markdown";
}

export async function POST(req: NextRequest) {
  try {
    const { filename, size, mime, userId } = (await req.json()) as Body;

    if (!filename || typeof filename !== "string" || !mime || typeof mime !== "string" || !userId || typeof userId !== "string") {
      return NextResponse.json({ ok: false, error: "filename, mime, and userId are required" }, { status: 400 });
    }

    // Client guard parity (server-side)
    if (isMarkdownMime(mime) || !isSupportedMime(mime)) {
      return NextResponse.json(
        { ok: false, error: "Unsupported file type. Upload PDF, DOCX, or TXT." },
        { status: 400 }
      );
    }
    if (typeof size === "number" && size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "File exceeds 15 MB limit." },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Create documents row in "uploading" state
    const insertRes = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        filename,
        mime,
        size_bytes: size ?? null,
        status: "uploading",
        error_message: null,
      })
      .select("id")
      .single();

    if (insertRes.error || !insertRes.data) {
      console.error("Database insert error:", insertRes.error);
      return NextResponse.json({ 
        ok: false, 
        error: "Failed to create document",
        details: insertRes.error?.message || "Unknown database error",
        supabaseError: insertRes.error
      }, { status: 500 });
    }

    const documentId = insertRes.data.id as string;

    // Shape the Storage path so it satisfies your RLS:
    // uploads/<uid>/<documentId>/<original filename>
    const bucket = "uploads";
    const storagePath = `${userId}/${documentId}/${filename}`;

    // Persist the path for later (used by /complete)
    const upd = await supabase
      .from("documents")
      .update({ storage_path: storagePath, storage_bucket: bucket })
      .eq("id", documentId);

    if (upd.error) {
      console.error("Database update error:", upd.error);
      return NextResponse.json({ 
        ok: false, 
        error: "Failed to persist storage path",
        details: upd.error?.message || "Unknown update error",
        supabaseError: upd.error
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      documentId,
      bucket,
      path: storagePath,
    });
  } catch (e) {
    console.error("uploads/init error:", e);
    const errorMessage = e instanceof Error ? e.message : "Unknown server error";
    return NextResponse.json({ 
      ok: false, 
      error: "Server error", 
      details: errorMessage,
      stack: e instanceof Error ? e.stack : undefined
    }, { status: 500 });
  }
}