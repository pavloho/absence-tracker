import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { project_id, type, date_from, date_to } = await req.json();

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
