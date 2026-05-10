/**
 * Feed Service (Neon-backed)
 *
 * Schema (DB) ↔ Type 字段映射：
 *   feed_formulas.cattle_group  → target_group
 *   feed_formulas.unit_cost     → total_cost_per_kg
 *   feed_formulas.id 前 8 位     → formula_code
 *   feeding_records.amount      → quantity_kg
 *
 * @module services/feed.service
 */

import { sql, safeQuery, isDbAvailable, DB_UNAVAILABLE_ERROR } from '@/lib/db';
import type {
  FeedFormulaFormData,
  FeedingFormData,
  FeedFilters,
} from '@/types/feed.types';

const DEMO_USER_ID = '11111111-1111-1111-1111-111111111111';

const FORMULA_COLS = `
  id,
  formula_name,
  SUBSTRING(id::text, 1, 8) AS formula_code,
  cattle_group::text         AS target_group,
  ingredients,
  nutrition_facts,
  unit_cost::float           AS total_cost_per_kg,
  is_active,
  notes,
  created_at::text AS created_at,
  updated_at::text AS updated_at,
  created_by,
  updated_by,
  deleted_at::text AS deleted_at
`;

const FEEDING_COLS = `
  fr.id,
  fr.cow_id,
  fr.formula_id,
  to_char(fr.feeding_datetime AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS feeding_datetime,
  fr.amount::float    AS quantity_kg,
  fr.actual_cost::float AS actual_cost,
  fr.cattle_group::text AS cattle_group,
  fr.notes,
  fr.created_at::text AS created_at,
  fr.updated_at::text AS updated_at,
  fr.created_by,
  fr.updated_by,
  fr.deleted_at::text AS deleted_at,
  CASE WHEN c.id IS NULL THEN NULL ELSE json_build_object('cow_number', c.cow_number, 'name', c.name) END AS cow,
  CASE WHEN ff.id IS NULL THEN NULL ELSE json_build_object('formula_name', ff.formula_name) END AS formula
`;

export async function createFeedFormula(data: FeedFormulaFormData) {
  return safeQuery(async () => {
    const text = `
      INSERT INTO feed_formulas (
        formula_name, cattle_group, ingredients, nutrition_facts, unit_cost,
        is_active, notes, created_by, updated_by
      ) VALUES (
        $1,
        $2::cattle_group_type,
        $3::jsonb,
        $4::jsonb,
        $5,
        TRUE,
        $6,
        $7::uuid, $7::uuid
      )
      RETURNING ${FORMULA_COLS}
    `;
    const params = [
      (data as any).formula_name,
      (data as any).target_group ?? 'lactating',
      JSON.stringify((data as any).ingredients ?? []),
      JSON.stringify((data as any).nutrition_facts ?? {}),
      (data as any).total_cost_per_kg ?? null,
      (data as any).notes ?? null,
      DEMO_USER_ID,
    ];
    const rows = await (sql as any).query(text, params);
    return rows[0] as any;
  }, 'createFeedFormula');
}

export async function getFeedFormulas() {
  if (!isDbAvailable) return { data: null, error: DB_UNAVAILABLE_ERROR };
  try {
    const text = `
      SELECT ${FORMULA_COLS}
      FROM feed_formulas
      WHERE deleted_at IS NULL AND is_active = TRUE
      ORDER BY created_at DESC
    `;
    const data = await (sql as any).query(text, []);
    return { data, error: null };
  } catch (err: any) {
    console.error('[FeedService] getFeedFormulas exception:', err?.message ?? err);
    return { data: null, error: { message: err?.message ?? String(err), code: 'DB_ERROR' } };
  }
}

export async function getFeedFormulaById(id: string) {
  return safeQuery(async () => {
    const text = `SELECT ${FORMULA_COLS} FROM feed_formulas WHERE id = $1::uuid AND deleted_at IS NULL LIMIT 1`;
    const rows = await (sql as any).query(text, [id]);
    return (rows[0] as any) ?? null;
  }, 'getFeedFormulaById');
}

export async function createFeedingRecord(data: FeedingFormData) {
  return safeQuery(async () => {
    const rows = await sql<any[]>`
      INSERT INTO feeding_records (
        cow_id, formula_id, feeding_datetime, amount, cattle_group, notes,
        created_by, updated_by
      ) VALUES (
        ${(data as any).cow_id ?? null},
        ${(data as any).formula_id}::uuid,
        ${(data as any).feeding_datetime}::timestamptz,
        ${(data as any).quantity_kg ?? (data as any).amount ?? 0},
        ${(data as any).cattle_group ? `${(data as any).cattle_group}::cattle_group_type` : null},
        ${(data as any).notes ?? null},
        ${DEMO_USER_ID}::uuid, ${DEMO_USER_ID}::uuid
      )
      RETURNING id
    `;
    return rows[0] as any;
  }, 'createFeedingRecord');
}

export async function getFeedingRecords(filters?: FeedFilters) {
  if (!isDbAvailable) return { data: null, error: DB_UNAVAILABLE_ERROR };
  try {
    const cowId   = filters?.cow_id ?? null;
    const formId  = filters?.formula_id ?? null;
    const start   = filters?.start_date ?? null;
    const end     = filters?.end_date ?? null;

    const text = `
      SELECT ${FEEDING_COLS}
      FROM feeding_records fr
      LEFT JOIN cows  c  ON c.id  = fr.cow_id
      LEFT JOIN feed_formulas ff ON ff.id = fr.formula_id
      WHERE fr.deleted_at IS NULL
        AND ($1::uuid IS NULL OR fr.cow_id = $1::uuid)
        AND ($2::uuid IS NULL OR fr.formula_id = $2::uuid)
        AND ($3::timestamptz IS NULL OR fr.feeding_datetime >= $3::timestamptz)
        AND ($4::timestamptz IS NULL OR fr.feeding_datetime <= $4::timestamptz)
      ORDER BY fr.feeding_datetime DESC
    `;
    const data = await (sql as any).query(text, [cowId, formId, start, end]);
    return { data, error: null };
  } catch (err: any) {
    console.error('[FeedService] getFeedingRecords exception:', err?.message ?? err);
    return { data: null, error: { message: err?.message ?? String(err), code: 'DB_ERROR' } };
  }
}

export async function getFeedingRecordById(id: string) {
  return safeQuery(async () => {
    const text = `
      SELECT ${FEEDING_COLS}
      FROM feeding_records fr
      LEFT JOIN cows  c  ON c.id  = fr.cow_id
      LEFT JOIN feed_formulas ff ON ff.id = fr.formula_id
      WHERE fr.id = $1::uuid AND fr.deleted_at IS NULL
      LIMIT 1
    `;
    const rows = await (sql as any).query(text, [id]);
    return (rows[0] as any) ?? null;
  }, 'getFeedingRecordById');
}
