import { sql } from '@vercel/postgres';

async function migrate() {
  await sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS end_date DATE`;
  console.log('Migration complete: employees.end_date added');
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
