/**
 * Supabase Client Configuration
 * 
 * 初始化Supabase客户端实例,用于与Supabase数据库和服务交互。
 * 
 * @module lib/supabase
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase.types';

/**
 * Supabase项目URL
 * @constant
 */
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;

/**
 * Supabase匿名密钥(公开密钥,用于客户端)
 * @constant
 */
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

/**
 * 验证环境变量是否配置
 * @throws {Error} 如果环境变量未配置
 */
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.\n' +
    'Required: SUPABASE_URL, SUPABASE_ANON_KEY'
  );
}

/**
 * Supabase客户端实例(单例)
 * 
 * @example
 * ```typescript
 * import { supabase } from '@/lib/supabase';
 * 
 * // 查询数据
 * const { data, error } = await supabase
 *   .from('cows')
 *   .select('*')
 *   .eq('status', 'active');
 * ```
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 持久化session到localStorage
    persistSession: true,
    // 自动刷新token
    autoRefreshToken: true,
    // 检测session变化
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      // 自定义头部(可选)
      'X-Client-Info': 'cowdatasystem/1.0.0',
    },
  },
  db: {
    // 数据库schema(默认public)
    schema: 'public',
  },
  realtime: {
    // Realtime配置
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * 获取当前认证用户
 * 
 * @returns {Promise<User | null>} 当前用户或null
 * 
 * @example
 * ```typescript
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log('User ID:', user.id);
 * }
 * ```
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
  
  return user;
}

/**
 * 获取当前session
 * 
 * @returns {Promise<Session | null>} 当前session或null
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }
  
  return session;
}

/**
 * 检查用户是否已登录
 * 
 * @returns {Promise<boolean>} 是否已登录
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * 监听认证状态变化
 * 
 * @param callback - 状态变化时的回调函数
 * @returns {() => void} 取消订阅的函数
 * 
 * @example
 * ```typescript
 * const unsubscribe = onAuthStateChange((event, session) => {
 *   if (event === 'SIGNED_IN') {
 *     console.log('User signed in:', session.user);
 *   }
 * });
 * 
 * // 取消订阅
 * unsubscribe();
 * ```
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    callback
  );
  
  // 返回取消订阅函数
  return () => {
    subscription.unsubscribe();
  };
}

// 导出类型以供其他文件使用
export type { Database } from '@/types/supabase.types';

