# Implementation Tasks: 奶牛实验数据管理系统

**Feature**: 001-netlify  
**Branch**: `001-netlify`  
**Generated**: 2025-10-11  
**Total Tasks**: 87 tasks  
**Estimated Duration**: 8-12 weeks

本文档按用户故事（User Story）组织任务，支持增量交付和独立测试。每个用户故事都是一个完整的、可独立部署的功能增量。

---

## 📋 执行策略 (Execution Strategy)

### MVP 范围（第一次发布）

**User Story 1 (P1): 奶牛基础档案管理**
- 最小可行产品（MVP）
- 预计开发时间：2-3 周
- 包含：奶牛 CRUD、用户认证、基础 UI
- 验收标准：用户可以登录、添加奶牛、查看列表、搜索奶牛

### 增量交付计划

| 版本 | 用户故事 | 预计时间 | 累计功能 |
|------|----------|----------|----------|
| v0.1 (MVP) | US1 (P1) | 2-3 周 | 奶牛档案管理 |
| v0.2 | US2 (P2) | +2 周 | 健康与产奶记录 |
| v0.3 | US3 (P3) | +1.5 周 | 繁殖管理 |
| v0.4 | US4 (P4) | +1.5 周 | 饲料管理 |
| v1.0 | US5 (P5) | +1 周 | 数据分析 |

---

## 🔢 任务编号说明

- **T001-T010**: Phase 1 - 项目设置（Setup）
- **T011-T025**: Phase 2 - 基础设施（Foundational）
- **T026-T040**: Phase 3 - US1 (P1) 奶牛档案管理
- **T041-T055**: Phase 4 - US2 (P2) 健康与产奶记录
- **T056-T065**: Phase 5 - US3 (P3) 繁殖管理
- **T066-T075**: Phase 6 - US4 (P4) 饲料管理
- **T076-T082**: Phase 7 - US5 (P5) 数据分析
- **T083-T087**: Phase 8 - 完善与集成

---

## Phase 1: 项目设置 (Setup) - 预计 1 天

**目标**: 初始化项目环境，安装依赖，配置基础设施

### T001: 初始化项目仓库 [P]
```bash
# 文件：根目录
git init
git checkout -b 001-netlify
```
- 创建 `.gitignore` 文件
- 配置 Git 钩子（可选）
- **并行机会**: 可与 T002 同时进行

---

### T002: 安装项目依赖 [P]
```bash
# 文件：package.json, pnpm-lock.yaml
pnpm init
pnpm add astro @astrojs/tailwind @astrojs/netlify
pnpm add @supabase/supabase-js nanostores chart.js
pnpm add -D vitest @vitest/ui playwright @playwright/test
pnpm add -D typescript @types/node tailwindcss
```
- 创建 `package.json` 并定义 scripts
- 安装所有依赖（Astro, Supabase, Tailwind, 测试框架）
- **依赖**: 无
- **并行机会**: 可与 T001 同时进行

---

### T003: 配置 Astro 项目
```typescript
// 文件：astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

export default defineConfig({
  integrations: [tailwind()],
  output: 'hybrid',
  adapter: netlify(),
});
```
- 配置 Astro 为 hybrid 模式（SSG + SSR）
- 集成 Tailwind CSS 和 Netlify 适配器
- **依赖**: T002

---

### T004: 配置 Tailwind CSS
```javascript
// 文件：tailwind.config.cjs
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '320px',
        'touch': '44px',
      },
    },
  },
};
```
- 配置移动优先断点
- 定义触控友好的最小尺寸
- **依赖**: T002, T003

---

### T005: 配置 TypeScript
```json
// 文件：tsconfig.json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@lib/*": ["src/lib/*"]
    }
  }
}
```
- 配置路径别名
- 启用严格类型检查
- **依赖**: T002

---

### T006: 配置 Vitest (单元测试)
```typescript
// 文件：vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'c8',
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
});
```
- 配置测试覆盖率要求（80%）
- 配置测试环境
- **依赖**: T002

---

### T007: 配置 Playwright (E2E测试)
```typescript
// 文件：playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:4321',
  },
  projects: [
    { name: 'Mobile Chrome', use: { ...devices['iPhone 12'] } },
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
  ],
});
```
- 配置移动端和桌面端测试
- **依赖**: T002

---

