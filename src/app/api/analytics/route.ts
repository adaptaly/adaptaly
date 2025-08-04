import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    // Minimal MVP server logger (replace with your analytics later)
    // eslint-disable-next-line no-console
    console.log("[analytics]", {
      event: body?.event ?? "unknown",
      props: body?.props ?? {},
      at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}