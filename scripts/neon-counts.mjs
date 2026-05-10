import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NETLIFY_DATABASE_URL);

const tables = ['users', 'cows', 'health_records', 'milk_records', 'breeding_records', 'feed_formulas', 'feeding_records', 'medical_records'];
for (const t of tables) {
  // ident interpolation must be done outside the tag — Neon's sql tag treats
  // template values as parameters, so we build a plain text query here.
  const rows = await sql.query(`select count(*)::int as n from ${t}`);
  console.log(t.padEnd(20), rows[0].n);
}
