// src/lib/supabaseServer.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Read-only server client for Server Components (RSC).
 * In Next 15, cookies() is async. We NO-OP setAll() to avoid
 * "Cookies can only be modified..." during render.
 */
export async function getServerSupabaseReadOnly() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(_cookies: { name: string; value: string; options: any }[]) {
        // no-op on purpose in RSC
      },
    },
  });
}

/**
 * Writable server client for Route Handlers and Server Actions.
 * Use this when you DO want to mutate auth cookies (signout, etc).
 */
export async function getServerSupabaseWritable() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}