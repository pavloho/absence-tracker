import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const session = await getServerSession(authOptions);
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { current_password, new_password } = await req.json();

  if (!current_password || !new_password) {
    return NextResponse.json({ error: 'Both fields are required' }, { status: 400 });
  }

  if (new_password.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
  }

  const { rows } = await sql`
    SELECT id, password_hash FROM admin_users WHERE username = ${session.user.name}
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const valid = await bcrypt.compare(current_password, rows[0].password_hash);
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
  }

  const newHash = await bcrypt.hash(new_password, 12);
  await sql`UPDATE admin_users SET password_hash = ${newHash} WHERE id = ${rows[0].id}`;

  return NextResponse.json({ ok: true });
}