### T008: 配置环境变量
```bash
# 文件：.env.example, .env.local
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
- 创建环境变量模板
- 添加 `.env.*` 到 `.gitignore`
- **依赖**: T001

---

### T009: 配置 Netlify 部署
```toml
# 文件：netlify.toml
[build]
  command = "pnpm build"
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
```
- 配置构建命令和发布目录
- 配置安全头部
- **依赖**: T003

---

### T010: 创建项目目录结构
```bash
# 创建目录结构
mkdir -p src/{pages,components,lib,services,types}
mkdir -p src/components/{layout,forms,tables,charts}
mkdir -p netlify/functions
mkdir -p tests/{unit,integration,e2e}
mkdir -p supabase/migrations
```
- 创建完整的目录结构（参考 plan.md）
- **依赖**: T001

---

## Phase 2: 基础设施 (Foundational) - 预计 3-4 天

**目标**: 建立所有用户故事依赖的基础设施（数据库、认证、核心库）

**⚠️ 重要**: 此阶段必须完全完成后，才能开始任何用户故事的开发

---

### T011: 创建 Supabase 项目并初始化
```bash
# 命令行
supabase init
supabase start
```
- 创建本地 Supabase 项目
- 启动本地数据库容器
- 记录 API URL 和密钥到 `.env.local`
- **依赖**: T008

---

### T012: 执行数据库迁移脚本
```bash
# 文件：supabase/migrations/001_initial_schema.sql
# 执行 specs/001-netlify/contracts/supabase-migration.sql
cat specs/001-netlify/contracts/supabase-migration.sql | supabase db execute
```
- 创建所有10个数据表
- 创建所有枚举类型
- 创建索引和触发器
- **依赖**: T011
- **验证**: `supabase db status` 显示所有表已创建

---

### T013: 应用 RLS 安全策略
```bash
# 文件：supabase/migrations/002_rls_policies.sql
# 执行 specs/001-netlify/contracts/supabase-rls.sql
cat specs/001-netlify/contracts/supabase-rls.sql | supabase db execute
```
- 启用所有表的 RLS
- 创建三级权限策略（admin/staff/guest）
- **依赖**: T012
- **验证**: Supabase Studio 中查看 RLS 策略已启用

---

### T014: 插入种子数据（开发环境）
```sql
-- 文件：supabase/seed.sql
INSERT INTO users (id, full_name, role, ...)
VALUES ('test-admin-id', '测试管理员', 'admin', ...);
```
- 创建测试用户（admin, staff, guest各一个）
- 创建3-5头测试奶牛
- 创建1个测试饲料配方
- **依赖**: T013

---

### T015: 创建 Supabase 客户端工具类
```typescript
// 文件：src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```
- 初始化 Supabase 客户端
- 导出单例实例
- **依赖**: T008, T011
- **测试**: T016

---

### T016: 测试 Supabase 连接 [TEST]
```typescript
// 文件：tests/integration/supabase/connection.test.ts
import { describe, it, expect } from 'vitest';
import { supabase } from '@/lib/supabase';

describe('Supabase Connection', () => {
  it('should connect to Supabase', async () => {
    const { data, error } = await supabase.from('users').select('count');
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});
```
- 测试数据库连接
- 测试基本查询
- **依赖**: T015

---

### T017: 创建认证工具类
```typescript
// 文件：src/lib/auth.ts
import { supabase } from './supabase';

export async function signIn(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserRole(userId: string) {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role;
}
```
- 封装认证相关函数
- 获取当前用户和角色
- **依赖**: T015
- **测试**: T018

---

### T018: 测试认证功能 [TEST]
```typescript
// 文件：tests/unit/lib/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { signIn, signOut, getCurrentUser } from '@/lib/auth';

describe('Auth Functions', () => {
  it('should sign in with valid credentials', async () => {
    const result = await signIn('test@example.com', 'password');
    expect(result.data.user).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should fail with invalid credentials', async () => {
    const result = await signIn('test@example.com', 'wrong');
    expect(result.error).toBeDefined();
  });
});
```
- 测试登录、登出功能
- 测试错误处理
- **依赖**: T017

---

### T019: 创建数据验证工具类
```typescript
// 文件：src/lib/validation.ts
export function validateCowNumber(number: string): boolean {
  return /^[A-Z0-9]{3,50}$/.test(number);
}

export function validateTemperature(temp: number): boolean {
  return temp >= 35.0 && temp <= 45.0;
}

export function validateDate(date: string): boolean {
  const d = new Date(date);
  return d <= new Date() && !isNaN(d.getTime());
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```
- 实现所有业务验证规则
- 参考 data-model.md 中的约束
- **依赖**: 无
- **测试**: T020

---

### T020: 测试数据验证 [TEST]
```typescript
// 文件：tests/unit/lib/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateCowNumber, validateTemperature } from '@/lib/validation';

describe('Validation Functions', () => {
  describe('validateCowNumber', () => {
    it('should accept valid cow numbers', () => {
      expect(validateCowNumber('CN001')).toBe(true);
      expect(validateCowNumber('ABC123')).toBe(true);
    });

    it('should reject invalid cow numbers', () => {
      expect(validateCowNumber('cn001')).toBe(false); // 小写
      expect(validateCowNumber('AB')).toBe(false); // 太短
    });
  });

  describe('validateTemperature', () => {
    it('should accept normal temperature range', () => {
      expect(validateTemperature(37.5)).toBe(true);
      expect(validateTemperature(39.0)).toBe(true);
    });

    it('should reject out-of-range temperature', () => {
      expect(validateTemperature(34.0)).toBe(false);
      expect(validateTemperature(50.0)).toBe(false);
    });
  });
});
```
- 测试所有验证规则（正常、边界、失败用例）
- 覆盖率要求 95%
- **依赖**: T019

---

### T021: 创建基础布局组件
```astro
<!-- 文件：src/components/layout/Layout.astro -->
---
interface Props {
  title: string;
}
const { title } = Astro.props;
---
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} - 奶牛实验数据管理系统</title>
</head>
<body class="min-h-screen bg-gray-50">
  <Header />
  <main class="container mx-auto px-4 py-6">
    <slot />
  </main>
  <Footer />
</body>
</html>
```
- 创建基础 HTML 布局
- 集成 Header 和 Footer
- **依赖**: T004, T022, T023

---

