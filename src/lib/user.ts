import { cookies as nextCookies, headers as nextHeaders } from "next/headers";
import { supabaseServer } from "./supabaseServer";

/**
 * Returns { userId, deviceId }:
 * - If authenticated (Supabase), userId is set and deviceId is null
 * - Otherwise, reads "adaptaly-device" from cookies (with multiple runtimes compatibility)
 */
export async function getUserOrDeviceId() {
  // 1) Try Supabase user first
  const supa = supabaseServer();
  const { data } = await supa.auth.getUser();
  if (data.user) {
    return { userId: data.user.id as string, deviceId: null };
  }

  // 2) Anonymous device: read cookie in a runtime-agnostic way
  let deviceId: string | null = null;

  // Some Next typings expose cookies() synchronously, others as a Promise.
  try {
    const ckMaybe = (nextCookies as any)(); // could be ReadonlyRequestCookies or Promise<ReadonlyRequestCookies>
    const ck = typeof ckMaybe?.get === "function" ? ckMaybe : await ckMaybe;
    deviceId = ck?.get?.("adaptaly-device")?.value ?? null;
  } catch {
    // ignore; we’ll try headers() below
  }

  // Fallback: parse Cookie header manually if needed
  if (!deviceId) {
    try {
      const hMaybe = (nextHeaders as any)();
      const h = typeof hMaybe?.get === "function" ? hMaybe : await hMaybe;
      const cookieHeader: string | null = h?.get?.("cookie") ?? null;
      if (cookieHeader) {
        const m = cookieHeader.match(/(?:^|;\s*)adaptaly-device=([^;]+)/);
        deviceId = m?.[1] ?? null;
      }
    } catch {
      // ignore
    }
  }

  return { userId: null, deviceId };
}