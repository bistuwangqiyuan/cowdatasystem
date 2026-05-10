/**
 * Breeding Records Service (Neon-backed)
 *
 * Schema (DB) ↔ Type 字段映射：
 *   dam_id  → cow_id
 *   sire_id → bull_id
 *   breeding_method 'artificial_insemination'/'natural_mating' ↔ 'artificial'/'natural'
 *   pregnancy_result 'confirmed'/'not_pregnant'/'pending' ↔ 'positive'/'negative'/'uncertain'
 *
 * @module services/breeding.service
 */

import { sql, safeQuery, isDbAvailable, DB_UNAVAILABLE_ERROR } from '@/lib/db';
import type {
  BreedingFormData,
  BreedingFilters,
} from '@/types/breeding.types';

const DEMO_USER_ID = '11111111-1111-1111-1111-111111111111';

const SELECT_COLS = `
  id,
  dam_id  AS cow_id,
  sire_id AS bull_id,
  calf_id,
  breeding_date::text         AS breeding_date,
  CASE breeding_method
    WHEN 'artificial_insemination' THEN 'artificial'
    WHEN 'natural_mating'          THEN 'natural'
    ELSE 'artificial'
  END AS breeding_method,
  COALESCE(status, 'planned') AS status,
  pregnancy_check_date::text  AS pregnancy_check_date,
  CASE pregnancy_result
    WHEN 'confirmed'    THEN 'positive'
    WHEN 'not_pregnant' THEN 'negative'
    WHEN 'pending'      THEN 'uncertain'
    ELSE NULL
  END AS pregnancy_result,
  expected_calving_date::text AS expected_calving_date,
  actual_calving_date::text   AS actual_calving_date,
  calving_notes               AS notes,
  created_at::text            AS created_at,
  updated_at::text            AS updated_at,
  created_by,
  updated_by,
  deleted_at::text            AS deleted_at
`;

const TYPE_TO_DB_METHOD: Record<string, string> = {
  artificial: 'artificial_insemination',
  natural: 'natural_mating',
};

const TYPE_TO_DB_PREGNANCY: Record<string, string> = {
  positive: 'confirmed',
  negative: 'not_pregnant',
  uncertain: 'pending',
};

export async function createBreedingRecord(data: BreedingFormData) {
  return safeQuery(async () => {
    const dbMethod    = TYPE_TO_DB_METHOD[data.breeding_method] ?? 'artificial_insemination';
    const dbPregnancy = data.pregnancy_result ? TYPE_TO_DB_PREGNANCY[data.pregnancy_result] : null;
    const semenBatch  = dbMethod === 'natural_mating' ? null : `SB-${Date.now()}`;

    const rows = await sql<any[]>`
      INSERT INTO breeding_records (
        dam_id, sire_id, breeding_date, breeding_method, semen_batch,
        pregnancy_check_date, pregnancy_result, expected_calving_date,
        status, calving_notes, created_by, updated_by
      ) VALUES (
        ${data.cow_id}::uuid, ${data.bull_id ?? null}, ${data.breeding_date}::date,
        ${dbMethod}::breeding_method, ${semenBatch},
        ${data.pregnancy_check_date ?? null}::date,
        ${dbPregnancy}::pregnancy_result,
        ${data.expected_calving_date ?? null}::date,
        'planned', ${data.notes ?? null},
        ${DEMO_USER_ID}::uuid, ${DEMO_USER_ID}::uuid
      )
      RETURNING id
    `;
    return rows[0] as any;
  }, 'createBreedingRecord');
}

export async function getBreedingRecords(filters?: BreedingFilters) {
  if (!isDbAvailable) return { data: null, error: DB_UNAVAILABLE_ERROR };
  try {
    const cowId  = filters?.cow_id ?? null;
    const status = filters?.status ?? null;
    const start  = filters?.start_date ?? null;
    const end    = filters?.end_date ?? null;
    const dbMethod = filters?.breeding_method ? TYPE_TO_DB_METHOD[filters.breeding_method] : null;

    const text = `
      SELECT ${SELECT_COLS}
      FROM breeding_records
      WHERE deleted_at IS NULL
        AND ($1::uuid IS NULL OR dam_id = $1::uuid)
        AND ($2::text IS NULL OR COALESCE(status, 'planned') = $2::text)
        AND ($3::text IS NULL OR breeding_method::text = $3::text)
        AND ($4::date IS NULL OR breeding_date >= $4::date)
        AND ($5::date IS NULL OR breeding_date <= $5::date)
      ORDER BY breeding_date DESC
    `;
    const data = await (sql as any).query(text, [cowId, status, dbMethod, start, end]);
    return { data, error: null };
  } catch (err: any) {
    console.error('[BreedingService] getBreedingRecords exception:', err?.message ?? err);
    return { data: null, error: { message: err?.message ?? String(err), code: 'DB_ERROR' } };
  }
}

export async function getBreedingRecordById(id: string) {
  return safeQuery(async () => {
    const text = `
      SELECT ${SELECT_COLS}
      FROM breeding_records
      WHERE id = $1::uuid AND deleted_at IS NULL
      LIMIT 1
    `;
    const rows = await (sql as any).query(text, [id]);
    return (rows[0] as any) ?? null;
  }, 'getBreedingRecordById');
}

export async function updateBreedingRecord(id: string, _data: Partial<BreedingFormData>) {
  return safeQuery(async () => {
    await sql`UPDATE breeding_records SET updated_by = ${DEMO_USER_ID}::uuid WHERE id = ${id}::uuid`;
    return { id } as any;
  }, 'updateBreedingRecord');
}

export async function deleteBreedingRecord(id: string) {
  return safeQuery(async () => {
    await sql`UPDATE breeding_records SET deleted_at = NOW() WHERE id = ${id}::uuid`;
    return null;
  }, 'deleteBreedingRecord');
}