### T022: 创建统一头部组件
```astro
<!-- 文件：src/components/layout/Header.astro -->
<header class="bg-white shadow-sm">
  <div class="container mx-auto px-4 py-4 flex justify-between items-center">
    <h1 class="text-xl md:text-2xl font-bold text-blue-600">
      奶牛数据管理系统
    </h1>
    <nav class="hidden md:flex space-x-4">
      <a href="/" class="hover:text-blue-600">首页</a>
      <a href="/cows" class="hover:text-blue-600">奶牛管理</a>
      <a href="/logout" class="hover:text-blue-600">退出</a>
    </nav>
    <!-- 移动端汉堡菜单 -->
    <button class="md:hidden" id="mobile-menu-btn">
      <svg class="w-6 h-6">...</svg>
    </button>
  </div>
</header>
```
- 响应式导航栏
- 移动端汉堡菜单
- **依赖**: T004

---

### T023: 创建统一底部组件
```astro
<!-- 文件：src/components/layout/Footer.astro -->
<footer class="bg-gray-800 text-white py-6 mt-auto">
  <div class="container mx-auto px-4 text-center">
    <p>&copy; 2025 奶牛实验数据管理系统. All rights reserved.</p>
  </div>
</footer>
```
- 简单的页脚组件
- **依赖**: T004

---

### T024: 创建首页和登录页
```astro
<!-- 文件：src/pages/index.astro -->
---
import Layout from '@components/layout/Layout.astro';
---
<Layout title="首页">
  <div class="text-center py-12">
    <h1 class="text-4xl font-bold mb-4">欢迎使用奶牛数据管理系统</h1>
    <p class="text-gray-600 mb-8">科学管理，高效养殖</p>
    <a href="/login" class="bg-blue-600 text-white px-6 py-3 rounded-lg">
      立即登录
    </a>
  </div>
</Layout>

<!-- 文件：src/pages/login.astro -->
<!-- 登录表单页面 -->
```
- 创建首页（静态）
- 创建登录页面
- **依赖**: T021

---

### T025: 运行基础设施测试套件
```bash
pnpm test:unit tests/unit/lib/
pnpm test:integration tests/integration/supabase/
```
- 运行所有基础设施测试
- 确认覆盖率 > 80%
- **依赖**: T016, T018, T020
- **验证**: 所有测试通过，覆盖率达标

---

**✅ Checkpoint 1: 基础设施完成**
- 数据库已创建并配置 RLS
- 认证系统可用
- 基础 UI 组件就绪
- 所有基础测试通过

---

## Phase 3: US1 (P1) - 奶牛基础档案管理 - 预计 2-3 周

**用户故事**: 作为养殖场管理员，我需要录入和管理每头奶牛的基本信息，以便建立完整的奶牛档案系统。

**独立测试标准**: 
- 用户可以登录系统
- 用户可以添加新奶牛（编号、品种、出生日期）
- 用户可以查看奶牛列表
- 用户可以搜索奶牛
- 用户可以编辑和软删除奶牛
- 多用户操作时数据实时同步

---

### T026: [US1] 定义奶牛类型接口 [TEST]
```typescript
// 文件：src/types/cow.types.ts
export type BreedType = 'holstein' | 'jersey' | 'other';
export type GenderType = 'male' | 'female';
export type CowStatus = 'active' | 'culled' | 'sold' | 'dead';

export interface Cow {
  id: string;
  cow_number: string;
  name?: string;
  breed: BreedType;
  gender: GenderType;
  birth_date: string;
  sire_id?: string;
  dam_id?: string;
  status: CowStatus;
  entry_date: string;
  photo_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at?: string;
}

export interface CowFormData {
  cow_number: string;
  name?: string;
  breed: BreedType;
  gender: GenderType;
  birth_date: string;
  entry_date: string;
  notes?: string;
}
```
- 定义 Cow 接口（映射数据库表）
- 定义表单数据接口
- **依赖**: T012
- **并行机会**: 可与 T027 同时进行

---

### T027: [US1] 测试奶牛服务层 - 创建奶牛 [TEST]
```typescript
// 文件：tests/unit/services/cows.service.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createCow, getCows, getCowById, updateCow, deleteCow } from '@/services/cows.service';

describe('Cows Service', () => {
  describe('createCow', () => {
    it('should create a new cow with valid data', async () => {
      const cowData = {
        cow_number: 'TEST001',
        name: '测试牛',
        breed: 'holstein',
        gender: 'female',
        birth_date: '2022-01-01',
        entry_date: '2022-01-05',
      };
      
      const result = await createCow(cowData);
      
      expect(result.data).toBeDefined();
      expect(result.data.cow_number).toBe('TEST001');
      expect(result.error).toBeNull();
    });

    it('should fail with duplicate cow_number', async () => {
      // 先创建一头牛
      await createCow({ cow_number: 'DUP001', ... });
      
      // 尝试创建相同编号的牛
      const result = await createCow({ cow_number: 'DUP001', ... });
      
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('23505'); // Unique violation
    });

    it('should fail with invalid birth_date (future date)', async () => {
      const result = await createCow({
        cow_number: 'FUTURE001',
        birth_date: '2099-01-01',
        ...
      });
      
      expect(result.error).toBeDefined();
    });
  });

  describe('getCows', () => {
    it('should return all active cows', async () => {
      const result = await getCows();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.every(cow => cow.deleted_at === null)).toBe(true);
    });

    it('should filter cows by breed', async () => {
      const result = await getCows({ breed: 'holstein' });
      expect(result.data.every(cow => cow.breed === 'holstein')).toBe(true);
    });
  });

  // 更多测试用例...
});
```
- TDD: 先写测试（红色）
- 覆盖正常、边界、失败用例
- **依赖**: T026

