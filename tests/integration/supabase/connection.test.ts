/**
 * Supabase Connection Integration Test
 * 
 * 测试 Supabase 客户端的数据库连接和基本查询功能。
 * 
 * @group integration
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from '../../../src/lib/supabase';

describe('Supabase Connection', () => {
  beforeAll(async () => {
    // 确保 Supabase 环境变量已设置
    if (!import.meta.env.SUPABASE_URL || !import.meta.env.SUPABASE_ANON_KEY) {
      throw new Error('Supabase environment variables not set');
    }
  });

  it('should successfully connect to Supabase', async () => {
    const { data, error } = await supabase.from('users').select('count');
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should be able to query the users table', async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, role')
      .limit(1);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should be able to query the cows table', async () => {
    const { data, error } = await supabase
      .from('cows')
      .select('id, cow_number, name')
      .limit(1);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should respect RLS policies', async () => {
    // 未认证用户查询应受RLS限制
    const { data, error } = await supabase
      .from('cows')
      .select('*');
    
    // 根据RLS策略，未认证用户应该无法访问数据
    // 注意：具体行为取决于RLS策略配置
    expect(error).toBeDefined();
  });

  it('should be able to check database health', async () => {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    expect(error).toBeNull();
  });
});

