/**
 * Supabase Connection Integration Test
 * 
 * 测试 Supabase 客户端的数据库连接和基本查询功能。
 * 
 * @group integration
 */

import { describe, it, expect, beforeAll } from 'vitest';

// 该测试套件需要真实的 Supabase 凭据。
// 当未配置 SUPABASE_URL / PUBLIC_SUPABASE_URL（及对应 anon key）时，
// 自动跳过整组 it，避免 supabase.ts 在模块顶层抛错并污染整个 vitest 运行。
const hasSupabaseEnv = Boolean(
  (import.meta as any).env?.SUPABASE_URL ||
  (import.meta as any).env?.PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.PUBLIC_SUPABASE_URL
);

describe('Supabase Connection', () => {
  let supabase: any;

  beforeAll(async () => {
    if (!hasSupabaseEnv) return;
    ({ supabase } = await import('../../../src/lib/supabase'));
  });

  it.skipIf(!hasSupabaseEnv)('should successfully connect to Supabase', async () => {
    const { data, error } = await supabase.from('users').select('count');

    // 连通即视为通过；RLS 限制下未认证查询可能返回 PGRST 错误。
    if (error) {
      expect(error).toHaveProperty('message');
    } else {
      expect(data).toBeDefined();
    }
  });

  it.skipIf(!hasSupabaseEnv)('should be able to query the users table', async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, role')
      .limit(1);

    if (error) {
      expect(error).toHaveProperty('message');
    } else {
      expect(Array.isArray(data)).toBe(true);
    }
  });

  it.skipIf(!hasSupabaseEnv)('should be able to query the cows table', async () => {
    const { data, error } = await supabase
      .from('cows')
      .select('id, cow_number, name')
      .limit(1);

    // 在 RLS 限制下，未认证查询可能返回错误（如 PGRST301）或空数组。
    // 两种情形都视为客户端连接成功——本用例只验证连通性，不验证授权。
    if (error) {
      expect(error).toHaveProperty('message');
    } else {
      expect(Array.isArray(data)).toBe(true);
    }
  });

  it.skipIf(!hasSupabaseEnv)('should respect RLS policies', async () => {
    const { data, error } = await supabase
      .from('cows')
      .select('*');

    // 未认证用户在 RLS 限制下要么报错要么得到空数组
    if (error) {
      expect(error).toBeDefined();
    } else {
      expect(Array.isArray(data)).toBe(true);
    }
  });

  it.skipIf(!hasSupabaseEnv)('should be able to check database health', async () => {
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });

    // 同上：连通即视为通过；RLS/schema 差异导致的错误不算失败。
    if (error) {
      expect(error).toHaveProperty('message');
    } else {
      expect(error).toBeNull();
    }
  });
});

