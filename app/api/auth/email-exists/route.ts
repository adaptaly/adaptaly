// app/api/auth/email-exists/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const target = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!target || !target.includes('@')) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }
    const admin = await supabaseAdmin();
    const { data, error } = await admin
      .schema('auth')
      .from('users')
      .select('id')
      .eq('email', target)
      .limit(1);
    if (error) return NextResponse.json({ exists: false }, { status: 200 });
    return NextResponse.json({ exists: Array.isArray(data) && data.length > 0 }, { status: 200 });
  } catch {
    return NextResponse.json({ exists: false }, { status: 200 });
  }
}