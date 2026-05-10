/**
 * Neon (Postgres) 数据库访问层
 *
 * 使用 Netlify 内置的 Neon 集成提供的 NETLIFY_DATABASE_URL（连接池）/
 * NETLIFY_DATABASE_URL_UNPOOLED（直连）。
 *
 * - 默认导出一个 sql 标签函数，可以直接用模板字面量写带参数的查询：
 *     const rows = await sql`select * from cows where id = ${id}`;
 * - 桩客户端：当环境变量缺失或 createClient 失败时，sql/sqlQuery 会返回空数组并
 *   在控制台打印一次告警，避免 SSR 在数据库不可达时抛 5xx。
 *
 * @module lib/db
 */

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

/** 当 DB 不可用时给上层服务用的错误对象（兼容现有 ServiceResponse 的 error 字段）。 */
export const DB_UNAVAILABLE_ERROR = {
  message: 'Database unavailable',
  code: 'DB_UNAVAILABLE',
  details: '',
  hint: '',
} as const;

function pickConnectionString(): string | undefined {
  // 优先使用 import.meta.env（Astro 在构建时静态注入），回落到 process.env（本地脚本）
  const env: any = (import.meta as any).env ?? {};
  return (
    env.NETLIFY_DATABASE_URL ||
    env.NETLIFY_DATABASE_URL_UNPOOLED ||
    env.DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL ||
    undefined
  );
}

/**
 * 桩 sql：所有调用都返回空数组，并在第一次调用时打印一次告警。
 * 兼容 NeonQueryFunction 的两种用法：模板字面量和 .query(text, params)。
 */
function createStubSql(reason: string): NeonQueryFunction<false, false> {
  let warned = false;
  const warn = () => {
    if (!warned) {
      warned = true;
      console.warn(`[db] Neon client unavailable (${reason}). 所有查询都将返回空数组。`);
    }
  };
  const stub: any = (..._args: unknown[]) => {
    warn();
    return Promise.resolve([]);
  };
  stub.query = async (..._args: unknown[]) => {
    warn();
    return [];
  };
  stub.unsafe = async (..._args: unknown[]) => {
    warn();
    return [];
  };
  stub.transaction = async (cb: (sub: any) => Promise<unknown>) => cb(stub);
  return stub as NeonQueryFunction<false, false>;
}

let _sql: NeonQueryFunction<false, false>;
const _conn = pickConnectionString();
if (!_conn) {
  _sql = createStubSql('NETLIFY_DATABASE_URL is not set');
} else {
  try {
    _sql = neon(_conn);
  } catch (e: any) {
    console.warn('[db] neon(...) threw:', e?.message);
    _sql = createStubSql(`neon() threw: ${e?.message ?? 'unknown'}`);
  }
}

/**
 * 标签函数形式的 SQL 执行入口。
 *
 * @example
 * ```ts
 * const cows = await sql<Cow[]>`select * from cows where deleted_at is null`;
 * ```
 */
export const sql = _sql;

/** 当前是否拿到了真实 Neon 连接（false 时所有查询返回空数组）。 */
export const isDbAvailable = Boolean(_conn);

/**
 * Helper: 用 try/catch 包装一段 DB 读取，失败时返回 { data, error }，与现有
 * services/cows.service.ts 的 ServiceResponse 形态保持一致。
 */
export async function safeQuery<T>(
  fn: () => Promise<T>,
  context: string
): Promise<{ data: T | null; error: any | null }> {
  if (!isDbAvailable) {
    return { data: null, error: DB_UNAVAILABLE_ERROR };
  }
  try {
    const data = await fn();
    return { data, error: null };
  } catch (err: any) {
    console.error(`[db] ${context} failed:`, err?.message ?? err);
    return { data: null, error: { message: err?.message ?? String(err), code: err?.code ?? 'DB_ERROR' } };
  }
}