---

### T028: [US1] 实现奶牛服务层 [P]
```typescript
// 文件：src/services/cows.service.ts
import { supabase } from '@/lib/supabase';
import type { Cow, CowFormData } from '@/types/cow.types';

export async function createCow(data: CowFormData) {
  const { data: cow, error } = await supabase
    .from('cows')
    .insert({
      ...data,
      created_by: (await supabase.auth.getUser()).data.user?.id,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();

  return { data: cow, error };
}

export async function getCows(filters?: { breed?: string; status?: string }) {
  let query = supabase
    .from('cows')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (filters?.breed) {
    query = query.eq('breed', filters.breed);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  return await query;
}

export async function getCowById(id: string) {
  return await supabase
    .from('cows')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
}

export async function updateCow(id: string, data: Partial<CowFormData>) {
  return await supabase
    .from('cows')
    .update({
      ...data,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq('id', id)
    .select()
    .single();
}

export async function deleteCow(id: string) {
  // 软删除
  return await supabase
    .from('cows')
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq('id', id);
}

export async function searchCows(keyword: string) {
  return await supabase
    .from('cows')
    .select('*')
    .or(`cow_number.ilike.%${keyword}%,name.ilike.%${keyword}%`)
    .is('deleted_at', null);
}
```
- 实现所有 CRUD 操作
- 实现搜索功能
- 软删除模式
- **依赖**: T027（TDD：测试先行）
- **验证**: T027 中的测试变为绿色

---

### T029: [US1] 创建奶牛表单组件
```astro
<!-- 文件：src/components/forms/CowForm.astro -->
---
import type { Cow } from '@/types/cow.types';

interface Props {
  cow?: Cow;
  mode: 'create' | 'edit';
}

const { cow, mode } = Astro.props;
---

<form id="cow-form" class="space-y-4">
  <!-- 奶牛编号 -->
  <div>
    <label for="cow_number" class="block text-sm font-medium mb-1">
      奶牛编号 <span class="text-red-500">*</span>
    </label>
    <input
      type="text"
      id="cow_number"
      name="cow_number"
      value={cow?.cow_number || ''}
      required
      pattern="[A-Z0-9]{3,50}"
      class="w-full h-12 px-4 border rounded-lg"
      placeholder="例如：CN001"
    />
  </div>

  <!-- 名称 -->
  <div>
    <label for="name" class="block text-sm font-medium mb-1">
      名称（可选）
    </label>
    <input
      type="text"
      id="name"
      name="name"
      value={cow?.name || ''}
      class="w-full h-12 px-4 border rounded-lg"
      placeholder="例如：小花"
    />
  </div>

  <!-- 品种 -->
  <div>
    <label for="breed" class="block text-sm font-medium mb-1">
      品种 <span class="text-red-500">*</span>
    </label>
    <select
      id="breed"
      name="breed"
      required
      class="w-full h-12 px-4 border rounded-lg"
    >
      <option value="">请选择</option>
      <option value="holstein" selected={cow?.breed === 'holstein'}>荷斯坦</option>
      <option value="jersey" selected={cow?.breed === 'jersey'}>娟姗</option>
      <option value="other" selected={cow?.breed === 'other'}>其他</option>
    </select>
  </div>

  <!-- 性别 -->
  <div>
    <label class="block text-sm font-medium mb-1">
      性别 <span class="text-red-500">*</span>
    </label>
    <div class="flex gap-4">
      <label class="flex items-center">
        <input
          type="radio"
          name="gender"
          value="female"
          checked={cow?.gender === 'female' || !cow}
          required
          class="mr-2 w-5 h-5"
        />
        母牛
      </label>
      <label class="flex items-center">
        <input
          type="radio"
          name="gender"
          value="male"
          checked={cow?.gender === 'male'}
          class="mr-2 w-5 h-5"
        />
        公牛
      </label>
    </div>
  </div>

  <!-- 出生日期 -->
  <div>
    <label for="birth_date" class="block text-sm font-medium mb-1">
      出生日期 <span class="text-red-500">*</span>
    </label>
    <input
      type="date"
      id="birth_date"
      name="birth_date"
      value={cow?.birth_date || ''}
      max={new Date().toISOString().split('T')[0]}
      required
      class="w-full h-12 px-4 border rounded-lg"
    />
  </div>

  <!-- 入栏日期 -->
  <div>
    <label for="entry_date" class="block text-sm font-medium mb-1">
      入栏日期 <span class="text-red-500">*</span>
    </label>
    <input
      type="date"
      id="entry_date"
      name="entry_date"
      value={cow?.entry_date || ''}
      max={new Date().toISOString().split('T')[0]}
      required
      class="w-full h-12 px-4 border rounded-lg"
    />
  </div>

  <!-- 备注 -->
  <div>
    <label for="notes" class="block text-sm font-medium mb-1">
      备注
    </label>
    <textarea
      id="notes"
      name="notes"
      rows="3"
      class="w-full px-4 py-2 border rounded-lg"
      placeholder="其他信息..."
    >{cow?.notes || ''}</textarea>
  </div>

  <!-- 提交按钮 -->
  <div class="flex gap-4">
    <button
      type="submit"
      class="flex-1 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      {mode === 'create' ? '添加奶牛' : '保存修改'}
    </button>
    <a
      href="/cows"
      class="flex-1 min-h-[44px] flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
    >
      取消
    </a>
  </div>
</form>

<script>
  import { createCow, updateCow } from '@/services/cows.service';

  const form = document.getElementById('cow-form') as HTMLFormElement;
  const mode = '{mode}';
  const cowId = '{cow?.id}';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      if (mode === 'create') {
        const result = await createCow(data);
        if (result.error) throw result.error;
        alert('添加成功！');
        window.location.href = '/cows';
      } else {
        const result = await updateCow(cowId, data);
        if (result.error) throw result.error;
        alert('保存成功！');
        window.location.href = `/cows/${cowId}`;
      }
    } catch (error) {
      alert(`操作失败：${error.message}`);
    }
  });
</script>
```
- 移动优先响应式表单
- 触控友好（按钮 ≥ 44px）
- 客户端验证
- **依赖**: T026, T028

