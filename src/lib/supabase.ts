/**
 * Supabase 兼容 stub
 *
 * 数据层已迁移到 Netlify 内置的 Neon Postgres（见 src/lib/db.ts）。
 * 本文件保留是为了：
 *   1. 让仍然 `import { supabase } from '@/lib/supabase'` 的旧代码不立刻断掉；
 *   2. 让 Layout/Header 等客户端脚本里 `onAuthStateChange / getCurrentUser` 之类的
 *      调用不会抛异常（直接返回未登录态、空订阅）。
 *
 * 这里完全不引入 @supabase/supabase-js 运行时实例，避免在 Netlify 函数里加载一份
 * 已经不再使用的 SDK。所有调用形态都返回 { data: null, error: <stub> }。
 *
 * @module lib/supabase
 */

const STUB_ERROR = {
  message: 'Supabase has been removed; the app now uses Neon (src/lib/db.ts).',
  details: '',
  hint: '',
  code: 'SUPABASE_REMOVED',
} as const;

const STUB_RESULT = { data: null, error: STUB_ERROR, count: null, status: 0, statusText: '' } as const;

function makeChainable(): any {
  // 返回一个对象，任意方法调用都会返回自身；await 时 resolve 为 STUB_RESULT。
  const builder: any = new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === 'then') {
        return (resolve: any) => resolve(STUB_RESULT);
      }
      return () => builder;
    },
    apply() {
      return builder;
    },
  });
  return builder;
}

export const supabase: any = {
  from: () => makeChainable(),
  rpc:  () => makeChainable(),
  auth: {
    getUser:    async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: STUB_ERROR }),
    signUp:             async () => ({ data: { user: null, session: null }, error: STUB_ERROR }),
    signOut:            async () => ({ error: null }),
    onAuthStateChange: (_cb: (...args: any[]) => any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    resetPasswordForEmail: async () => ({ data: null, error: STUB_ERROR }),
    updateUser:            async () => ({ data: { user: null }, error: STUB_ERROR }),
  },
  channel: () => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    subscribe: () => ({ unsubscribe: () => {} }),
    unsubscribe: () => {},
  }),
  removeChannel: () => Promise.resolve('ok'),
  storage: { from: () => makeChainable() },
};

export async function getCurrentUser() { return null; }
export async function getCurrentSession() { return null; }
export async function isAuthenticated(): Promise<boolean> { return false; }

export function onAuthStateChange(_cb: (event: string, session: any) => void): () => void {
  return () => {};
}

export type { Database } from '@/types/supabase.types';
