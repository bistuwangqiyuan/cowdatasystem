/**
 * Supabase Client Configuration
 * 
 * 初始化Supabase客户端实例,用于与Supabase数据库和服务交互。
 * 
 * @module lib/supabase
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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
 * 创建一个"已损坏"的桩客户端：所有 from(...).select/insert/update/delete 等链式
 * 调用都返回 { data: null, error: <message> }，避免 SSR 在 Supabase 不可用
 * （缺失环境变量、项目被删除、DNS 故障等）时抛出未捕获异常导致 500。
 *
 * 这是防御性兜底。与 services/* 中的 try/catch 配合，确保页面始终能渲染空状态。
 */
function createStubClient(reason: string): SupabaseClient<Database> {
  const stubError = { message: `Supabase unavailable: ${reason}`, details: '', hint: '', code: 'SUPABASE_UNAVAILABLE' } as const;
  const stubResult = { data: null, error: stubError, count: null, status: 0, statusText: '' } as const;

  // 任意链式方法都返回自身，await 时 resolve 为 stubResult。
  const builder: any = new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === 'then') {
        return (resolve: any) => resolve(stubResult);
      }
      return () => builder;
    },
    apply() {
      return builder;
    },
  });

  const client: any = {
    from: () => builder,
    rpc: () => builder,
    auth: {
      getUser: async () => ({ data: { user: null }, error: stubError }),
      getSession: async () => ({ data: { session: null }, error: stubError }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: stubError }),
      signUp: async () => ({ data: { user: null, session: null }, error: stubError }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      resetPasswordForEmail: async () => ({ data: null, error: stubError }),
      updateUser: async () => ({ data: { user: null }, error: stubError }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      subscribe: () => ({ unsubscribe: () => {} }),
      unsubscribe: () => {},
    }),
    removeChannel: () => Promise.resolve('ok'),
    storage: { from: () => builder },
  };

  return client as SupabaseClient<Database>;
}

let _supabase: SupabaseClient<Database>;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing environment variables (PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY). ' +
    '使用桩客户端，所有数据库操作将返回错误而不是抛异常，以避免 SSR 500。'
  );
  _supabase = createStubClient('missing env vars');
} else {
  try {
    _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'X-Client-Info': 'cowdatasystem/1.0.0',
        },
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (e: any) {
    console.warn('[Supabase] createClient failed, falling back to stub client:', e?.message);
    _supabase = createStubClient(`createClient threw: ${e?.message ?? 'unknown'}`);
  }
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
export const supabase = _supabase;

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

