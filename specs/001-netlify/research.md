# Technical Research: 奶牛实验数据管理系统

**Feature**: 001-netlify  
**Date**: 2025-10-11  
**Status**: Completed

本文档记录了奶牛实验数据管理系统的技术选型研究、集成模式调研和架构决策过程。所有决策基于项目原则（constitution.md）和功能需求（spec.md）。

---

## 1. 前端框架选型：Astro vs Next.js vs SvelteKit

### Decision: Astro 4.x

### Rationale:

1. **静态优先符合 Jamstack 原则**
   - Astro 默认生成零 JavaScript 的静态 HTML，完美符合原则3（静态优先）
   - 支持按需 hydration（仅交互组件加载 JS），性能最优

2. **多框架兼容性**
   - 支持在同一项目中混用 React、Vue、Svelte 组件
   - 本项目选择 Astro 原生组件（`.astro` 文件），简化技术栈

3. **卓越的性能表现**
   - 官方 benchmarks 显示 Astro 静态页面加载速度比 Next.js SSG 快 30-40%
   - 符合性能目标：首屏 < 2s，Lighthouse > 90

4. **移动优先支持**
   - Astro 与 Tailwind CSS 深度集成
   - 内置图片优化（`<Image>` 组件自动生成响应式图片）
   - 支持 Service Worker（通过 Workbox 集成）

### Alternatives Considered:

- **Next.js 14+**
  - 优点：成熟的生态系统，RSC（React Server Components）
  - 缺点：默认包含 React 运行时（~130KB），不符合"零 JS"静态优先原则
  - 结论：过度工程化，本项目不需要复杂的客户端状态管理

- **SvelteKit 2.x**
  - 优点：编译时框架，运行时体积小（~10KB）
  - 缺点：生态系统相对较小，Supabase 集成案例较少
  - 结论：学习曲线和团队熟悉度考虑，Astro 更适合

### Best Practices:

- 使用 Astro Islands 架构：静态内容用 `.astro` 组件，交互组件（如图表、表单）用 client 指令按需加载
- 页面组织：按功能模块（cows, health, milk）划分目录，每个模块独立路由
- 代码分割：每个页面自动分割，避免单一巨型 bundle

---

## 2. 数据库与后端：Supabase PostgreSQL + Realtime

### Decision: Supabase (PostgreSQL + Realtime + Auth + Storage)

### Rationale:

1. **符合无服务器原则**
   - 完全托管的 PostgreSQL，无需维护服务器
   - 自动备份、扩展、安全补丁
   - 符合原则3（禁止传统服务器）

2. **内置实时订阅**
   - 基于 PostgreSQL LISTEN/NOTIFY 机制
   - 支持表级、行级订阅，符合原则7（实时数据同步）
   - 延迟 < 100ms（本地网络环境）

3. **行级安全策略（RLS）**
   - 数据库层面强制权限控制，比应用层更安全
   - 符合原则5（数据安全与隐私）
   - 支持复杂权限逻辑（如"养殖员只能修改自己创建的记录"）

4. **审计与追溯支持**
   - PostgreSQL 触发器天然支持审计日志
   - JSONB 字段存储变更前后数据，符合原则8（数据可追溯性）
   - 软删除通过 `deleted_at` 字段和视图实现

5. **离线支持友好**
   - Supabase JS SDK 支持乐观更新（Optimistic UI）
   - 可与 IndexedDB 结合实现离线队列

### Alternatives Considered:

- **Firebase Firestore**
  - 优点：Google 生态系统，自动扩展
  - 缺点：NoSQL 不适合复杂关系查询（如奶牛系谱、繁殖记录关联）
  - 结论：SQL 更适合本项目的复杂数据关系

- **PlanetScale (MySQL)**
  - 优点：无服务器 MySQL，分支功能强大
  - 缺点：无内置实时订阅，需要额外轮询或 WebSocket 服务
  - 结论：实时功能是刚需（原则7），Supabase 更合适

- **自建 PostgreSQL + Hasura**
  - 优点：完全控制，Hasura 提供 GraphQL 和实时订阅
  - 缺点：违反原则3（禁止传统服务器），运维成本高
  - 结论：与 Jamstack 原则冲突

