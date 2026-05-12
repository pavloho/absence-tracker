import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  const numId = Number(id);
  const { first_name, last_name, avatar_url, project_ids } = await req.json();

  const { rows } = await sql`
    UPDATE employees SET first_name = ${first_name}, last_name = ${last_name}, avatar_url = ${avatar_url || null}
    WHERE id = ${numId} RETURNING *
  `;
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await sql`DELETE FROM employee_projects WHERE employee_id = ${numId}`;

  if (project_ids && project_ids.length > 0) {
    for (const pid of project_ids) {
      await sql`
        INSERT INTO employee_projects (employee_id, project_id)
        VALUES (${numId}, ${Number(pid)})
        ON CONFLICT DO NOTHING
      `;
    }
  }

  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  await sql`DELETE FROM employees WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
