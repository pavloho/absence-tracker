import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const { rows } = await sql`SELECT * FROM projects ORDER BY name`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { name, logo_url } = await req.json();
  const { rows } = await sql`
    INSERT INTO projects (name, logo_url) VALUES (${name}, ${logo_url || null})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
