import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Creating tables...');

  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      logo_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS employee_projects (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(employee_id, project_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS absences (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL CHECK (type IN ('Holiday', 'Sick Leave', 'Vacation')),
      date_from DATE NOT NULL,
      date_to DATE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  console.log('Tables created.');

  // Admin user
  const hash = await bcrypt.hash('admin123', 12);
  await sql`
    INSERT INTO admin_users (username, password_hash)
    VALUES ('admin', ${hash})
    ON CONFLICT (username) DO UPDATE SET password_hash = ${hash}
  `;
  console.log('Admin user created (admin / admin123)');

  // Projects
  await sql`DELETE FROM absences`;
  await sql`DELETE FROM employee_projects`;
  await sql`DELETE FROM employees`;
  await sql`DELETE FROM projects`;

  const { rows: [seoAi] } = await sql`INSERT INTO projects (name) VALUES ('SEO AI') RETURNING id`;
  const { rows: [leadoo] } = await sql`INSERT INTO projects (name) VALUES ('Leadoo') RETURNING id`;
  console.log('Projects created: SEO AI, Leadoo');

  // Employees
  const emps = [
    { first_name: 'Olena', last_name: 'Kovalenko' },
    { first_name: 'Dmytro', last_name: 'Shevchenko' },
    { first_name: 'Anna', last_name: 'Bondarenko' },
    { first_name: 'Maksym', last_name: 'Lysenko' },
    { first_name: 'Iryna', last_name: 'Melnyk' },
    { first_name: 'Viktor', last_name: 'Tkachenko' },
  ];

  const empIds: number[] = [];
  for (const emp of emps) {
    const { rows: [row] } = await sql`
      INSERT INTO employees (first_name, last_name) VALUES (${emp.first_name}, ${emp.last_name}) RETURNING id
    `;
    empIds.push(row.id);
  }
  console.log(`Created ${empIds.length} employees`);

  // Assign to projects: first 4 to SEO AI, last 4 to Leadoo (overlap on 2-3)
  const seoIds = empIds.slice(0, 4);
  const leadooIds = empIds.slice(2, 6);

  for (const eid of seoIds) {
    await sql`INSERT INTO employee_projects (employee_id, project_id) VALUES (${eid}, ${seoAi.id}) ON CONFLICT DO NOTHING`;
  }
  for (const eid of leadooIds) {
    await sql`INSERT INTO employee_projects (employee_id, project_id) VALUES (${eid}, ${leadoo.id}) ON CONFLICT DO NOTHING`;
  }
  console.log('Employees assigned to projects');

  // Absences for current month
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');

  // Olena — Holiday
  await sql`INSERT INTO absences (employee_id, project_id, type, date_from) VALUES (${empIds[0]}, ${seoAi.id}, 'Holiday', ${`${y}-${m}-13`})`;
  // Dmytro — Sick Leave multiple days
  await sql`INSERT INTO absences (employee_id, project_id, type, date_from) VALUES (${empIds[1]}, ${seoAi.id}, 'Sick Leave', ${`${y}-${m}-08`})`;
  await sql`INSERT INTO absences (employee_id, project_id, type, date_from) VALUES (${empIds[1]}, ${seoAi.id}, 'Sick Leave', ${`${y}-${m}-10`})`;
  // Anna — Vacation range
  await sql`INSERT INTO absences (employee_id, project_id, type, date_from, date_to) VALUES (${empIds[2]}, ${seoAi.id}, 'Vacation', ${`${y}-${m}-01`}, ${`${y}-${m}-03`})`;
  // Anna also in Leadoo
  await sql`INSERT INTO absences (employee_id, project_id, type, date_from, date_to) VALUES (${empIds[2]}, ${leadoo.id}, 'Vacation', ${`${y}-${m}-01`}, ${`${y}-${m}-03`})`;
  // Maksym — Holiday in both projects
  await sql`INSERT INTO absences (employee_id, project_id, type, date_from) VALUES (${empIds[3]}, ${seoAi.id}, 'Holiday', ${`${y}-${m}-13`})`;
  await sql`INSERT INTO absences (employee_id, project_id, type, date_from) VALUES (${empIds[3]}, ${leadoo.id}, 'Holiday', ${`${y}-${m}-13`})`;
  // Iryna — Sick Leave range in Leadoo
  await sql`INSERT INTO absences (employee_id, project_id, type, date_from, date_to) VALUES (${empIds[4]}, ${leadoo.id}, 'Sick Leave', ${`${y}-${m}-17`}, ${`${y}-${m}-19`})`;
  // Viktor — Vacation in Leadoo
  await sql`INSERT INTO absences (employee_id, project_id, type, date_from, date_to) VALUES (${empIds[5]}, ${leadoo.id}, 'Vacation', ${`${y}-${m}-20`}, ${`${y}-${m}-24`})`;

  console.log('Test absences created for current month');
  console.log('Seed complete!');
}

seed().catch(console.error);
