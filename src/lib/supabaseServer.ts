// Update
// src/lib/supabaseServer.ts
import { createServerClient as createSSRClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Some Next.js setups expose cookies() sync, others as a Promise.
 * This helper normalizes it to an awaited store.
 */
async function getCookieStore() {
  const store = cookies() as any;
  return typeof store?.then === "function" ? await store : store;
}

/**
 * Core factory used by all helpers.
 */
async function makeClient() {
  const cookieStore = await getCookieStore();

  const supabase = createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Skip setting cookies during server-side rendering
          // Cookies can only be set in Server Actions or Route Handlers
        },
        remove(name: string, options: CookieOptions) {
          // Skip removing cookies during server-side rendering
          // Cookies can only be set in Server Actions or Route Handlers
        },
      },
    }
  );

  return supabase;
}

/**
 * Primary helper used in most server handlers.
 */
export async function createServerClient() {
  return makeClient();
}

/**
 * Backwards‑compat aliases to satisfy existing imports in your codebase.
 * Both use the anon key and cookie persistence.
 */
export async function getServerSupabaseReadOnly() {
  return makeClient();
}

export async function getServerSupabaseWritable() {
  return makeClient();
}

// Default export for compatibility with places using `default import`.
export default createServerClient;