// app/api/auth/email-exists/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    const admin = await supabaseAdmin();
    const { data, error } = await admin.auth.admin.getUserByEmail(email.trim());

    if (error && !/not.*found/i.test(error.message)) {
      // Any unexpected admin error, do not block signup flow
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    return NextResponse.json({ exists: !!data?.user }, { status: 200 });
  } catch {
    // Non-fatal fallback
    return NextResponse.json({ exists: false }, { status: 200 });
  }
}