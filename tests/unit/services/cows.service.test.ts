/**
 * Cows Service Unit Tests
 * 
 * 测试奶牛服务层的所有CRUD操作和业务逻辑。
 * 
 * @group unit
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
import { supabase } from '../../../src/lib/supabase';

// Mock Supabase 客户端
vi.mock('../../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      select: vi.fn(() => ({
        is: vi.fn(() => ({
          order: vi.fn(() => ({
            eq: vi.fn(),
          })),
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
          single: vi.fn(),
          or: vi.fn(() => ({
            limit: vi.fn(),
          })),
        })),
        eq: vi.fn(() => ({
          is: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
  },
}));

describe('Cows Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock 默认用户
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    } as any);
  });

  describe('createCow', () => {
    it('should create a new cow with valid data', async () => {
      const mockCow = {
        id: 'cow-123',
        cow_number: 'TEST001',
        name: '测试牛',
        breed: 'holstein' as const,
        gender: 'female' as const,
        birth_date: '2022-01-01',
        entry_date: '2022-01-05',
        status: 'active' as const,
        created_by: 'user-123',
        updated_by: 'user-123',
      };

      const mockChain = {
        single: vi.fn().mockResolvedValue({ data: mockCow, error: null }),
      };
      const mockSelect = vi.fn().mockReturnValue(mockChain);
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      const result = await createCow({
        cow_number: 'TEST001',
        name: '测试牛',
        breed: 'holstein',
        gender: 'female',
        birth_date: '2022-01-01',
        entry_date: '2022-01-05',
      });

      expect(result.data).toEqual(mockCow);
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('cows');
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should fail when user is not logged in', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await createCow({
        cow_number: 'TEST001',
        breed: 'holstein',
        gender: 'female',
        birth_date: '2022-01-01',
        entry_date: '2022-01-05',
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: '用户未登录' });
    });

    it('should handle database errors', async () => {
      const mockError = { message: 'Duplicate cow_number', code: '23505' };
      const mockChain = {
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      const mockSelect = vi.fn().mockReturnValue(mockChain);
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      const result = await createCow({
        cow_number: 'DUP001',
        breed: 'holstein',
        gender: 'female',
        birth_date: '2022-01-01',
        entry_date: '2022-01-05',
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getCows', () => {
    it('should return all active cows', async () => {
      const mockCows = [
        { id: 'cow-1', cow_number: 'CN001', breed: 'holstein', status: 'active', deleted_at: null },
        { id: 'cow-2', cow_number: 'CN002', breed: 'jersey', status: 'active', deleted_at: null },
      ];

      const mockQuery = {
        order: vi.fn().mockResolvedValue({ data: mockCows, error: null }),
      };
      const mockIs = vi.fn().mockReturnValue(mockQuery);
      const mockSelect = vi.fn().mockReturnValue({ is: mockIs });
      
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const result = await getCows();

      expect(result.data).toEqual(mockCows);
      expect(result.error).toBeNull();
      expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
    });

    it('should filter cows by breed', async () => {
      const mockCows = [
        { id: 'cow-1', cow_number: 'CN001', breed: 'holstein', status: 'active' },
      ];

      // 源码链路：from().select().is().order().eq() （filter 在 order 之后追加）
      // .eq() 的返回值需要是可 await 的，所以用 thenable 模拟最终结果
      const finalResult = { data: mockCows, error: null };
      const mockEq = vi.fn().mockResolvedValue(finalResult);
      const mockOrder = vi.fn().mockReturnValue({ eq: mockEq });
      const mockIs = vi.fn().mockReturnValue({ order: mockOrder, eq: mockEq });
      const mockSelect = vi.fn().mockReturnValue({ is: mockIs });

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const result = await getCows({ breed: 'holstein' });

      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].breed).toBe('holstein');
      expect(mockEq).toHaveBeenCalledWith('breed', 'holstein');
    });

    it('should filter cows by status', async () => {
      const mockEq = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockOrder = vi.fn().mockReturnValue({ eq: mockEq });
      const mockIs = vi.fn().mockReturnValue({ order: mockOrder, eq: mockEq });
      const mockSelect = vi.fn().mockReturnValue({ is: mockIs });

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      await getCows({ status: 'culled' });

      expect(mockEq).toHaveBeenCalledWith('status', 'culled');
    });
  });

  describe('getCowById', () => {
    it('should return cow by ID', async () => {
      const mockCow = {
        id: 'cow-123',
        cow_number: 'CN001',
        name: '小花',
        breed: 'holstein',
      };

      const mockChain = {
        single: vi.fn().mockResolvedValue({ data: mockCow, error: null }),
      };
      const mockIs = vi.fn().mockReturnValue(mockChain);
      const mockEq = vi.fn().mockReturnValue({ is: mockIs });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const result = await getCowById('cow-123');

      expect(result.data).toEqual(mockCow);
      expect(result.error).toBeNull();
      expect(mockEq).toHaveBeenCalledWith('id', 'cow-123');
    });

    it('should return error for non-existent cow', async () => {
      const mockError = { message: 'Cow not found' };
      const mockChain = {
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      const mockIs = vi.fn().mockReturnValue(mockChain);
      const mockEq = vi.fn().mockReturnValue({ is: mockIs });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const result = await getCowById('invalid-id');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getCowByNumber', () => {
    it('should return cow by number', async () => {
      const mockCow = {
        id: 'cow-123',
        cow_number: 'CN001',
        name: '小花',
      };

      const mockChain = {
        single: vi.fn().mockResolvedValue({ data: mockCow, error: null }),
      };
      const mockIs = vi.fn().mockReturnValue(mockChain);
      const mockEq = vi.fn().mockReturnValue({ is: mockIs });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const result = await getCowByNumber('CN001');

      expect(result.data).toEqual(mockCow);
      expect(mockEq).toHaveBeenCalledWith('cow_number', 'CN001');
    });
  });

  describe('updateCow', () => {
    it('should update cow successfully', async () => {
      const mockUpdatedCow = {
        id: 'cow-123',
        cow_number: 'CN001',
        name: '新名字',
        updated_by: 'user-123',
      };

      const mockChain = {
        single: vi.fn().mockResolvedValue({ data: mockUpdatedCow, error: null }),
      };
      const mockSelect = vi.fn().mockReturnValue(mockChain);
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      const result = await updateCow('cow-123', { name: '新名字' });

      expect(result.data).toEqual(mockUpdatedCow);
      expect(result.error).toBeNull();
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should fail when user is not logged in', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await updateCow('cow-123', { name: '新名字' });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: '用户未登录' });
    });
  });

  describe('deleteCow', () => {
    it('should soft delete cow successfully', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      const result = await deleteCow('cow-123');

      expect(result.error).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(String),
          updated_by: 'user-123',
        })
      );
    });

    it('should fail when user is not logged in', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await deleteCow('cow-123');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: '用户未登录' });
    });
  });

  describe('searchCows', () => {
    it('should search cows by keyword', async () => {
      const mockCows = [
        { id: 'cow-1', cow_number: 'CN001', name: '小花' },
        { id: 'cow-2', cow_number: 'CN002', name: '小红' },
      ];

      const mockLimit = vi.fn().mockResolvedValue({ data: mockCows, error: null });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockIs = vi.fn().mockReturnValue({ order: mockOrder });
      const mockOr = vi.fn().mockReturnValue({ is: mockIs });
      const mockSelect = vi.fn().mockReturnValue({ or: mockOr });
      
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const result = await searchCows('CN');

      expect(result.data).toEqual(mockCows);
      expect(result.error).toBeNull();
      expect(mockOr).toHaveBeenCalledWith(expect.stringContaining('CN'));
    });

    it('should limit search results to 50', async () => {
      const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockIs = vi.fn().mockReturnValue({ order: mockOrder });
      const mockOr = vi.fn().mockReturnValue({ is: mockIs });
      const mockSelect = vi.fn().mockReturnValue({ or: mockOr });
      
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      await searchCows('test');

      expect(mockLimit).toHaveBeenCalledWith(50);
    });
  });

  describe('getCowStats', () => {
    it('should return statistics', async () => {
      const mockCows = [
        { id: 'cow-1', status: 'active', gender: 'female', breed: 'holstein' },
        { id: 'cow-2', status: 'active', gender: 'male', breed: 'holstein' },
        { id: 'cow-3', status: 'culled', gender: 'female', breed: 'jersey' },
      ];

      const mockIs = vi.fn().mockResolvedValue({ data: mockCows, error: null });
      const mockSelect = vi.fn().mockReturnValue({ is: mockIs });
      
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const result = await getCowStats();

      expect(result.data).toEqual({
        total: 3,
        active: 2,
        male: 1,
        female: 2,
        by_breed: {
          holstein: 2,
          jersey: 1,
        },
      });
      expect(result.error).toBeNull();
    });

    it('should handle empty dataset', async () => {
      const mockIs = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockSelect = vi.fn().mockReturnValue({ is: mockIs });
      
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

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

