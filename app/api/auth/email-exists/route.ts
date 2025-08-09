// app/api/auth/email-exists/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const emailRaw = typeof body?.email === 'string' ? body.email : '';
    const email = emailRaw.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      // Be permissive. Never block signup because this endpoint failed.
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    const admin = await supabaseAdmin();
    // Use PostgREST with the service key on the auth schema
    const { data, error } = await admin
      .schema('auth')
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (error) {
      // Do not fail signup flow if admin read hiccups
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    return NextResponse.json({ exists: Array.isArray(data) && data.length > 0 }, { status: 200 });
  } catch {
    return NextResponse.json({ exists: false }, { status: 200 });
  }
}