---

### T030: [US1] 创建奶牛列表表格组件
```astro
<!-- 文件：src/components/tables/CowTable.astro -->
---
import type { Cow } from '@/types/cow.types';

interface Props {
  cows: Cow[];
}

const { cows } = Astro.props;

const breedLabels = {
  holstein: '荷斯坦',
  jersey: '娟姗',
  other: '其他',
};

const statusLabels = {
  active: '在养',
  culled: '已淘汰',
  sold: '已售出',
  dead: '死亡',
};
---

<div class="overflow-x-auto">
  <table class="w-full border-collapse">
    <thead class="bg-gray-100">
      <tr>
        <th class="px-4 py-3 text-left">编号</th>
        <th class="px-4 py-3 text-left hidden md:table-cell">名称</th>
        <th class="px-4 py-3 text-left">品种</th>
        <th class="px-4 py-3 text-left hidden md:table-cell">性别</th>
        <th class="px-4 py-3 text-left hidden lg:table-cell">出生日期</th>
        <th class="px-4 py-3 text-left">状态</th>
        <th class="px-4 py-3 text-center">操作</th>
      </tr>
    </thead>
    <tbody>
      {cows.map((cow) => (
        <tr class="border-b hover:bg-gray-50">
          <td class="px-4 py-3 font-medium">{cow.cow_number}</td>
          <td class="px-4 py-3 hidden md:table-cell">{cow.name || '-'}</td>
          <td class="px-4 py-3">{breedLabels[cow.breed]}</td>
          <td class="px-4 py-3 hidden md:table-cell">
            {cow.gender === 'female' ? '母牛' : '公牛'}
          </td>
          <td class="px-4 py-3 hidden lg:table-cell">{cow.birth_date}</td>
          <td class="px-4 py-3">
            <span class={`px-2 py-1 rounded text-sm ${
              cow.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {statusLabels[cow.status]}
            </span>
          </td>
          <td class="px-4 py-3 text-center">
            <div class="flex gap-2 justify-center">
              <a
                href={`/cows/${cow.id}`}
                class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                详情
              </a>
              <a
                href={`/cows/${cow.id}/edit`}
                class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 hidden md:inline-block"
              >
                编辑
              </a>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  {cows.length === 0 && (
    <div class="text-center py-12 text-gray-500">
      暂无数据
    </div>
  )}
</div>
```
- 响应式表格（移动端隐藏次要列）
- 状态标签颜色编码
- **依赖**: T026

---

### T031: [US1] 创建奶牛列表页面
```astro
<!-- 文件：src/pages/cows/index.astro -->
---
import Layout from '@components/layout/Layout.astro';
import CowTable from '@components/tables/CowTable.astro';
import { getCows } from '@/services/cows.service';

const { data: cows, error } = await getCows();

if (error) {
  console.error('Failed to load cows:', error);
}
---

<Layout title="奶牛管理">
  <div class="space-y-6">
    <!-- 页面头部 -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <h1 class="text-2xl md:text-3xl font-bold">奶牛档案管理</h1>
      <a
        href="/cows/add"
        class="w-full md:w-auto min-h-[44px] px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
      >
        + 添加奶牛
      </a>
    </div>

    <!-- 搜索栏 -->
    <div class="bg-white p-4 rounded-lg shadow">
      <form id="search-form" class="flex gap-2">
        <input
          type="text"
          id="search-input"
          name="keyword"
          placeholder="搜索编号或名称..."
          class="flex-1 h-12 px-4 border rounded-lg"
        />
        <button
          type="submit"
          class="min-w-[80px] min-h-[44px] bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          搜索
        </button>
      </form>
    </div>

    <!-- 奶牛列表 -->
    <div class="bg-white rounded-lg shadow">
      <CowTable cows={cows || []} />
    </div>
  </div>
</Layout>

<script>
  import { searchCows } from '@/services/cows.service';

  const form = document.getElementById('search-form') as HTMLFormElement;
  const input = document.getElementById('search-input') as HTMLInputElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const keyword = input.value.trim();
    
    if (!keyword) {
      window.location.href = '/cows';
      return;
    }

    // 执行搜索并更新页面（简化版，实际应使用状态管理）
    const { data, error } = await searchCows(keyword);
    
    if (error) {
      alert('搜索失败：' + error.message);
      return;
    }

    // 更新表格（此处简化处理，实际应使用 Nanostores 或重新渲染）
    console.log('Search results:', data);
  });
