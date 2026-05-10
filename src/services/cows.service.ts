/**
 * Cows Service (Neon-backed)
 *
 * 奶牛数据服务层，所有查询走 Netlify 集成的 Neon Postgres，
 * 返回值保持原有 ServiceResponse 形态，让上层 .astro 页面无感切换。
 *
 * @module services/cows.service
 */

import { sql, safeQuery, isDbAvailable, DB_UNAVAILABLE_ERROR } from '@/lib/db';
import type { Cow, CowFormData, CowFilters } from '@/types/cow.types';

/** 服务响应类型 */
export interface ServiceResponse<T> {
  data: T | null;
  error: any | null;
}

/** 默认演示用户（与 db/neon/002_seed.sql 中的 admin 一致） */
const DEMO_USER_ID = '11111111-1111-1111-1111-111111111111';

/**
 * 创建新奶牛
 */
export async function createCow(
  data: CowFormData
): Promise<ServiceResponse<Cow>> {
  return safeQuery(async () => {
    const rows = await sql<Cow[]>`
      INSERT INTO cows (
        cow_number, name, breed, gender, birth_date, entry_date,
        sire_id, dam_id, status, photo_url, notes,
        created_by, updated_by
      ) VALUES (
        ${data.cow_number}, ${data.name ?? null}, ${data.breed}::breed_type, ${data.gender}::gender_type,
        ${data.birth_date}, ${data.entry_date},
        ${data.sire_id ?? null}, ${data.dam_id ?? null},
        ${(data.status ?? 'active')}::cow_status,
        ${data.photo_url ?? null}, ${data.notes ?? null},
        ${DEMO_USER_ID}, ${DEMO_USER_ID}
      )
      RETURNING *
    `;
    return rows[0] ?? null as any;
  }, 'createCow');
}

/**
 * 获取奶牛列表（按 deleted_at IS NULL 过滤，按 created_at desc 排序）
 */
export async function getCows(
  filters?: CowFilters
): Promise<ServiceResponse<Cow[]>> {
  return safeQuery(async () => {
    const breed   = filters?.breed   ?? null;
    const gender  = filters?.gender  ?? null;
    const status  = filters?.status  ?? null;
    const search  = filters?.search ? `%${filters.search}%` : null;

    const rows = await sql<Cow[]>`
      SELECT
        id, cow_number, name,
        breed::text   AS breed,
        gender::text  AS gender,
        birth_date::text AS birth_date,
        sire_id, dam_id,
        status::text  AS status,
        entry_date::text AS entry_date,
        photo_url, notes,
        created_at::text AS created_at,
        updated_at::text AS updated_at,
        created_by, updated_by,
        deleted_at::text AS deleted_at
      FROM cows
      WHERE deleted_at IS NULL
        AND (${breed}::text  IS NULL OR breed::text  = ${breed}::text)
        AND (${gender}::text IS NULL OR gender::text = ${gender}::text)
        AND (${status}::text IS NULL OR status::text = ${status}::text)
        AND (
          ${search}::text IS NULL
          OR cow_number ILIKE ${search}
          OR coalesce(name, '') ILIKE ${search}
        )
      ORDER BY created_at DESC
    `;
    return rows;
  }, 'getCows');
}

/**
 * 根据ID获取单头奶牛
 */
export async function getCowById(id: string): Promise<ServiceResponse<Cow>> {
  return safeQuery(async () => {
    const rows = await sql<Cow[]>`
      SELECT
        id, cow_number, name,
        breed::text   AS breed,
        gender::text  AS gender,
        birth_date::text AS birth_date,
        sire_id, dam_id,
        status::text  AS status,
        entry_date::text AS entry_date,
        photo_url, notes,
        created_at::text AS created_at,
        updated_at::text AS updated_at,
        created_by, updated_by,
        deleted_at::text AS deleted_at
      FROM cows
      WHERE id = ${id}::uuid AND deleted_at IS NULL
      LIMIT 1
    `;
    return rows[0] ?? null as any;
  }, 'getCowById');
}

/**
 * 根据编号获取单头奶牛
 */
