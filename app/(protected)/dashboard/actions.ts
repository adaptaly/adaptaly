// app/(protected)/dashboard/actions.ts
"use server";

import { getBaseUrl } from "@/src/lib/urls";
import { revalidateTag } from "next/cache";

type EventPayload = {
  name: string;
  userId?: string;
  context?: Record<string, unknown>;
};

export async function recordEvent(input: EventPayload) {
  try {
    const res = await fetch(`${getBaseUrl()}/api/telemetry`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      // avoid blocking UI
      cache: "no-store",
    });
    if (!res.ok) {
      // soft fail
      console.warn("telemetry failed", await res.text());
    }
  } catch (e) {
    console.warn("telemetry error", e);
  }
}

export async function revalidateSummary(userId: string) {
  revalidateTag(`dashboard:summary:${userId}`);
}

export async function revalidatePacks(userId: string) {
  revalidateTag(`dashboard:packs:${userId}`);
}