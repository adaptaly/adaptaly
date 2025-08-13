import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { filename: string; size: number; mime: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const { filename, size, mime } = body || {};

    if (!filename || typeof filename !== "string") {
      return NextResponse.json({ ok: false, error: "Missing filename" }, { status: 400 });
    }
    if (!Number.isFinite(size) || size <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid size" }, { status: 400 });
    }
    if (!mime || typeof mime !== "string") {
      return NextResponse.json({ ok: false, error: "Missing mime" }, { status: 400 });
    }
    // Basic client-sent validation hardening
    const extOk = /\.(pdf|docx|txt)$/i.test(filename);
    if (!extOk) {
      return NextResponse.json({ ok: false, error: "Only PDF, DOCX, TXT are supported" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ ok: false, error: "Server misconfigured" }, { status: 500 });
    }

    // Next.js 15: cookies() is async
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

    const { data: userInfo, error: userErr } = await admin.auth.getUser(accessToken);
    if (userErr || !userInfo?.user) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }
    const userId = userInfo.user.id;

    const safeName = filename.replace(/[^\w.\-]+/g, "_").slice(0, 120);
    const documentId = randomUUID();
    const objectPath = `${userId}/${documentId}/${safeName}`;

    // Create documents row
    const { error: insertErr } = await admin
      .from("documents")
      .insert({
        id: documentId,
        user_id: userId,
        filename: safeName,
        mime,
        size_bytes: size,
        status: "uploading",
      } as any);
    if (insertErr) {
      return NextResponse.json({ ok: false, error: "Failed to create document" }, { status: 500 });
    }

    // Create signed upload URL (Supabase Storage)
    const { data: signed, error: signErr } = await admin.storage
      .from("uploads")
      .createSignedUploadUrl(objectPath, { upsert: false });

    if (signErr || !signed?.signedUrl) {
      return NextResponse.json({ ok: false, error: "Could not create upload URL" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      documentId,
      path: objectPath,
      uploadUrl: signed.signedUrl,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Unexpected error" }, { status: 500 });
  }
}