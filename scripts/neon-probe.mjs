import { neon } from '@neondatabase/serverless';

const url = process.env.NETLIFY_DATABASE_URL;
if (!url) {
  console.error('NETLIFY_DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(url);

const [{ version }] = await sql`select version()`;
console.log('VERSION:', version);

const tables = await sql`
  select tablename
  from pg_tables
  where schemaname = 'public'
  order by tablename
`;
console.log('TABLES (public):', tables.length ? tables.map(r => r.tablename).join(', ') : '(empty)');

const enums = await sql`
  select t.typname as name
  from pg_type t
  join pg_enum e on t.oid = e.enumtypid
  group by t.typname
  order by t.typname
`;
console.log('ENUMS:', enums.length ? enums.map(r => r.name).join(', ') : '(none)');
