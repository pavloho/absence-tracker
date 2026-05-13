import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  const { employee_id, project_id, type, date_from, date_to } = await req.json();

  if (!employee_id || !project_id || !type || !date_from) {
    return NextResponse.json({ error: 'employee_id, project_id, type, and date_from are required' }, { status: 400 });
  }

  const VALID_TYPES = ['Holiday', 'Sick Leave', 'Vacation'];
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid absence type' }, { status: 400 });
  }

  const { rows } = await sql`
    UPDATE absences
    SET employee_id = ${employee_id}, project_id = ${project_id}, type = ${type},
        date_from = ${date_from}, date_to = ${date_to || null}
    WHERE id = ${Number(id)} RETURNING *
  `;
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  await sql`DELETE FROM absences WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
