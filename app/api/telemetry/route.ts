// app/api/telemetry/route.ts
import { NextResponse } from "next/server";

// Minimal, privacy friendly no-op. You can wire to Supabase later.
export async function POST() {
  return new NextResponse(null, { status: 204 });
}