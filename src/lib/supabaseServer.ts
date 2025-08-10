// src/lib/supabaseServer.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Read-only Supabase client for Server Components.
 * Uses getAll()/setAll() shape per @supabase/ssr typings.
 * setAll is a NO-OP here to avoid cookie writes during render.
 */
export async function getServerSupabaseReadOnly(): Promise<SupabaseClient> {
  const cookieStore = await cookies(); // Next 15: async
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(_cookies) {
        // NO-OP in RSC render path
      },
    },
  });
}

/**
 * Writable Supabase client for Route Handlers / Server Actions.
 * Use this when you DO want to mutate auth cookies (e.g., signout).
 */
export async function getServerSupabaseWritable(): Promise<SupabaseClient> {
  const cookieStore = await cookies(); // Next 15: async
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}