export async function getCowByNumber(
  cowNumber: string
): Promise<ServiceResponse<Cow>> {
  return safeQuery(async () => {
    const rows = await sql<Cow[]>`
      SELECT * FROM cows
      WHERE cow_number = ${cowNumber} AND deleted_at IS NULL
      LIMIT 1
    `;
    return rows[0] ?? null as any;
  }, 'getCowByNumber');
}

/**
 * 更新奶牛信息（动态构造 UPDATE：仅更新提供的字段）
 */
export async function updateCow(
  id: string,
  data: Partial<CowFormData>
): Promise<ServiceResponse<Cow>> {
  if (!isDbAvailable) return { data: null, error: DB_UNAVAILABLE_ERROR };

  // 这里使用 sql.query 接口手工拼接 set 子句以支持动态字段。
  const fields: string[] = [];
  const values: any[] = [];
  const push = (col: string, val: any, cast?: string) => {
    values.push(val);
    fields.push(cast ? `${col} = $${values.length}::${cast}` : `${col} = $${values.length}`);
  };

  if (data.cow_number !== undefined) push('cow_number', data.cow_number);
  if (data.name       !== undefined) push('name', data.name);
  if (data.breed      !== undefined) push('breed', data.breed, 'breed_type');
  if (data.gender     !== undefined) push('gender', data.gender, 'gender_type');
  if (data.birth_date !== undefined) push('birth_date', data.birth_date);
  if (data.entry_date !== undefined) push('entry_date', data.entry_date);
  if (data.sire_id    !== undefined) push('sire_id', data.sire_id ?? null);
  if (data.dam_id     !== undefined) push('dam_id',  data.dam_id  ?? null);
  if (data.status     !== undefined) push('status',  data.status,  'cow_status');
  if (data.photo_url  !== undefined) push('photo_url', data.photo_url ?? null);
  if (data.notes      !== undefined) push('notes', data.notes ?? null);

  // 始终维护 updated_by
  push('updated_by', DEMO_USER_ID);

  if (fields.length === 0) {
    return getCowById(id);
  }

  values.push(id);
  const text = `UPDATE cows SET ${fields.join(', ')} WHERE id = $${values.length}::uuid AND deleted_at IS NULL RETURNING *`;

  try {
    const rows = await (sql as any).query(text, values);
    return { data: rows[0] ?? null, error: null };
  } catch (err: any) {
    console.error('[db] updateCow failed:', err?.message ?? err);
    return { data: null, error: { message: err?.message ?? String(err), code: err?.code ?? 'DB_ERROR' } };
  }
}

/**
 * 软删除奶牛（设置 deleted_at）
 */
export async function deleteCow(id: string): Promise<ServiceResponse<null>> {
  return safeQuery(async () => {
    await sql`
      UPDATE cows
      SET deleted_at = NOW(), updated_by = ${DEMO_USER_ID}::uuid
      WHERE id = ${id}::uuid
    `;
    return null;
  }, 'deleteCow');
}

/**
 * 搜索奶牛
 */
export async function searchCows(
  keyword: string
): Promise<ServiceResponse<Cow[]>> {
  return safeQuery(async () => {
    const k = `%${keyword}%`;
    const rows = await sql<Cow[]>`
      SELECT * FROM cows
      WHERE deleted_at IS NULL
        AND (cow_number ILIKE ${k} OR coalesce(name, '') ILIKE ${k})
      ORDER BY cow_number ASC
      LIMIT 50
    `;
    return rows;
  }, 'searchCows');
}

/**
 * 获取奶牛统计信息
 */
export async function getCowStats(): Promise<ServiceResponse<{
  total: number;
  active: number;
  male: number;
  female: number;
  by_breed: Record<string, number>;
}>> {
  return safeQuery(async () => {
    const rows = await sql<Array<{ id: string; status: string; gender: string; breed: string }>>`
      SELECT id, status::text AS status, gender::text AS gender, breed::text AS breed
      FROM cows
      WHERE deleted_at IS NULL
    `;
    const stats = {
      total: rows.length,
      active: rows.filter(c => c.status === 'active').length,
      male: rows.filter(c => c.gender === 'male').length,
      female: rows.filter(c => c.gender === 'female').length,
      by_breed: {} as Record<string, number>,
    };
    for (const r of rows) stats.by_breed[r.breed] = (stats.by_breed[r.breed] ?? 0) + 1;
    return stats;
  }, 'getCowStats');
}
