import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const projectId = req.nextUrl.searchParams.get('project_id');
  const month = req.nextUrl.searchParams.get('month');
  const year = req.nextUrl.searchParams.get('year');

  if (projectId && month && year) {
    const m = Number(month);
    const y = Number(year);
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;

    const { rows } = await sql`
      SELECT a.*, e.first_name, e.last_name, e.avatar_url, p.name as project_name
      FROM absences a
      JOIN employees e ON a.employee_id = e.id
      JOIN projects p ON a.project_id = p.id
      WHERE a.project_id = ${Number(projectId)}
        AND a.date_from <= ${endDate}::date
        AND COALESCE(a.date_to, a.date_from) >= ${startDate}::date
      ORDER BY e.last_name, e.first_name, a.date_from
    `;
    return NextResponse.json(rows);
  }

  if (month && year) {
    const m = Number(month);
    const y = Number(year);
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;

    const { rows } = await sql`
      SELECT a.*, e.first_name, e.last_name, e.avatar_url, p.name as project_name
      FROM absences a
      JOIN employees e ON a.employee_id = e.id
      JOIN projects p ON a.project_id = p.id
      WHERE a.date_from <= ${endDate}::date
        AND COALESCE(a.date_to, a.date_from) >= ${startDate}::date
      ORDER BY e.last_name, e.first_name, a.date_from
    `;
    return NextResponse.json(rows);
  }

  if (projectId) {
    const { rows } = await sql`
      SELECT a.*, e.first_name, e.last_name, e.avatar_url, p.name as project_name
      FROM absences a
      JOIN employees e ON a.employee_id = e.id
      JOIN projects p ON a.project_id = p.id
      WHERE a.project_id = ${Number(projectId)}
      ORDER BY e.last_name, e.first_name, a.date_from
    `;
    return NextResponse.json(rows);
  }

  const { rows } = await sql`
    SELECT a.*, e.first_name, e.last_name, e.avatar_url, p.name as project_name
    FROM absences a
    JOIN employees e ON a.employee_id = e.id
    JOIN projects p ON a.project_id = p.id
    ORDER BY e.last_name, e.first_name, a.date_from
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { employee_id, project_id, type, date_from, date_to } = await req.json();

  if (!employee_id || !project_id || !type || !date_from) {
    return NextResponse.json({ error: 'employee_id, project_id, type, and date_from are required' }, { status: 400 });
  }

  const VALID_TYPES = ['Holiday', 'Sick Leave', 'Vacation'];
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid absence type' }, { status: 400 });
  }

  const { rows } = await sql`
    INSERT INTO absences (employee_id, project_id, type, date_from, date_to)
    VALUES (${employee_id}, ${project_id}, ${type}, ${date_from}, ${date_to || null})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
