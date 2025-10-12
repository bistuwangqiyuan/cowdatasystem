/**
 * Authentication Utilities
 * 
 * 认证相关工具函数,封装Supabase Auth操作。
 * 
 * @module lib/auth
 */

import { supabase } from './supabase';

/**
 * 用户登录
 * 
 * @param email - 用户邮箱
 * @param password - 用户密码
 * @returns {Promise<{data: any, error: any}>} 登录结果
 * 
 * @example
 * ```typescript
 * const { data, error } = await signIn('user@example.com', 'password123');
 * if (error) {
 *   console.error('Login failed:', error.message);
 * } else {
 *   console.log('Logged in as:', data.user.email);
 * }
 * ```
 */
export async function signIn(email: string, password: string) {
  const result = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (result.error) {
    console.error('[Auth] Sign in error:', result.error.message);
  } else {
    console.log('[Auth] Sign in success:', result.data.user?.email);
  }
  
  return result;
}

/**
 * 用户注册
 * 
 * @param email - 用户邮箱
 * @param password - 用户密码
 * @param fullName - 用户全名
 * @returns {Promise<{data: any, error: any}>} 注册结果
 * 
 * @example
 * ```typescript
 * const { data, error } = await signUp('user@example.com', 'password123', '张三');
 * ```
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string
) {
  const result = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  
  if (result.error) {
    console.error('[Auth] Sign up error:', result.error.message);
  } else {
    console.log('[Auth] Sign up success:', result.data.user?.email);
  }
  
  return result;
}

/**
 * 用户登出
 * 
 * @returns {Promise<{error: any}>} 登出结果
 * 
 * @example
 * ```typescript
 * const { error } = await signOut();
 * if (!error) {
 *   window.location.href = '/login';
 * }
 * ```
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('[Auth] Sign out error:', error.message);
  } else {
    console.log('[Auth] Sign out success');
  }
  
  return { error };
}

/**
 * 获取当前用户
 * 
 * @returns {Promise<User | null>} 当前用户或null
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('[Auth] Get user error:', error.message);
    return null;
  }
  
  return user;
}

/**
 * 获取用户角色
 * 
 * @param userId - 用户ID
 * @returns {Promise<string | null>} 用户角色('admin' | 'staff' | 'guest')或null
 * 
 * @example
 * ```typescript
 * const role = await getUserRole(user.id);
 * if (role === 'admin') {
 *   // 管理员权限
 * }
 * ```
 */
export async function getUserRole(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('[Auth] Get user role error:', error.message);
    return null;
  }
  
  return data?.role || null;
}

/**
 * 获取当前用户的完整信息(包括角色)
 * 
 * @returns {Promise<{user: User, role: string} | null>} 用户信息和角色
 */
export async function getCurrentUserWithRole() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }
  
  const role = await getUserRole(user.id);
  
  return {
    user,
    role: role || 'guest',
  };
}

/**
 * 检查当前用户是否为管理员
 * 
 * @returns {Promise<boolean>} 是否为管理员
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  
  if (!user) {
    return false;
  }
  
  const role = await getUserRole(user.id);
  return role === 'admin';
}

/**
 * 检查当前用户是否为养殖员或管理员
 * 
 * @returns {Promise<boolean>} 是否为养殖员或管理员
 */
export async function isStaffOrAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  
  if (!user) {
    return false;
  }
  
  const role = await getUserRole(user.id);
  return role === 'admin' || role === 'staff';
}

/**
 * 重置密码请求
 * 
 * @param email - 用户邮箱
 * @returns {Promise<{data: any, error: any}>} 重置密码结果
 * 
 * @example
 * ```typescript
 * const { error } = await requestPasswordReset('user@example.com');
 * if (!error) {
 *   alert('密码重置邮件已发送');
 * }
 * ```
 */
export async function requestPasswordReset(email: string) {
  const result = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (result.error) {
    console.error('[Auth] Password reset error:', result.error.message);
  }
  
  return result;
}

/**
 * 更新密码
 * 
 * @param newPassword - 新密码
 * @returns {Promise<{data: any, error: any}>} 更新结果
 */
export async function updatePassword(newPassword: string) {
  const result = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  if (result.error) {
    console.error('[Auth] Update password error:', result.error.message);
  }
  
  return result;
}

/**
 * 更新用户信息
 * 
 * @param updates - 要更新的字段
 * @returns {Promise<{data: any, error: any}>} 更新结果
 */
export async function updateUser(updates: {
  email?: string;
  data?: Record<string, any>;
}) {
  const result = await supabase.auth.updateUser(updates);
  
  if (result.error) {
    console.error('[Auth] Update user error:', result.error.message);
  }
  
  return result;
}

