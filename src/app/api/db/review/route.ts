import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { nextBoxAndDue } from "@/lib/srs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { deviceId, cardId, result } = (await req.json()) as {
      deviceId: string;
      cardId: string;
      result: "correct" | "wrong";
    };

    if (!deviceId || !cardId || !["correct", "wrong"].includes(result)) {
      return NextResponse.json({ error: "deviceId, cardId, result required" }, { status: 400 });
    }

    const { data: prog, error: progErr } = await supabaseAdmin
      .from("card_progress")
      .select("id, box")
      .eq("device_id", deviceId)
      .eq("card_id", cardId)
      .single();

    if (progErr || !prog) throw new Error("Progress not found");

    const { box, dueAt } = nextBoxAndDue(prog.box as number, result);

    const { error: updErr } = await supabaseAdmin
      .from("card_progress")
      .update({ box, due_at: dueAt, last_result: result, updated_at: new Date().toISOString() })
      .eq("id", prog.id);

    if (updErr) throw updErr;

    const { error: logErr } = await supabaseAdmin
      .from("reviews")
      .insert({ device_id: deviceId, card_id: cardId, result, box_after: box });

    if (logErr) throw logErr;

    return NextResponse.json({ box, dueAt });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Review failed" }, { status: 500 });
  }
}