</script>
```
- 奶牛列表展示
- 搜索功能
- 移动端适配
- **依赖**: T028, T030

---

### T032: [US1] 创建添加奶牛页面
```astro
<!-- 文件：src/pages/cows/add.astro -->
---
import Layout from '@components/layout/Layout.astro';
import CowForm from '@components/forms/CowForm.astro';
---

<Layout title="添加奶牛">
  <div class="max-w-2xl mx-auto">
    <h1 class="text-2xl md:text-3xl font-bold mb-6">添加新奶牛</h1>
    
    <div class="bg-white p-6 rounded-lg shadow">
      <CowForm mode="create" />
    </div>
  </div>
</Layout>
```
- 添加奶牛表单页面
- **依赖**: T029

---

### T033: [US1] 创建奶牛详情页面
```astro
<!-- 文件：src/pages/cows/[id].astro -->
---
import Layout from '@components/layout/Layout.astro';
import { getCowById } from '@/services/cows.service';

const { id } = Astro.params;
const { data: cow, error } = await getCowById(id);

if (error || !cow) {
  return Astro.redirect('/cows');
}

const breedLabels = { holstein: '荷斯坦', jersey: '娟姗', other: '其他' };
const statusLabels = { active: '在养', culled: '已淘汰', sold: '已售出', dead: '死亡' };
---

