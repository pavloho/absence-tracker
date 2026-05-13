import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { project_id, type, date_from, date_to } = await req.json();

  if (!project_id || !type || !date_from) {
    return NextResponse.json({ error: 'project_id, type, and date_from are required' }, { status: 400 });
  }

  const VALID_TYPES = ['Holiday', 'Sick Leave', 'Vacation'];
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid absence type' }, { status: 400 });
  }

  const { rows: employees } = await sql`
    SELECT employee_id FROM employee_projects WHERE project_id = ${Number(project_id)}
  `;

  const created = [];
  for (const emp of employees) {
    const { rows } = await sql`
      INSERT INTO absences (employee_id, project_id, type, date_from, date_to)
      VALUES (${emp.employee_id}, ${Number(project_id)}, ${type}, ${date_from}, ${date_to || null})
      RETURNING *
    `;
    created.push(rows[0]);
  }

  return NextResponse.json(created, { status: 201 });
}
