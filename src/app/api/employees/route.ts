import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const projectId = req.nextUrl.searchParams.get('project_id');

  if (projectId) {
    const { rows } = await sql`
      SELECT e.*, COALESCE(
        json_agg(json_build_object('id', p.id, 'name', p.name)) FILTER (WHERE p.id IS NOT NULL), '[]'
      ) as projects
      FROM employees e
      LEFT JOIN employee_projects ep ON e.id = ep.employee_id
      LEFT JOIN projects p ON ep.project_id = p.id
      WHERE e.id IN (SELECT employee_id FROM employee_projects WHERE project_id = ${Number(projectId)})
      GROUP BY e.id
      ORDER BY e.last_name, e.first_name
    `;
    return NextResponse.json(rows);
  }

  const { rows } = await sql`
    SELECT e.*, COALESCE(
      json_agg(json_build_object('id', p.id, 'name', p.name)) FILTER (WHERE p.id IS NOT NULL), '[]'
    ) as projects
    FROM employees e
    LEFT JOIN employee_projects ep ON e.id = ep.employee_id
    LEFT JOIN projects p ON ep.project_id = p.id
    GROUP BY e.id
    ORDER BY e.last_name, e.first_name
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { first_name, last_name, avatar_url, project_ids } = await req.json();

  if (!first_name?.trim() || !last_name?.trim()) {
    return NextResponse.json({ error: 'first_name and last_name are required' }, { status: 400 });
  }

  const { rows } = await sql`
    INSERT INTO employees (first_name, last_name, avatar_url)
    VALUES (${first_name}, ${last_name}, ${avatar_url || null})
    RETURNING *
  `;

  const employee = rows[0];

  if (project_ids && project_ids.length > 0) {
    for (const pid of project_ids) {
      await sql`
        INSERT INTO employee_projects (employee_id, project_id)
        VALUES (${employee.id}, ${Number(pid)})
        ON CONFLICT DO NOTHING
      `;
    }
  }

  return NextResponse.json(employee, { status: 201 });
}
