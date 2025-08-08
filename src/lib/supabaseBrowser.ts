"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";  // App-router helper

// Generic <Database> typing is optional; omit for now.
export const supabaseBrowser = createClientComponentClient();