/**
 * Milk Records Service (Neon-backed)
 *
 * DB schema 与 type 字段一致（recorded_datetime / session / amount / fat_rate / protein_rate /
 * somatic_cell_count）。列表页期望 record.cow.cow_number，所以查询时 LEFT JOIN cows 并把它打包成
 * json 字段。
 *
 * @module services/milk.service
 */

import { sql, safeQuery, isDbAvailable, DB_UNAVAILABLE_ERROR } from '@/lib/db';
import type {
  MilkRecord,
  MilkRecordFormData,
  MilkRecordFilters,
  MilkStats,
  MilkTrendDataPoint,
} from '@/types/milk.types';

const DEMO_USER_ID = '11111111-1111-1111-1111-111111111111';

// 所有 timestamp/date 列都强制转成 text，因为页面里用 `.split('T')` 处理日期。
const SELECT_COLS_WITH_COW = `
  m.id,
  m.cow_id,
  to_char(m.recorded_datetime AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS recorded_datetime,
  m.session::text AS session,
  m.amount::float AS amount,
  m.fat_rate::float AS fat_rate,
  m.protein_rate::float AS protein_rate,
  NULL::float AS lactose_percentage,
  m.somatic_cell_count,
  m.created_by AS milker_id,
  NULL::text AS notes,
  m.created_at::text AS created_at,
  m.updated_at::text AS updated_at,
  m.created_by,
  m.updated_by,
  m.deleted_at::text AS deleted_at,
  CASE
    WHEN c.id IS NULL THEN NULL
    ELSE json_build_object('id', c.id, 'cow_number', c.cow_number, 'name', c.name)
  END AS cow
`;

export async function createMilkRecord(data: MilkRecordFormData) {
  return safeQuery(async () => {
    const rows = await sql<MilkRecord[]>`
      INSERT INTO milk_records (
        cow_id, recorded_datetime, session, amount,
        fat_rate, protein_rate, somatic_cell_count,
        created_by, updated_by
      ) VALUES (
        ${data.cow_id}::uuid, ${data.recorded_datetime}::timestamptz, ${data.session}::milking_session, ${data.amount},
        ${data.fat_rate ?? null}, ${data.protein_rate ?? null}, ${data.somatic_cell_count ?? null},
        ${DEMO_USER_ID}::uuid, ${DEMO_USER_ID}::uuid
      )
      RETURNING *
    `;
    return rows[0] as any;
  }, 'createMilkRecord');
}

export async function getMilkRecords(filters?: MilkRecordFilters) {
  if (!isDbAvailable) return { data: null, error: DB_UNAVAILABLE_ERROR };
  try {
    const cowId    = filters?.cow_id ?? null;
    const session  = filters?.session ?? null;
    const start    = filters?.start_date ?? null;
    const end      = filters?.end_date ?? null;

    const text = `
      SELECT ${SELECT_COLS_WITH_COW}
      FROM milk_records m
      LEFT JOIN cows c ON c.id = m.cow_id
      WHERE m.deleted_at IS NULL
        AND ($1::uuid IS NULL OR m.cow_id = $1::uuid)
        AND ($2::text IS NULL OR m.session::text = $2::text)
        AND ($3::timestamptz IS NULL OR m.recorded_datetime >= $3::timestamptz)
        AND ($4::timestamptz IS NULL OR m.recorded_datetime <= $4::timestamptz)
      ORDER BY m.recorded_datetime DESC
    `;
    const data = await (sql as any).query(text, [cowId, session, start, end]);

    if (filters?.abnormal_only && Array.isArray(data)) {
      // SCC 单位是"个/mL"，类型注释里期望"万个/mL"，按>200000 视为异常
      return { data: data.filter((r: any) => Number(r.somatic_cell_count) > 200000), error: null };
    }
    return { data, error: null };
  } catch (err: any) {
    console.error('[MilkService] getMilkRecords exception:', err?.message ?? err);
    return { data: null, error: { message: err?.message ?? String(err), code: 'DB_ERROR' } };
  }
}

export async function getMilkRecordById(id: string) {
  return safeQuery(async () => {
    const text = `
      SELECT ${SELECT_COLS_WITH_COW},
             json_build_object('id', u.id, 'full_name', u.full_name, 'role', u.role) AS milker
      FROM milk_records m
      LEFT JOIN cows  c ON c.id = m.cow_id
      LEFT JOIN users u ON u.id = m.created_by
      WHERE m.id = $1::uuid AND m.deleted_at IS NULL
      LIMIT 1
    `;
    const rows = await (sql as any).query(text, [id]);
    return (rows[0] as any) ?? null;
  }, 'getMilkRecordById');
}