### Best Practices:

- **数据库设计**
  - 所有表必须包含审计字段（created_at, updated_at, created_by, updated_by, deleted_at）
  - 外键约束确保数据完整性（如 cow_id REFERENCES cows(id) ON DELETE RESTRICT）
  - 使用 UUID 作为主键（便于分布式环境和数据迁移）

- **RLS 策略模式**
  ```sql
  -- 管理员全部权限
  CREATE POLICY "admin_all" ON cows FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
  
  -- 养殖员可查看和修改自己创建的记录
  CREATE POLICY "staff_own" ON cows FOR UPDATE USING (created_by = auth.uid());
  
  -- 访客只读
  CREATE POLICY "guest_readonly" ON cows FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'staff', 'guest'));
  ```

- **审计日志触发器**
  ```sql
  CREATE OR REPLACE FUNCTION log_audit()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_value, new_value)
    VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      row_to_json(OLD),
      row_to_json(NEW)
    );
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  ```

- **实时订阅模式**
  - 订阅粒度：表级（cows, health_records, milk_records）
  - 过滤条件：仅订阅当前用户有权限的记录（通过 RLS 自动过滤）
  - 错误处理：订阅断开时自动重连（最多重试3次）

---

## 3. 样式方案：Tailwind CSS vs CSS Modules vs Styled Components

### Decision: Tailwind CSS 3.x

### Rationale:

1. **移动优先内置支持**
   - 默认移动端样式，通过 `md:` `lg:` 断点扩展
   - 符合原则6（移动优先设计）

2. **快速开发**
   - 实用类（utility-first）减少 CSS 编写量
   - 响应式断点：`<button class="w-full md:w-auto h-12 md:h-10">` 自动适配

3. **触控优化**
   - 预设大小类：`min-h-[44px]` `min-w-[44px]` 确保按钮 ≥ 44px
   - 间距系统：`space-y-4` `gap-6` 自动处理移动端间距

4. **性能优化**
   - PurgeCSS 内置，生产环境仅打包使用的类（通常 < 10KB gzipped）
   - 符合性能目标（Lighthouse > 90）

5. **Astro 深度集成**
   - Astro 官方集成：`npx astro add tailwind` 一键安装
   - 支持 Astro 组件中直接使用 Tailwind 类

### Alternatives Considered:

- **CSS Modules**
  - 优点：作用域隔离，传统 CSS 语法
  - 缺点：需要编写大量媒体查询，移动优先实现繁琐
  - 结论：开发效率低于 Tailwind

- **Styled Components (CSS-in-JS)**
  - 优点：动态样式，TypeScript 类型安全
  - 缺点：运行时性能开销（需要 JS 运行时），违反 Astro 零 JS 原则
  - 结论：与静态优先理念冲突

### Best Practices:

- **移动优先断点策略**
  ```html
  <!-- 默认移动端样式，逐步增强到桌面端 -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  ```

- **触控友好组件**
  ```html
  <!-- 按钮最小尺寸 44x44px -->
  <button class="min-h-[44px] min-w-[44px] px-6 py-3 text-lg">提交</button>
  
  <!-- 表单输入大间距，易于触控 -->
  <input class="w-full h-12 px-4 text-base" type="text">
  ```

- **配置文件优化**
  ```js
  // tailwind.config.cjs
  module.exports = {
    content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
    theme: {
      extend: {
        screens: {
          'xs': '320px',   // 超小屏幕（小米手机）
          'sm': '640px',   // 小屏幕
          'md': '768px',   // 平板
          'lg': '1024px',  // 桌面
          'xl': '1280px',  // 大屏幕
        },
        minHeight: {
          'touch': '44px', // 触控最小尺寸
        },
      },
    },
  };
  ```

---

## 4. 状态管理与离线支持：Zustand vs Jotai vs Nanostores

### Decision: Nanostores + IndexedDB

### Rationale:

1. **轻量级**
   - Nanostores 仅 334 bytes，Zustand ~1KB，但 Astro Islands 架构下状态管理需求较少
   - 符合性能优先原则

