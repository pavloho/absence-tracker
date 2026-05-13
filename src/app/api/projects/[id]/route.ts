import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  const { name, logo_url } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
  }

  const { rows } = await sql`
    UPDATE projects SET name = ${name}, logo_url = ${logo_url || null}
    WHERE id = ${Number(id)} RETURNING *
  `;
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  await sql`DELETE FROM projects WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
