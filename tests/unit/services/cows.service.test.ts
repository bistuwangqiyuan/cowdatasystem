/**
 * Cows Service Unit Tests (Neon-backed)
 *
 * 服务层数据库已经从 Supabase 切换到 Neon (@/lib/db)。本套用例围绕新的
 * sql 标签 + sql.query() 接口建立 mock，验证：
 *   - SQL 执行结果到 ServiceResponse 的映射
 *   - 错误传播
 *   - 统计聚合逻辑
 *
 * @group unit
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock 工厂会被提升到文件顶部，所以用 vi.hoisted 把 mock 对象提到同一时间点。
const { sqlMock } = vi.hoisted(() => {
  const fn: any = vi.fn();
  fn.query = vi.fn();
  return { sqlMock: fn };
});

vi.mock('../../../src/lib/db', () => ({
  sql: sqlMock,
  isDbAvailable: true,
  DB_UNAVAILABLE_ERROR: { message: 'Database unavailable', code: 'DB_UNAVAILABLE' },
  safeQuery: async (fn: () => Promise<any>, _ctx: string) => {
    try {
      const data = await fn();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message ?? String(err), code: 'DB_ERROR' } };
    }
  },
}));

// 必须在 mock 之后再 import 被测模块
import {
  createCow,
  getCows,
  getCowById,
  getCowByNumber,
  updateCow,
  deleteCow,
  searchCows,
  getCowStats,
} from '../../../src/services/cows.service';

beforeEach(() => {
  sqlMock.mockReset();
  sqlMock.query.mockReset();
});

describe('Cows Service (Neon)', () => {
  describe('createCow', () => {
    it('should insert and return the created cow', async () => {
      const mockCow = {
        id: 'cow-123',
        cow_number: 'TEST001',
        name: '测试牛',
        breed: 'holstein',
        gender: 'female',
        birth_date: '2022-01-01',
        entry_date: '2022-01-05',
        status: 'active',
      };
      sqlMock.mockResolvedValue([mockCow]);

      const result = await createCow({
        cow_number: 'TEST001',
        name: '测试牛',
        breed: 'holstein',
        gender: 'female',
        birth_date: '2022-01-01',
        entry_date: '2022-01-05',
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockCow);
      expect(sqlMock).toHaveBeenCalled();
    });

    it('should propagate database errors', async () => {
      sqlMock.mockRejectedValue(new Error('Duplicate cow_number'));
      const result = await createCow({
        cow_number: 'DUP001',
        breed: 'holstein',
        gender: 'female',
        birth_date: '2022-01-01',
        entry_date: '2022-01-05',
      });
      expect(result.data).toBeNull();
      expect(result.error?.message).toMatch(/Duplicate/);
    });
  });

  describe('getCows', () => {
    it('should return active cows from sql tag', async () => {
      const mockCows = [
        { id: 'cow-1', cow_number: 'CN001', breed: 'holstein', status: 'active' },
        { id: 'cow-2', cow_number: 'CN002', breed: 'jersey',   status: 'active' },
      ];
      sqlMock.mockResolvedValue(mockCows);

      const result = await getCows();

      expect(result.data).toEqual(mockCows);
      expect(result.error).toBeNull();
      expect(sqlMock).toHaveBeenCalled();
    });

    it('should pass breed filter as a parameter to the sql tag', async () => {
      sqlMock.mockResolvedValue([]);
      await getCows({ breed: 'holstein' });
      // sql 标签：第一个参数是 string[]（template parts），剩余是插值参数
      const callArgs = sqlMock.mock.calls[0];
      const interpolated = callArgs.slice(1).flat();
      expect(interpolated).toContain('holstein');
    });
  });

  describe('getCowById', () => {
    it('should return single cow', async () => {
      const mockCow = { id: 'cow-123', cow_number: 'CN001', name: '小花' };
      sqlMock.mockResolvedValue([mockCow]);

      const result = await getCowById('cow-123');

      expect(result.data).toEqual(mockCow);
      expect(result.error).toBeNull();
    });

    it('should return null data when no rows returned', async () => {
      sqlMock.mockResolvedValue([]);
      const result = await getCowById('missing-id');
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe('getCowByNumber', () => {
    it('should pass cow_number into the sql tag', async () => {
      sqlMock.mockResolvedValue([{ id: 'x', cow_number: 'CN001' }]);
      await getCowByNumber('CN001');
      const interpolated = sqlMock.mock.calls[0].slice(1).flat();
      expect(interpolated).toContain('CN001');
    });
  });

  describe('updateCow', () => {
    it('should update via sql.query and return the updated row', async () => {
      const updated = { id: 'cow-123', cow_number: 'CN001', name: '新名字' };
      sqlMock.query.mockResolvedValue([updated]);

      const result = await updateCow('cow-123', { name: '新名字' });

      expect(result.error).toBeNull();
      expect(result.data).toEqual(updated);
      expect(sqlMock.query).toHaveBeenCalledTimes(1);
      const [text, params] = sqlMock.query.mock.calls[0];
      expect(text).toMatch(/UPDATE cows SET/);
      expect(params[params.length - 1]).toBe('cow-123');
    });

    it('should still set updated_by when no other fields are provided', async () => {
      sqlMock.query.mockResolvedValue([{ id: 'cow-123', cow_number: 'CN001' }]);
      const result = await updateCow('cow-123', {});
      expect(result.error).toBeNull();
      expect(result.data?.id).toBe('cow-123');
      const [text, params] = sqlMock.query.mock.calls[0];
      expect(text).toMatch(/UPDATE cows SET/);
      expect(text).toMatch(/updated_by/);
      expect(params[params.length - 1]).toBe('cow-123');
    });
  });

  describe('deleteCow', () => {
    it('should soft-delete via the sql tag', async () => {
      sqlMock.mockResolvedValue([]);
      const result = await deleteCow('cow-123');
      expect(result.error).toBeNull();
      const interpolated = sqlMock.mock.calls[0].slice(1).flat();
      expect(interpolated).toContain('cow-123');
    });
  });

  describe('searchCows', () => {
    it('should pass an ILIKE pattern to the sql tag', async () => {
      sqlMock.mockResolvedValue([{ id: 'cow-1', cow_number: 'CN001' }]);
      const result = await searchCows('CN');
      expect(result.error).toBeNull();
      const interpolated = sqlMock.mock.calls[0].slice(1).flat();
      expect(interpolated.some((v: any) => typeof v === 'string' && v.includes('%CN%'))).toBe(true);
    });
  });

  describe('getCowStats', () => {
    it('should aggregate cow counts by status / gender / breed', async () => {
      sqlMock.mockResolvedValue([
        { id: 'cow-1', status: 'active', gender: 'female', breed: 'holstein' },
        { id: 'cow-2', status: 'active', gender: 'male',   breed: 'holstein' },
        { id: 'cow-3', status: 'culled', gender: 'female', breed: 'jersey' },
      ]);

      const result = await getCowStats();

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        total: 3,
        active: 2,
        male: 1,
        female: 2,
        by_breed: { holstein: 2, jersey: 1 },
      });
    });

    it('should handle empty dataset', async () => {
      sqlMock.mockResolvedValue([]);
      const result = await getCowStats();
      expect(result.data).toEqual({
        total: 0,
        active: 0,
        male: 0,
        female: 0,
        by_breed: {},
      });
    });
  });
});