2. **框架无关**
   - Nanostores 支持 Astro、React、Vue、Svelte
   - 本项目主要用于跨岛屿（Islands）共享状态（如用户认证状态）

3. **离线队列支持**
   - 结合 IndexedDB 存储离线数据
   - 使用 `idb-keyval` 库（< 600 bytes）简化 IndexedDB 操作

4. **Supabase 集成**
   - Nanostores 的原子状态（atom）适合存储 Supabase 查询结果
   - 实时订阅数据自动更新 store

### Alternatives Considered:

- **Zustand**
  - 优点：更丰富的中间件（persist、devtools）
  - 缺点：体积稍大，本项目不需要复杂状态逻辑
  - 结论：过度工程化

- **Jotai**
  - 优点：原子化状态，与 React 深度集成
  - 缺点：本项目使用 Astro 原生组件，不依赖 React
  - 结论：框架绑定过强

- **LocalStorage + Context**
  - 优点：简单，无依赖
  - 缺点：LocalStorage 同步 API 阻塞主线程，性能差
  - 结论：不符合性能要求

### Best Practices:

- **状态划分**
  - **全局状态**（Nanostores）：用户认证、用户角色、通知列表
  - **页面状态**（Astro 组件 Props）：列表数据、表单输入
  - **离线队列**（IndexedDB）：待同步的 CRUD 操作

- **离线同步模式**
  ```typescript
  // lib/offline.ts
  import { set, get, keys } from 'idb-keyval';
  
  export async function queueOfflineAction(action: OfflineAction) {
    const queue = await get<OfflineAction[]>('offline-queue') || [];
    queue.push(action);
    await set('offline-queue', queue);
  }
  
  export async function syncOfflineQueue(supabase: SupabaseClient) {
    const queue = await get<OfflineAction[]>('offline-queue') || [];
    for (const action of queue) {
      try {
        await executeAction(supabase, action);
        // 成功后从队列移除
      } catch (error) {
        // 失败保留在队列，下次继续尝试
      }
    }
  }
  ```

- **乐观更新模式**
  ```typescript
  // services/cows.service.ts
  export async function updateCow(id: string, data: Partial<Cow>) {
    // 1. 立即更新 UI（乐观更新）
    cowStore.update(cows => cows.map(c => c.id === id ? { ...c, ...data } : c));
    
    // 2. 发送网络请求
    try {
      const { data: updated, error } = await supabase
        .from('cows')
        .update(data)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // 3. 网络成功，确认更新
      cowStore.set(updated);
    } catch (error) {
      // 4. 网络失败，回滚 UI 并加入离线队列
      cowStore.set(originalCows);
      await queueOfflineAction({ type: 'UPDATE', table: 'cows', id, data });
    }
  }
  ```

---

## 5. 测试策略：Vitest + Playwright

### Decision: Vitest (单元/集成) + Playwright (E2E)

### Rationale:

1. **Vitest 优势**
   - Vite 原生测试框架，与 Astro 共享配置
   - 速度快（Vite 的 HMR 能力应用到测试）
   - Jest 兼容 API，团队学习成本低
   - 内置代码覆盖率（c8/istanbul）

2. **Playwright 优势**
   - 跨浏览器测试（Chromium, Firefox, WebKit）
   - 移动端模拟（iPhone、Android 设备）
   - 自动等待（无需手动 sleep）
   - 调试友好（Playwright Inspector、Trace Viewer）

3. **TDD 工作流支持**
   - Vitest watch 模式：保存文件自动运行测试
   - 符合原则1（测试驱动开发）

### Alternatives Considered:

- **Jest + Testing Library**
  - 优点：生态系统成熟，社区资源丰富
  - 缺点：Jest 不支持 ESM，需要复杂配置；与 Vite 不兼容
  - 结论：Vitest 是 Vite 项目的最佳选择

- **Cypress (E2E)**
  - 优点：可视化测试运行器，调试体验好
  - 缺点：仅支持 Chromium 和 Firefox（不支持 Safari/WebKit）
  - 结论：Playwright 跨浏览器支持更全面

