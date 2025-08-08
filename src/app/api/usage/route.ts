import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_ACCESS_TOKEN = process.env.ADMIN_ACCESS_TOKEN || "";

function parseIntOr<T extends number>(s: string | null, def: T): number {
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : def;
}

export async function GET(req: NextRequest) {
  try {
    // simple header auth
    const hdr = req.headers.get("x-admin-key") || "";
    if (!ADMIN_ACCESS_TOKEN || hdr !== ADMIN_ACCESS_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseIntOr(searchParams.get("days"), 7); // default 7d
    const limit = Math.min(parseIntOr(searchParams.get("limit"), 1000), 5000);
    const action = (searchParams.get("action") || "").trim().toLowerCase(); // optional filter
    const route = (searchParams.get("route") || "").trim();

    const since = new Date();
    if (String(days).toLowerCase() !== "all") {
      since.setDate(since.getDate() - days);
    } else {
      // effectively "all time" – no since filter
    }

    let q = supabaseAdmin
      .from("usage_logs")
      .select("route, action, model, prompt_tokens, completion_tokens, total_tokens, ms, key, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (String(days).toLowerCase() !== "all") {
      q = q.gte("created_at", since.toISOString());
    }
    if (action) q = q.eq("action", action);
    if (route) q = q.eq("route", route);

    const { data, error } = await q;
    if (error) throw error;

    return NextResponse.json({ logs: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load usage logs" }, { status: 500 });
  }
}