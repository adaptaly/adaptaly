// src/lib/urls.ts
export function getBaseUrl() {
    // Highest priority: explicit public site URL
    const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (fromEnv) return fromEnv.replace(/\/+$/, "");
  
    // Vercel production URL
    const vercel = process.env.VERCEL_URL?.trim();
    if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  
    // Local dev default
    return "http://localhost:3000";
  }  