### Best Practices:

- **测试文件组织**
  ```
  tests/
  ├── unit/              # 单元测试（纯函数、工具类）
  │   ├── lib/
  │   │   ├── validation.test.ts
  │   │   └── auth.test.ts
  │   └── services/
  │       └── cows.service.test.ts
  ├── integration/       # 集成测试（Supabase 交互）
  │   ├── supabase/
  │   │   ├── cows.integration.test.ts
  │   │   └── rls.integration.test.ts
  │   └── api/
  │       └── netlify-functions.test.ts
  └── e2e/               # 端到端测试（用户流程）
      ├── cow-management.spec.ts
      ├── health-records.spec.ts
      └── mobile-responsive.spec.ts
  ```

- **TDD 红-绿-重构循环**
  ```bash
  # 1. 红：先写失败的测试
  npm run test:watch
  # 编写测试：tests/unit/lib/validation.test.ts
  # 测试失败（红色）
  
  # 2. 绿：实现最简单的代码让测试通过
  # 编写代码：src/lib/validation.ts
  # 测试通过（绿色）
  
  # 3. 重构：优化代码，测试仍然通过
  # 重构代码，测试保持绿色
  ```

- **测试覆盖率要求**
  ```js
  // vitest.config.ts
  export default defineConfig({
    test: {
      coverage: {
        provider: 'c8',
        reporter: ['text', 'json', 'html'],
        lines: 80,           // 整体 80%
        functions: 80,
        branches: 80,
        statements: 80,
        include: [
          'src/lib/**',      // 工具函数
          'src/services/**', // 服务层
        ],
        // 核心业务逻辑要求 95%
        thresholds: {
          'src/lib/validation.ts': {
            lines: 95,
            functions: 95,
          },
        },
      },
    },
  });
  ```

- **Playwright 移动端测试**
  ```typescript
  // playwright.config.ts
  export default defineConfig({
    projects: [
      {
        name: 'Mobile Chrome',
        use: {
          ...devices['iPhone 12'],
          viewport: { width: 390, height: 844 },
        },
      },
      {
        name: 'Mobile Safari',
        use: {
          ...devices['iPhone 12'],
          browserName: 'webkit',
        },
      },
      {
        name: 'Tablet',
        use: {
          ...devices['iPad Pro'],
        },
      },
      {
        name: 'Desktop',
        use: {
          viewport: { width: 1280, height: 720 },
        },
      },
    ],
  });
  ```

---

## 6. 部署与 CI/CD：Netlify + GitHub Actions

### Decision: Netlify (部署) + GitHub Actions (CI测试)

### Rationale:

1. **Netlify 优势**
   - 原则3要求：Netlify 是唯一允许的部署平台
   - 自动 HTTPS 证书（Let's Encrypt）
   - 全球 CDN（符合性能要求）
   - 自动预览部署（每个 PR 独立 URL）
   - Netlify Functions 无缝集成

2. **GitHub Actions CI 流程**
   - 每次 PR 触发测试（Vitest + Playwright）
   - 测试通过后才允许合并
   - 符合原则1（CI/CD 流程中测试必须通过）

### Best Practices:

- **netlify.toml 配置**
  ```toml
  [build]
    command = "npm run build"
    publish = "dist"
  
  [[redirects]]
    from = "/api/*"
    to = "/.netlify/functions/:splat"
    status = 200
  
  [[headers]]
    for = "/*"
    [headers.values]
      X-Frame-Options = "DENY"
      X-Content-Type-Options = "nosniff"
      Referrer-Policy = "strict-origin-when-cross-origin"
      Permissions-Policy = "geolocation=(), microphone=(), camera=()"
  
  [[headers]]
    for = "/assets/*"
    [headers.values]
      Cache-Control = "public, max-age=31536000, immutable"
  ```

- **GitHub Actions 工作流**
  ```yaml
  # .github/workflows/ci.yml
  name: CI
  on: [pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v2
        - run: pnpm install
        - run: pnpm test:unit
        - run: pnpm test:integration
        - run: pnpm build
        - uses: playwright/github-action@v4
        - run: pnpm test:e2e
  ```

