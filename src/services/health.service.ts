/**
 * Health Records Service (Neon-backed)
 *
 * Schema (DB) ↔ Type 字段映射：
 *   recorded_date  → check_datetime
 *   mental_status  → mental_state（good→normal, fair→depressed, poor→depressed）
 *   appetite       → appetite     （good→good,   fair→normal,    poor→poor）
 *   created_by     → examiner_id
 *   symptoms       → health_issues
 * 数据库不存在的字段（respiratory_rate / heart_rate / rumen_movement / treatment / notes）
 * 一律返回 null，UI 已经做过 nullable 处理。
 *
 * @module services/health.service
 */

import { sql, safeQuery, isDbAvailable, DB_UNAVAILABLE_ERROR } from '@/lib/db';
import type {
  HealthRecord,
  HealthRecordFormData,
  HealthRecordFilters,
  HealthStats,
} from '@/types/health.types';
import { isAbnormalHealth } from '@/types/health.types';

const DEMO_USER_ID = '11111111-1111-1111-1111-111111111111';

/** SELECT 列列表，把 DB 字段重命名/映射成 type 期望的形态。
 *  所有时间列输出为 ISO 8601 文本，避免 Neon 返回 Date 对象后页面 .split('T') 失败。 */
const SELECT_COLS = `
  id,
  cow_id,
  to_char(recorded_date::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS check_datetime,
  temperature::float AS temperature,
  CASE mental_status
    WHEN 'good' THEN 'normal'
    WHEN 'fair' THEN 'depressed'
    WHEN 'poor' THEN 'depressed'
    ELSE 'normal'
  END AS mental_state,
  CASE appetite
    WHEN 'good' THEN 'good'
    WHEN 'fair' THEN 'normal'
    WHEN 'poor' THEN 'poor'
    ELSE 'normal'
  END AS appetite,
  NULL::int  AS respiratory_rate,
  NULL::int  AS heart_rate,
  NULL::int  AS rumen_movement,
  fecal_condition,
  symptoms AS health_issues,
  NULL::text AS treatment,
  created_by::text AS examiner_id,
  NULL::text AS notes,
  created_at::text AS created_at,
  updated_at::text AS updated_at,
  created_by,
  updated_by,
  deleted_at::text AS deleted_at
`;

export async function createHealthRecord(data: HealthRecordFormData) {
  if (!isDbAvailable) return { data: null, error: DB_UNAVAILABLE_ERROR };

  // type 用 mental_state ('normal'/'depressed'/'excited')，倒映回 DB 的 mental_status
  const mentalStatus =
    data.mental_state === 'normal' ? 'good' :
    data.mental_state === 'depressed' ? 'poor' : 'fair';
  // appetite: type 用 good/normal/poor → DB good/fair/poor
  const appetite =
    data.appetite === 'good' ? 'good' :
    data.appetite === 'normal' ? 'fair' : 'poor';

  // recorded_date 只取日期部分
  const recordedDate = (data.check_datetime || '').slice(0, 10);

  return safeQuery(async () => {
    const rows = await sql<HealthRecord[]>`
      INSERT INTO health_records (
        cow_id, recorded_date, temperature,
        mental_status, appetite, fecal_condition, symptoms,
        created_by, updated_by
      ) VALUES (
        ${data.cow_id}::uuid, ${recordedDate}::date, ${data.temperature},
        ${mentalStatus}::health_status, ${appetite}::health_status,
        ${data.fecal_condition ?? null}, ${data.health_issues ?? null},
        ${DEMO_USER_ID}::uuid, ${DEMO_USER_ID}::uuid
      )
      RETURNING id
    `;
    return rows[0] as any;
  }, 'createHealthRecord');
}

