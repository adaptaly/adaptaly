import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

// Use once per request / route-handler / server-component.
export function supabaseServer() {
  return createServerComponentClient({ cookies });
}