---

## 7. 数据可视化：Chart.js vs Recharts vs D3.js

### Decision: Chart.js 4.x

### Rationale:

1. **轻量级**
   - Chart.js 核心 ~60KB（gzipped），Recharts ~100KB，D3.js ~70KB
   - 符合性能要求

2. **Canvas 渲染**
   - 比 SVG（Recharts、D3）性能更好，适合大数据量（500头奶牛 × 30天数据点）
   - 移动端渲染流畅

3. **响应式内置**
   - 图表自动适配容器宽度
   - 移动端触控交互友好

4. **简单易用**
   - 声明式 API，学习曲线平缓
   - 不需要 D3.js 的复杂数据绑定

### Alternatives Considered:

- **Recharts**
  - 优点：React 组件，声明式
  - 缺点：本项目不使用 React，且 SVG 渲染在大数据量下性能较差
  - 结论：不适合

- **D3.js**
  - 优点：功能强大，自定义能力最强
  - 缺点：学习曲线陡峭，体积大，本项目不需要复杂可视化
  - 结论：过度工程化

### Best Practices:

```typescript
// components/charts/MilkChart.astro
---
import Chart from 'chart.js/auto';

interface Props {
  data: { date: string; amount: number }[];
}

const { data } = Astro.props;
---

<canvas id="milk-chart" class="w-full h-64 md:h-96"></canvas>

<script>
  import Chart from 'chart.js/auto';
  
  const ctx = document.getElementById('milk-chart');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.date),
      datasets: [{
        label: '产奶量 (升)',
        data: data.map(d => d.amount),
        borderColor: 'rgb(59, 130, 246)',
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // 移动端隐藏图例节省空间
        },
      },
    },
  });
</script>
```

---

## 8. 环境变量与密钥管理

### Decision: .env.local + Netlify Environment Variables

### Rationale:

1. **本地开发**
   - `.env.local` 存储本地 Supabase 项目密钥
   - 文件不提交到 Git（.gitignore 包含 `.env.*`）

2. **生产部署**
   - Netlify Dashboard 配置环境变量
   - 支持不同环境（preview, production）使用不同密钥

3. **安全性**
   - 符合原则5（禁止客户端硬编码 API 密钥）
   - Supabase 使用匿名密钥（anon key）在客户端安全（通过 RLS 限制权限）

### Best Practices:

```bash
# .env.example（提交到 Git 作为模板）
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here  # 仅在 Netlify Functions 使用

# 可选：第三方服务密钥
SENDGRID_API_KEY=your-sendgrid-key  # 邮件通知
```

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## Research Summary

所有技术选型已完成研究，无 "NEEDS CLARIFICATION" 项。所有决策符合项目原则，并提供了详细的最佳实践指南。

### 技术栈最终确定：

| 领域 | 技术 | 版本 | 理由 |
|------|------|------|------|
| 前端框架 | Astro | 4.x | 静态优先，零 JS，性能最优 |
| 数据库 | Supabase PostgreSQL | 最新版 | 无服务器，RLS，实时订阅 |
| 样式 | Tailwind CSS | 3.x | 移动优先，实用类，快速开发 |
| 状态管理 | Nanostores | 最新版 | 轻量级，框架无关 |
| 离线存储 | IndexedDB (idb-keyval) | 最新版 | 异步 API，性能好 |
| 测试框架 | Vitest + Playwright | 最新版 | Vite 原生，跨浏览器 E2E |
| 数据可视化 | Chart.js | 4.x | 轻量级，Canvas 渲染 |
| 部署平台 | Netlify | - | 项目原则要求，CDN，Functions |
| 语言 | TypeScript | 5.3+ | 类型安全，减少运行时错误 |

### 下一步：Phase 1 设计

- 生成 `data-model.md`：详细的 Supabase 数据库架构和 RLS 策略
- 生成 `contracts/`：API 规范（OpenAPI）和 RLS SQL 脚本
- 生成 `quickstart.md`：开发者快速上手指南
- 更新 agent context：添加技术栈信息到 Cursor 上下文