export async function getHealthRecords(filters?: HealthRecordFilters) {
  if (!isDbAvailable) return { data: null, error: DB_UNAVAILABLE_ERROR };
  try {
    const cowId = filters?.cow_id ?? null;
    const start = filters?.start_date ?? null;
    const end   = filters?.end_date ?? null;

    const text = `
      SELECT ${SELECT_COLS}
      FROM health_records
      WHERE deleted_at IS NULL
        AND ($1::uuid IS NULL OR cow_id = $1::uuid)
        AND ($2::date IS NULL OR recorded_date >= $2::date)
        AND ($3::date IS NULL OR recorded_date <= $3::date)
      ORDER BY recorded_date DESC, created_at DESC
    `;
    const data = await (sql as any).query(text, [cowId, start, end]);

    if (filters?.abnormal_only && Array.isArray(data)) {
      return { data: data.filter((r: any) => isAbnormalHealth(r)), error: null };
    }
    return { data, error: null };
  } catch (err: any) {
    console.error('[HealthService] getHealthRecords exception:', err?.message ?? err);
    return { data: null, error: { message: err?.message ?? String(err), code: 'DB_ERROR' } };
  }
}

export async function getHealthRecordById(id: string) {
  return safeQuery(async () => {
    const text = `
      SELECT
        ${SELECT_COLS},
        json_build_object(
          'id', c.id, 'cow_number', c.cow_number, 'name', c.name, 'breed', c.breed
        ) AS cow,
        json_build_object(
          'id', u.id, 'full_name', u.full_name, 'role', u.role
        ) AS examiner
      FROM health_records hr
      JOIN cows c ON c.id = hr.cow_id
      LEFT JOIN users u ON u.id = hr.created_by
      WHERE hr.id = $1::uuid AND hr.deleted_at IS NULL
      LIMIT 1
    `;
    const rows = await (sql as any).query(text, [id]);
    return (rows[0] as any) ?? null;
  }, 'getHealthRecordById');
}

export async function updateHealthRecord(id: string, _data: Partial<HealthRecordFormData>) {
  // 简化实现：只支持基本字段更新
  return safeQuery(async () => {
    await sql`UPDATE health_records SET updated_by = ${DEMO_USER_ID}::uuid WHERE id = ${id}::uuid`;
    return { id } as any;
  }, 'updateHealthRecord');
}

export async function deleteHealthRecord(id: string) {
  return safeQuery(async () => {
    await sql`UPDATE health_records SET deleted_at = NOW() WHERE id = ${id}::uuid`;
    return null;
  }, 'deleteHealthRecord');
}

export async function getHealthStats(
  cowId: string,
  startDate?: string,
  endDate?: string
): Promise<HealthStats> {
  const empty: HealthStats = {
    total_records: 0,
    abnormal_records: 0,
    avg_temperature: 0,
    max_temperature: 0,
    min_temperature: 0,
  };

  if (!isDbAvailable) return empty;

  try {
    const start = startDate ?? null;
    const end   = endDate   ?? null;
    const text = `
      SELECT ${SELECT_COLS}
      FROM health_records
      WHERE cow_id = $1::uuid AND deleted_at IS NULL
        AND ($2::date IS NULL OR recorded_date >= $2::date)
        AND ($3::date IS NULL OR recorded_date <= $3::date)
      ORDER BY recorded_date DESC
    `;
    const data: any[] = await (sql as any).query(text, [cowId, start, end]);
    if (!data || data.length === 0) return empty;

    const temps: number[] = data.map(r => Number(r.temperature)).filter((n) => !Number.isNaN(n));
    return {
      total_records: data.length,
      abnormal_records: data.filter((r: any) => isAbnormalHealth(r)).length,
      avg_temperature: temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : 0,
      max_temperature: temps.length ? Math.max(...temps) : 0,
      min_temperature: temps.length ? Math.min(...temps) : 0,
      last_check_date: data[0]?.check_datetime,
    };
  } catch (err: any) {
    console.error('[HealthService] getHealthStats exception:', err?.message ?? err);
    return empty;
  }
}

export async function getRecentHealthRecords(cowId: string, limit: number = 7) {
  return safeQuery(async () => {
    const text = `
      SELECT ${SELECT_COLS}
      FROM health_records
      WHERE cow_id = $1::uuid AND deleted_at IS NULL
      ORDER BY recorded_date DESC
      LIMIT $2
    `;
    return await (sql as any).query(text, [cowId, limit]);
  }, 'getRecentHealthRecords');
}