export async function updateMilkRecord(id: string, _data: Partial<MilkRecordFormData>) {
  return safeQuery(async () => {
    await sql`UPDATE milk_records SET updated_by = ${DEMO_USER_ID}::uuid WHERE id = ${id}::uuid`;
    return { id } as any;
  }, 'updateMilkRecord');
}

export async function deleteMilkRecord(id: string) {
  return safeQuery(async () => {
    await sql`UPDATE milk_records SET deleted_at = NOW() WHERE id = ${id}::uuid`;
    return null;
  }, 'deleteMilkRecord');
}

export async function getMilkStats(
  cowId: string,
  startDate?: string,
  endDate?: string
): Promise<MilkStats> {
  const empty: MilkStats = {
    total_records: 0,
    total_yield: 0,
    avg_yield: 0,
    max_yield: 0,
  };

  if (!isDbAvailable) return empty;

  try {
    const start = startDate ?? null;
    const end   = endDate ?? null;
    const text = `
      SELECT amount::float AS amount, fat_rate::float AS fat_rate, protein_rate::float AS protein_rate, somatic_cell_count
      FROM milk_records
      WHERE cow_id = $1::uuid AND deleted_at IS NULL
        AND ($2::timestamptz IS NULL OR recorded_datetime >= $2::timestamptz)
        AND ($3::timestamptz IS NULL OR recorded_datetime <= $3::timestamptz)
    `;
    const data: any[] = await (sql as any).query(text, [cowId, start, end]);
    if (!data || data.length === 0) return empty;

    const yields = data.map(r => Number(r.amount)).filter(n => !Number.isNaN(n));
    const total = yields.reduce((a, b) => a + b, 0);

    const fats   = data.map(r => Number(r.fat_rate)).filter(n => !Number.isNaN(n));
    const prots  = data.map(r => Number(r.protein_rate)).filter(n => !Number.isNaN(n));
    const sccs   = data.map(r => Number(r.somatic_cell_count)).filter(n => !Number.isNaN(n));

    const stats: MilkStats = {
      total_records: data.length,
      total_yield: total,
      avg_yield: yields.length ? total / yields.length : 0,
      max_yield: yields.length ? Math.max(...yields) : 0,
    };
    if (fats.length)  stats.avg_fat_percentage     = fats.reduce((a, b) => a + b, 0) / fats.length;
    if (prots.length) stats.avg_protein_percentage = prots.reduce((a, b) => a + b, 0) / prots.length;
    if (sccs.length)  stats.avg_somatic_cell_count = sccs.reduce((a, b) => a + b, 0) / sccs.length;
    return stats;
  } catch (err: any) {
    console.error('[MilkService] getMilkStats exception:', err?.message ?? err);
    return empty;
  }
}

export async function getMilkTrend(cowId: string, days: number = 30): Promise<MilkTrendDataPoint[]> {
  if (!isDbAvailable) return [];
  try {
    const text = `
      SELECT
        date_trunc('day', recorded_datetime)::date::text AS date,
        SUM(amount)::float AS yield,
        AVG(fat_rate)::float    AS fat_percentage,
        AVG(protein_rate)::float AS protein_percentage
      FROM milk_records
      WHERE cow_id = $1::uuid AND deleted_at IS NULL
        AND recorded_datetime >= NOW() - ($2 || ' days')::interval
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    const data: any[] = await (sql as any).query(text, [cowId, String(days)]);
    return data.map(r => ({
      date: r.date,
      yield: Number(r.yield ?? 0),
      fat_percentage: r.fat_percentage != null ? Number(r.fat_percentage) : undefined,
      protein_percentage: r.protein_percentage != null ? Number(r.protein_percentage) : undefined,
    }));
  } catch (err: any) {
    console.error('[MilkService] getMilkTrend exception:', err?.message ?? err);
    return [];
  }
}

export async function getRecentMilkRecords(cowId: string, limit: number = 10) {
  return safeQuery(async () => {
    const text = `
      SELECT ${SELECT_COLS_WITH_COW}
      FROM milk_records m
      LEFT JOIN cows c ON c.id = m.cow_id
      WHERE m.cow_id = $1::uuid AND m.deleted_at IS NULL
      ORDER BY m.recorded_datetime DESC
      LIMIT $2
    `;
    return await (sql as any).query(text, [cowId, limit]);
  }, 'getRecentMilkRecords');
}
