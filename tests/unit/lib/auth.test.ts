/**
 * Authentication Functions Unit Test
 * 
 * 测试认证相关函数的功能和错误处理。
 * 
 * @group unit
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signIn, signOut, getCurrentUser, getUserRole } from '../../../src/lib/auth';
import { supabase } from '../../../src/lib/supabase';

// Mock Supabase 客户端
vi.mock('../../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('Auth Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in with valid credentials', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = { access_token: 'token-123' };
      
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      } as any);

      const result = await signIn('test@example.com', 'password123');

      expect(result.data.user).toEqual(mockUser);
      expect(result.data.session).toEqual(mockSession);
      expect(result.error).toBeNull();
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should fail with invalid credentials', async () => {
      const mockError = { message: 'Invalid credentials' };
      
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      } as any);

      const result = await signIn('test@example.com', 'wrongpassword');

      expect(result.data.user).toBeNull();
      expect(result.error).toEqual(mockError);
    });

    it('should handle network errors', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue(
        new Error('Network error')
      );

      await expect(signIn('test@example.com', 'password123')).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as any);

      const result = await signOut();

      expect(result.error).toBeNull();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      const mockError = { message: 'Sign out failed' };
      
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: mockError } as any);

      const result = await signOut();

      expect(result.error).toEqual(mockError);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const user = await getCurrentUser();

      expect(user).toEqual(mockUser);
      expect(supabase.auth.getUser).toHaveBeenCalled();
    });

    it('should return null when no user is logged in', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('getUserRole', () => {
    it('should return user role for valid user', async () => {
      const mockData = { role: 'admin' };
      const mockChain = {
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      const mockEq = vi.fn().mockReturnValue(mockChain);
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const role = await getUserRole('user-123');

      expect(role).toBe('admin');
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(mockSelect).toHaveBeenCalledWith('role');
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
    });

    it('should return undefined for non-existent user', async () => {
      const mockChain = {
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      const mockEq = vi.fn().mockReturnValue(mockChain);
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const role = await getUserRole('invalid-user-id');

      expect(role).toBeUndefined();
    });

    it('should handle database errors', async () => {
      const mockError = { message: 'Database error' };
      const mockChain = {
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      const mockEq = vi.fn().mockReturnValue(mockChain);
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const role = await getUserRole('user-123');

      expect(role).toBeUndefined();
    });
  });
});