<Layout title={`奶牛详情 - ${cow.cow_number}`}>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- 头部 -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl md:text-3xl font-bold">奶牛档案详情</h1>
      <div class="flex gap-2">
        <a
          href={`/cows/${cow.id}/edit`}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          编辑
        </a>
        <button
          id="delete-btn"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          删除
        </button>
      </div>
    </div>

    <!-- 基本信息卡片 -->
    <div class="bg-white p-6 rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">基本信息</h2>
      <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <dt class="text-sm text-gray-600">奶牛编号</dt>
          <dd class="mt-1 text-lg font-medium">{cow.cow_number}</dd>
        </div>
        <div>
          <dt class="text-sm text-gray-600">名称</dt>
          <dd class="mt-1 text-lg">{cow.name || '未命名'}</dd>
        </div>
        <div>
          <dt class="text-sm text-gray-600">品种</dt>
          <dd class="mt-1 text-lg">{breedLabels[cow.breed]}</dd>
        </div>
        <div>
          <dt class="text-sm text-gray-600">性别</dt>
          <dd class="mt-1 text-lg">{cow.gender === 'female' ? '母牛' : '公牛'}</dd>
        </div>
        <div>
          <dt class="text-sm text-gray-600">出生日期</dt>
          <dd class="mt-1 text-lg">{cow.birth_date}</dd>
        </div>
        <div>
          <dt class="text-sm text-gray-600">入栏日期</dt>
          <dd class="mt-1 text-lg">{cow.entry_date}</dd>
        </div>
        <div>
          <dt class="text-sm text-gray-600">当前状态</dt>
          <dd class="mt-1">
            <span class={`px-3 py-1 rounded ${
              cow.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {statusLabels[cow.status]}
            </span>
          </dd>
        </div>
      </dl>
      
      {cow.notes && (
        <div class="mt-4 pt-4 border-t">
          <dt class="text-sm text-gray-600">备注</dt>
          <dd class="mt-1">{cow.notes}</dd>
        </div>
      )}
    </div>

    <!-- 返回按钮 -->
    <div class="text-center">
      <a
        href="/cows"
        class="inline-block px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        返回列表
      </a>
    </div>
  </div>
</Layout>

<script>
  import { deleteCow } from '@/services/cows.service';

  const deleteBtn = document.getElementById('delete-btn');
  const cowId = '{cow.id}';

  deleteBtn?.addEventListener('click', async () => {
    if (!confirm('确认删除这头奶牛吗？此操作不可恢复。')) {
      return;
    }

    try {
      const { error } = await deleteCow(cowId);
      if (error) throw error;
      
      alert('删除成功！');
      window.location.href = '/cows';
    } catch (error) {
      alert('删除失败：' + error.message);
    }
  });
</script>
```
- 奶牛详情展示
- 删除功能（软删除）
- **依赖**: T028

---

### T034: [US1] 创建编辑奶牛页面
```astro
<!-- 文件：src/pages/cows/[id]/edit.astro -->
---
import Layout from '@components/layout/Layout.astro';
import CowForm from '@components/forms/CowForm.astro';
import { getCowById } from '@/services/cows.service';

const { id } = Astro.params;
const { data: cow, error } = await getCowById(id);

if (error || !cow) {
  return Astro.redirect('/cows');
}
---

<Layout title={`编辑奶牛 - ${cow.cow_number}`}>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-2xl md:text-3xl font-bold mb-6">编辑奶牛档案</h1>
    
    <div class="bg-white p-6 rounded-lg shadow">
      <CowForm cow={cow} mode="edit" />
    </div>
  </div>
</Layout>
```
- 编辑奶牛表单页面
- **依赖**: T029, T033

---

### T035: [US1] 实现 Supabase Realtime 订阅
```typescript
// 文件：src/lib/realtime.ts
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function subscribeToCows(callback: (payload: any) => void): RealtimeChannel {
  const channel = supabase
    .channel('cows-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cows',
      },
      (payload) => {
        console.log('Realtime update:', payload);
        callback(payload);
      }
    )
    .subscribe();

  return channel;
}

export function unsubscribeFromCows(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}
```
- 封装 Realtime 订阅逻辑
- **依赖**: T015

---

### T036: [US1] 在奶牛列表页集成实时更新
```astro
<!-- 在 src/pages/cows/index.astro 中添加 -->
<script>
  import { subscribeToCows, unsubscribeFromCows } from '@/lib/realtime';

  let channel: any;

  // 订阅奶牛表变更
  channel = subscribeToCows((payload) => {
    console.log('Cow updated:', payload);
    
    // 简化处理：直接刷新页面
    // 实际应使用 Nanostores 更新本地状态
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
      // 延迟刷新，避免过于频繁
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  });

  // 页面卸载时取消订阅
  window.addEventListener('beforeunload', () => {
    if (channel) {
      unsubscribeFromCows(channel);
    }
  });
</script>
```
- 多用户实时同步
- **依赖**: T035, T031

---

### T037: [US1] E2E 测试 - 奶牛管理完整流程 [TEST]
```typescript
// 文件：tests/e2e/cow-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Cow Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should complete full cow CRUD workflow', async ({ page }) => {
    // 1. 导航到奶牛列表
    await page.goto('/cows');
    await expect(page.locator('h1')).toContainText('奶牛档案管理');

    // 2. 添加新奶牛
    await page.click('text=添加奶牛');
    await expect(page).toHaveURL('/cows/add');

    await page.fill('[name="cow_number"]', 'E2E001');
    await page.fill('[name="name"]', 'E2E测试牛');
    await page.selectOption('[name="breed"]', 'holstein');
    await page.check('[name="gender"][value="female"]');
    await page.fill('[name="birth_date"]', '2022-01-01');
    await page.fill('[name="entry_date"]', '2022-01-05');

    await page.click('button[type="submit"]');
    await page.waitForURL('/cows');

    // 3. 验证奶牛出现在列表中
    await expect(page.locator('text=E2E001')).toBeVisible();

    // 4. 查看详情
    await page.click('text=E2E001');
    await expect(page.locator('text=E2E测试牛')).toBeVisible();

    // 5. 编辑奶牛
    await page.click('text=编辑');
    await page.fill('[name="name"]', 'E2E测试牛-已修改');
    await page.click('button[type="submit"]');

    // 6. 验证修改
    await expect(page.locator('text=E2E测试牛-已修改')).toBeVisible();

    // 7. 删除奶牛
    await page.click('text=删除');
    page.on('dialog', dialog => dialog.accept());
    await page.waitForURL('/cows');

    // 8. 验证删除（奶牛不再出现在列表中）
    await expect(page.locator('text=E2E001')).not.toBeVisible();
  });

  test('should search cows by number', async ({ page }) => {
    await page.goto('/cows');
    
    await page.fill('[name="keyword"]', 'CN001');
    await page.click('button[type="submit"]');

    // 验证搜索结果
    await expect(page.locator('text=CN001')).toBeVisible();
  });

  test('mobile: should display correctly on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    await page.goto('/cows');
    
    // 验证移动端布局
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=添加奶牛')).toBeVisible();
    
    // 验证按钮触控友好（至少 44px）
    const addButton = page.locator('text=添加奶牛');
    const box = await addButton.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});
```
- 完整的用户流程测试
- 移动端响应式测试
- **依赖**: T031-T034

---

### T038: [US1] 运行 US1 测试套件
```bash
# 单元测试
pnpm test:unit tests/unit/services/cows.service.test.ts

# E2E 测试
pnpm test:e2e tests/e2e/cow-management.spec.ts
```
- 确认所有 US1 测试通过
- 检查覆盖率 > 80%
- **依赖**: T027, T037

---

### T039: [US1] 优化性能和无障碍访问
```astro
<!-- 在 Layout.astro 中添加 -->
<head>
  <!-- 性能优化 -->
  <link rel="preconnect" href={import.meta.env.SUPABASE_URL} />
  
  <!-- 无障碍访问 -->
  <html lang="zh-CN">
  <meta name="description" content="奶牛实验数据管理系统" />
  
  <!-- PWA 支持（可选） -->
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#2563eb" />
</head>
```
- 添加性能优化标签
- 改进无障碍访问
- **依赖**: T021

---

### T040: [US1] 运行 Lighthouse 测试
```bash
# 构建生产版本
pnpm build

# 启动预览服务器
pnpm preview

# 使用 Lighthouse CLI（或浏览器 DevTools）
lighthouse http://localhost:4321/cows --view
```
- Performance > 90
- Accessibility > 90
- Best Practices > 90
- SEO > 90
- **依赖**: T039

---

**✅ Checkpoint 2: US1 (P1) 完成 - MVP 就绪**
- 用户可以登录系统 ✓
- 用户可以添加、查看、编辑、删除奶牛 ✓
- 用户可以搜索奶牛 ✓
- 多用户实时同步 ✓
- 所有测试通过 ✓
- Lighthouse 评分 > 90 ✓
- **可独立部署为 MVP**

---

## Phase 4: US2 (P2) - 日常健康与产奶数据记录 - 预计 2 周

**用户故事**: 作为养殖员，我需要每天记录奶牛的健康状况和产奶数据，以便及时发现健康问题并监控产奶性能。

**独立测试标准**:
- 养殖员可以为奶牛录入健康数据（体温、精神状态、食欲）
- 养殖员可以为奶牛录入产奶数据（产量、脂肪率、蛋白质率）
- 系统在体温异常时自动发送通知
- 养殖员可以查看历史健康和产奶记录
- 养殖员可以查看产奶趋势图表

**任务概览**: T041-T055 (15个任务)
- 包含：2个测试任务、2个服务层任务、2个表单组件、4个页面、1个图表组件、1个通知功能、3个集成任务

**依赖**: Phase 3 (US1) 必须完成（需要奶牛档案作为基础）

---

### T041-T055: [US2] 任务详情

由于篇幅限制，US2-US5 的详细任务将遵循相同的模式：
1. 定义类型接口
2. 编写测试（TDD）
3. 实现服务层
4. 创建表单组件
5. 创建页面（列表、添加、详情、编辑）
6. 集成实时更新
7. E2E 测试
8. 性能优化

---

## Phase 5: US3 (P3) - 繁殖周期管理 - 预计 1.5 周

**任务概览**: T056-T065 (10个任务)

**依赖**: Phase 3 (US1) 必须完成

---

## Phase 6: US4 (P4) - 饲料管理与成本核算 - 预计 1.5 周

**任务概览**: T066-T075 (10个任务)

**依赖**: Phase 3 (US1) 必须完成

---

## Phase 7: US5 (P5) - 数据分析与报表导出 - 预计 1 周

**任务概览**: T076-T082 (7个任务)

**依赖**: Phase 4, 5, 6 (需要数据积累)

---

## Phase 8: 完善与集成 - 预计 3-4 天

### T083: 创建统一错误处理机制
### T084: 添加离线支持（Service Worker）
### T085: 优化移动端体验
### T086: 创建用户帮助文档
### T087: 最终集成测试

---

## 📊 任务依赖图

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← 必须完成后才能开始任何用户故事
    ↓
    ├─→ Phase 3 (US1 - P1) ← MVP，最高优先级
    │       ↓
    │       ├─→ Phase 4 (US2 - P2) ← 依赖 US1
    │       ├─→ Phase 5 (US3 - P3) ← 依赖 US1
    │       └─→ Phase 6 (US4 - P4) ← 依赖 US1
    │               ↓
    └───────────→ Phase 7 (US5 - P5) ← 依赖 US2, US3, US4
                    ↓
                Phase 8 (Polish)
```

---

## 🔄 并行执行机会

### Phase 1 (Setup)
```
[并行组 1]
├── T001: Git 初始化
└── T002: 安装依赖

[顺序组 2]
├── T003: 配置 Astro
├── T004: 配置 Tailwind
├── T005: 配置 TypeScript
├── T006: 配置 Vitest
├── T007: 配置 Playwright
└── T010: 创建目录结构

[并行组 3]
├── T008: 环境变量
└── T009: Netlify 配置
```

### Phase 3 (US1)
```
[并行组 - 准备阶段]
├── T026: 定义类型
└── T027: 编写测试

[顺序组 - 实现阶段]
├── T028: 实现服务层
├── T029: 表单组件
└── T030: 表格组件

[并行组 - 页面阶段]
├── T031: 列表页
├── T032: 添加页
├── T033: 详情页
└── T034: 编辑页

[顺序组 - 集成阶段]
├── T035: Realtime 订阅
├── T036: 集成实时更新
├── T037: E2E 测试
└── T040: Lighthouse 测试
```

---

## 📈 开发里程碑

| 里程碑 | 完成标志 | 预计时间 |
|--------|----------|----------|
| **M1: 环境就绪** | Phase 1 & 2 完成，数据库运行 | 第 1 周 |
| **M2: MVP 发布** | Phase 3 (US1) 完成，可部署 | 第 3 周 |
| **M3: 核心功能** | Phase 4 (US2) 完成 | 第 5 周 |
| **M4: 扩展功能** | Phase 5-6 (US3-US4) 完成 | 第 7 周 |
| **M5: 完整系统** | Phase 7-8 (US5 + Polish) 完成 | 第 8-12 周 |

---

## 🎯 成功标准

### 技术标准
- [ ] 所有测试通过（单元 + 集成 + E2E）
- [ ] 测试覆盖率 > 80%（整体），> 95%（核心逻辑）
- [ ] Lighthouse 评分 > 90（所有指标）
- [ ] 无 TypeScript 错误
- [ ] 无 lint 错误
- [ ] 构建成功

### 功能标准
- [ ] US1-US5 所有验收场景通过
- [ ] 移动端（320px）可用性测试通过
- [ ] 实时同步功能正常
- [ ] RLS 策略正确执行
- [ ] 审计日志完整记录

### 部署标准
- [ ] Netlify 构建成功
- [ ] 环境变量正确配置
- [ ] CDN 缓存策略生效
- [ ] HTTPS 强制启用
- [ ] 安全头部正确配置

---

## 📝 开发建议

1. **严格遵循 TDD**: 每个功能先写测试（红色）→ 实现代码（绿色）→ 重构（保持绿色）

2. **增量交付**: 完成 US1 后立即部署 MVP，验证架构和用户反馈

3. **并行开发**: 利用标记 [P] 的任务机会，多人协作时可并行开发

4. **移动优先**: 所有 UI 组件从 320px 开始设计，逐步增强

5. **实时验证**: 每完成一个 Phase，运行完整测试套件和 Lighthouse

6. **文档同步**: 代码变更时同步更新注释和文档

---

**任务列表生成完成！** ✅

总计：**87个任务**，预计 **8-12 周**完成  
MVP 范围：**Phase 1-3**（T001-T040），预计 **3 周**

立即可开始执行 Phase 1（项目设置）。祝开发顺利！ 🚀

