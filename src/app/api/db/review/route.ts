import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getUserOrDeviceId } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Grade = "good" | "again";
type Body = {
  cardId: string;
  deckId?: string | null;
  grade: Grade;
};

export async function POST(req: NextRequest) {
  try {
    const { cardId, deckId = null, grade } = (await req.json()) as Body;

    if (!cardId) {
      return NextResponse.json({ error: "cardId is required" }, { status: 400 });
    }
    if (grade !== "good" && grade !== "again") {
      return NextResponse.json({ error: 'grade must be "good" or "again"' }, { status: 400 });
    }

    const supa = supabaseServer();
    const { userId, deviceId } = await getUserOrDeviceId();
    if (!userId && !deviceId) {
      return NextResponse.json({ error: "No identity (user/device) found" }, { status: 400 });
    }
    const ownerFilter = userId ? { user_id: userId } : { device_id: deviceId as string };

    // Read existing progress (if any)
    const { data: existing, error: selErr } = await supa
      .from("card_progress")
      .select("id, box")
      .eq("card_id", cardId)
      .match(ownerFilter)
      .maybeSingle();

    if (selErr && (selErr as any).code !== "PGRST116") {
      // PGRST116 = no rows
      return NextResponse.json({ error: selErr.message }, { status: 500 });
    }

    // Spaced-repetition step
    const prevBox = existing?.box ?? 1;
    const nextBox = grade === "good" ? Math.min(5, prevBox + 1) : 1;

    // Intervals per box (days). Box 1 -> 0d (learn), 2 -> 1d, 3 -> 3d, 4 -> 7d, 5 -> 14d
    const intervals = [0, 0, 1, 3, 7, 14];
    const now = Date.now();
    const millis =
      grade === "again"
        ? 10 * 60 * 1000 // 10 minutes
        : (intervals[nextBox] ?? 1) * 24 * 60 * 60 * 1000;

    const dueAt = new Date(now + millis).toISOString();

    if (existing?.id) {
      const { error: upErr } = await supa
        .from("card_progress")
        .update({ box: nextBox, due_at: dueAt })
        .eq("id", existing.id)
        .match(ownerFilter);
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    } else {
      const row = {
        card_id: cardId,
        deck_id: deckId,
        ...ownerFilter,
        box: nextBox,
        due_at: dueAt,
      };
      const { error: insErr } = await supa.from("card_progress").insert(row);
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, nextDueAt: dueAt });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Review failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}