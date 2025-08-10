// src/lib/supabaseServer.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Read-only server client for Server Components (RSC).
 * Note: In Next 15, cookies() is async, so we await it here.
 * We NO-OP setAll() to avoid mutating cookies during RSC render.
 */
export async function getServerSupabaseReadOnly() {
  const cookieStore = await cookies(); // NEXT 15: cookies() is async

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      // Do not mutate cookies in RSCs; use a Route Handler or Server Action instead.
      setAll(_cookies: any) {
        // no-op on purpose
      },
    },
  });
}

/**
 * Example writable client for Route Handlers / Server Actions (when you DO want to set cookies):
 *
 * export async function getServerSupabaseWritable() {
 *   const cookieStore = await cookies();
 *   return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
 *     cookies: {
 *       getAll: () => cookieStore.getAll(),
 *       setAll: (cookiesToSet) => {
 *         cookiesToSet.forEach(({ name, value, options }) => {
 *           cookieStore.set(name, value, options);
 *         });
 *       },
 *     },
 *   });
 * }
 */