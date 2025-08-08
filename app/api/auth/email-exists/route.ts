// app/api/auth/email-exists/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const lower = email.trim().toLowerCase();

    let exists = false;

    // Try the most specific helpers first; fall back gracefully if the SDK
    // version doesn't have them.
    const adminApi: any = admin.auth.admin;

    if (typeof adminApi.getUserByEmail === 'function') {
      const { data, error } = await adminApi.getUserByEmail(lower);
      if (error && error.status !== 404) throw error;
      exists = !!data?.user;
    } else if (typeof adminApi.searchUsers === 'function') {
      const { data, error } = await adminApi.searchUsers({
        query: lower,
        page: 1,
        perPage: 1,
      });
      if (error) throw error;
      exists = !!data?.users?.find((u: any) => u.email?.toLowerCase() === lower);
    } else {
      // Fallback: list a page and filter locally (fine for a single check).
      const { data, error } = await adminApi.listUsers({ page: 1, perPage: 200 });
      if (error) throw error;
      exists = !!data?.users?.find((u: any) => u.email?.toLowerCase() === lower);
    }

    return NextResponse.json({ exists });
  } catch (err) {
    // Don't leak internal errors
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}