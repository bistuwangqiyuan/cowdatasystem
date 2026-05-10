import { readFile } from 'node:fs/promises';
import { Pool } from '@neondatabase/serverless';

const url = process.env.NETLIFY_DATABASE_URL_UNPOOLED || process.env.NETLIFY_DATABASE_URL;
if (!url) {
  console.error('NETLIFY_DATABASE_URL[_UNPOOLED] is not set');
  process.exit(1);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node scripts/neon-migrate.mjs <file1.sql> [file2.sql ...]');
  process.exit(1);
}

// Use Pool which speaks the wire protocol over WebSocket and supports
// multi-statement scripts (the http neon() helper does not).
const pool = new Pool({ connectionString: url });
const client = await pool.connect();

try {
  for (const file of files) {
    console.log(`\n--- Applying ${file} ---`);
    const sql = await readFile(file, 'utf8');
    await client.query(sql);
    console.log(`  OK`);
  }
} catch (err) {
  console.error('Migration failed:', err.message);
  if (err.position) console.error('  position:', err.position);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
