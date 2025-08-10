// src/lib/supabaseClient.ts
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * Singleton browser client (default persistence).
 * Use this for normal reads/writes in the app shell.
 */
export function supabaseBrowser(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  _client = createBrowserClient(url, anon);
  return _client;
}

/**
 * One-off client for auth actions where you want to control persistence.
 * - remember === true  -> keep session across browser restarts
 * - remember === false -> session cleared when the browser is closed
 *
 * NOTE: This returns a NEW client (not the singleton) on purpose.
 */
export function supabaseForAuth(remember: boolean): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createBrowserClient(url, anon, {
    auth: { persistSession: remember },
  });
}