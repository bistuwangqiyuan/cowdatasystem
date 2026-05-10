/**
 * Service smoke test — exercises each rewritten service against the live Neon
 * database to confirm the SQL aliases line up with the type expectations.
 *
 * Usage:
 *   $env:NETLIFY_DATABASE_URL=...
 *   node scripts/services-smoke.mjs
 */

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Use tsx loader for direct .ts imports
register('tsx/esm', pathToFileURL('./'));

const { getCows }            = await import('../src/services/cows.service.ts');
const { getHealthRecords }   = await import('../src/services/health.service.ts');
const { getMilkRecords }     = await import('../src/services/milk.service.ts');
const { getBreedingRecords } = await import('../src/services/breeding.service.ts');
const { getFeedFormulas, getFeedingRecords } = await import('../src/services/feed.service.ts');

const fail = [];
const expect = (name, ok, detail = '') => {
  const sign = ok ? 'OK ' : 'FAIL';
  console.log(`  [${sign}] ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) fail.push(name);
};

console.log('--- cows ---');
{
  const { data, error } = await getCows();
  expect('getCows returns array', Array.isArray(data) && !error, `${data?.length ?? 0} rows`);
  if (data?.length) {
    const c = data[0];
    expect('cow has cow_number', typeof c.cow_number === 'string', c.cow_number);
    expect('cow has breed/gender/status', !!(c.breed && c.gender && c.status));
  }
}

console.log('--- health ---');
{
  const { data, error } = await getHealthRecords();
  expect('getHealthRecords returns array', Array.isArray(data) && !error, `${data?.length ?? 0} rows`);
  if (data?.length) {
    const h = data[0];
    expect('health has check_datetime', typeof h.check_datetime === 'string' || h.check_datetime instanceof Date, String(h.check_datetime).slice(0, 19));
    expect('health has temperature (number)', typeof h.temperature === 'number', String(h.temperature));
    expect('health mental_state mapped', ['normal', 'depressed', 'excited'].includes(h.mental_state), h.mental_state);
    expect('health appetite mapped',     ['good', 'normal', 'poor'].includes(h.appetite),       h.appetite);
  }
}

console.log('--- milk ---');
{
  const { data, error } = await getMilkRecords();
  expect('getMilkRecords returns array', Array.isArray(data) && !error, `${data?.length ?? 0} rows`);
  if (data?.length) {
    const m = data[0];
    expect('milk has recorded_datetime', !!m.recorded_datetime);
    expect('milk amount is number', typeof m.amount === 'number', String(m.amount));
    expect('milk session valid', ['morning', 'afternoon', 'evening'].includes(m.session), m.session);
    expect('milk has cow.cow_number', !!m.cow?.cow_number, m.cow?.cow_number);
  }
}

console.log('--- breeding ---');
{
  const { data, error } = await getBreedingRecords();
  expect('getBreedingRecords returns array', Array.isArray(data) && !error, `${data?.length ?? 0} rows`);
  if (data?.length) {
    const b = data[0];
    expect('breeding has breeding_date', !!b.breeding_date);
    expect('breeding_method mapped', ['artificial', 'natural'].includes(b.breeding_method), b.breeding_method);
    expect('status defaults to planned', typeof b.status === 'string', b.status);
  }
}

console.log('--- feed formulas ---');
{
  const { data, error } = await getFeedFormulas();
  expect('getFeedFormulas returns array', Array.isArray(data) && !error, `${data?.length ?? 0} rows`);
  if (data?.length) {
    const f = data[0];
    expect('formula has formula_name', !!f.formula_name);
    expect('formula has formula_code', typeof f.formula_code === 'string' && f.formula_code.length === 8, f.formula_code);
    expect('formula has target_group', typeof f.target_group === 'string', f.target_group);
    expect('formula total_cost_per_kg is number', typeof f.total_cost_per_kg === 'number', String(f.total_cost_per_kg));
  }
}

console.log('--- feeding records ---');
{
  const { data, error } = await getFeedingRecords();
  expect('getFeedingRecords returns array', Array.isArray(data) && !error, `${data?.length ?? 0} rows`);
  if (data?.length) {
    const r = data[0];
    expect('record has feeding_datetime', !!r.feeding_datetime);
    expect('record has quantity_kg (number)', typeof r.quantity_kg === 'number', String(r.quantity_kg));
  }
}

if (fail.length) {
  console.error(`\nFAILED: ${fail.length} assertion(s):`);
  for (const f of fail) console.error('  -', f);
  process.exit(1);
} else {
  console.log('\nAll service smoke checks passed.');
}
