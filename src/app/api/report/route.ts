import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const expectedToken = process.env.REPORT_TOKEN;

  if (expectedToken && token !== expectedToken) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const month = req.nextUrl.searchParams.get('month');
  const year = req.nextUrl.searchParams.get('year');

  const now = new Date();
  const m = month ? Number(month) : now.getMonth() + 1;
  const y = year ? Number(year) : now.getFullYear();

  const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const endDate = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;

  const { rows: projects } = await sql`SELECT * FROM projects ORDER BY name`;

  const result = [];

  for (const project of projects) {
    const { rows: totalCountRows } = await sql`
      SELECT COUNT(DISTINCT e.id)::int as total
      FROM employee_projects ep
      JOIN employees e ON ep.employee_id = e.id
      WHERE ep.project_id = ${project.id}
    `;
    const totalEmployees = totalCountRows[0]?.total ?? 0;

    const { rows: absences } = await sql`
      SELECT a.id, a.employee_id, a.project_id, a.type,
             a.date_from::text as date_from, a.date_to::text as date_to,
             e.first_name, e.last_name, e.avatar_url
      FROM absences a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.project_id = ${project.id}
        AND a.date_from <= ${endDate}::date
        AND COALESCE(a.date_to, a.date_from) >= ${startDate}::date
      ORDER BY e.last_name, e.first_name, a.date_from
    `;

    const employeeMap = new Map<number, {
      id: number;
      first_name: string;
      last_name: string;
      avatar_url: string | null;
      absences: Array<{
        id: number;
        type: string;
        date_from: string;
        date_to: string | null;
      }>;
      total_days: number;
    }>();

    for (const ab of absences) {
      if (!employeeMap.has(ab.employee_id)) {
        employeeMap.set(ab.employee_id, {
          id: ab.employee_id,
          first_name: ab.first_name.trim(),
          last_name: ab.last_name.trim(),
          avatar_url: ab.avatar_url,
          absences: [],
          total_days: 0,
        });
      }

      const emp = employeeMap.get(ab.employee_id)!;

      const toUTC = (d: string) => new Date(d + 'T00:00:00Z');
      const from = toUTC(ab.date_from);
      const to = ab.date_to ? toUTC(ab.date_to) : from;
      const periodStart = toUTC(startDate);
      const periodEnd = toUTC(endDate);
      const clampedFrom = from < periodStart ? periodStart : from;
      const clampedTo = to > periodEnd ? periodEnd : to;
      const days = Math.max(0, Math.floor((clampedTo.getTime() - clampedFrom.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      emp.total_days += days;
      emp.absences.push({
        id: ab.id,
        type: ab.type,
        date_from: ab.date_from,
        date_to: ab.date_to,
      });
    }

    result.push({
      project: {
        id: project.id,
        name: project.name,
        logo_url: project.logo_url,
      },
      period: {
        start: startDate,
        end: endDate,
        month: m,
        year: y,
        last_day: lastDay,
      },
      employees: Array.from(employeeMap.values()).sort((a, b) =>
        a.last_name.trim().localeCompare(b.last_name.trim()) || a.first_name.trim().localeCompare(b.first_name.trim())
      ),
      total_employees: totalEmployees,
      total_absentees: employeeMap.size,
    });
  }

  return NextResponse.json(result);
}
