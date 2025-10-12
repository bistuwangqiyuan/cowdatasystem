# Quick Start Guide: 奶牛实验数据管理系统

**Feature**: 001-netlify  
**Date**: 2025-10-11  
**Target Audience**: Developers joining the project

本文档提供完整的项目设置和开发流程指南，帮助开发者在30分钟内完成环境配置并开始开发。

---

## 📋 前置要求 (Prerequisites)

在开始之前，请确保已安装以下工具：

| 工具 | 版本要求 | 安装链接 |
|------|----------|----------|
| Node.js | 18.x 或 20.x | https://nodejs.org/ |
| pnpm | 8.x+ | `npm install -g pnpm` |
| Git | 最新版 | https://git-scm.com/ |
| Supabase CLI | 最新版 | `npm install -g supabase` |
| Netlify CLI | 最新版 | `npm install -g netlify-cli` |

**推荐编辑器**: VS Code + Astro Extension + Tailwind CSS IntelliSense

---

## 🚀 快速开始 (5分钟设置)

### 1. 克隆仓库

```bash
# 克隆项目
git clone <repository-url> cowdatasystem
cd cowdatasystem

# 切换到功能分支
git checkout 001-netlify

# 安装依赖
pnpm install
```

### 2. 设置 Supabase 项目

#### 选项 A：使用现有 Supabase 项目

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local，填入 Supabase 项目信息
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
```

#### 选项 B：创建新 Supabase 项目（推荐用于开发）

```bash
# 使用 Supabase CLI 创建本地项目
supabase init

# 启动本地 Supabase 服务（Docker 容器）
supabase start

# 输出会显示本地项目的 URL 和密钥
# API URL: http://localhost:54321
# anon key: eyJhbGciOiJIUzI1...

# 将输出的信息填入 .env.local
```

### 3. 初始化数据库

```bash
# 运行迁移脚本（创建所有表、RLS 策略、触发器）
supabase db push

# 或手动执行 SQL 文件
cat specs/001-netlify/contracts/supabase-migration.sql | supabase db execute
cat specs/001-netlify/contracts/supabase-rls.sql | supabase db execute

# 插入种子数据（可选，用于开发测试）
cat supabase/seed.sql | supabase db execute
```

### 4. 运行开发服务器

```bash
# 启动 Astro 开发服务器
pnpm dev

# 访问 http://localhost:4321
```

✅ **设置完成！** 现在可以开始开发了。

---

## 📁 项目结构概览

```
cowdatasystem/
├── src/
│   ├── pages/              # Astro 页面（路由）
│   │   ├── index.astro     # 首页
│   │   ├── login.astro     # 登录页
│   │   ├── cows/           # 奶牛管理模块
│   │   ├── health/         # 健康记录模块
│   │   └── analytics/      # 数据分析模块
│   ├── components/         # 可复用组件
│   │   ├── layout/         # 布局组件
│   │   ├── forms/          # 表单组件
│   │   └── charts/         # 图表组件
│   ├── lib/                # 工具函数
│   │   ├── supabase.ts     # Supabase 客户端
│   │   ├── auth.ts         # 认证工具
│   │   └── validation.ts   # 数据验证
│   ├── services/           # 数据服务层
│   │   ├── cows.service.ts # 奶牛服务
│   │   └── health.service.ts # 健康记录服务
│   └── types/              # TypeScript 类型定义
│
├── netlify/
│   └── functions/          # Netlify Functions
│       ├── export-report.ts # 报表导出
│       └── send-notification.ts # 推送通知
│
├── tests/                  # 测试文件
│   ├── unit/               # 单元测试
│   ├── integration/        # 集成测试
│   └── e2e/                # 端到端测试
│
├── supabase/               # Supabase 配置
│   ├── migrations/         # 数据库迁移
│   └── seed.sql            # 种子数据
│
├── specs/                  # 功能规格文档
└── package.json
```

---

## 🔐 环境变量配置

### `.env.local` 文件内容

```bash
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here  # 仅在 Netlify Functions 使用

# 可选：第三方服务
SENDGRID_API_KEY=your-sendgrid-key  # 邮件通知
```

### 环境变量说明

| 变量名 | 用途 | 获取方式 |
|--------|------|----------|
| `SUPABASE_URL` | Supabase 项目 URL | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | 匿名密钥（客户端使用） | 同上 |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务角色密钥（绕过 RLS） | 同上，⚠️ 仅在服务器端使用 |

**⚠️ 安全提醒**:
- 永远不要将 `.env.local` 提交到 Git
- `SUPABASE_SERVICE_ROLE_KEY` 拥有管理员权限，仅在 Netlify Functions 中使用
- `SUPABASE_ANON_KEY` 可在客户端使用，通过 RLS 限制权限

---

## 🧪 测试流程

### TDD 工作流（测试驱动开发）

```bash
# 1. 运行测试 watch 模式（编写新功能前）
pnpm test:watch

# 2. 编写测试用例（红色）
# 在 tests/unit/services/cows.service.test.ts 中编写测试

# 3. 运行测试，看到失败（红色）
# 测试自动运行并失败

# 4. 实现功能代码（绿色）
# 在 src/services/cows.service.ts 中实现代码

# 5. 测试通过（绿色）
# 测试自动运行并通过

# 6. 重构代码（保持绿色）
# 优化代码，测试持续通过
```

### 运行测试

```bash
# 单元测试
pnpm test:unit

# 集成测试（需要 Supabase 运行）
pnpm test:integration

# 端到端测试（需要开发服务器运行）
pnpm test:e2e

# 所有测试 + 覆盖率报告
pnpm test:coverage

# 测试 watch 模式（开发中推荐）
pnpm test:watch
```

### 测试覆盖率要求

- **整体覆盖率**: ≥ 80%
- **核心业务逻辑**: ≥ 95%（如 validation.ts、auth.ts）
- **服务层**: ≥ 85%（如 cows.service.ts）

---

## 💾 数据库管理

### 创建迁移

```bash
# 创建新迁移文件
supabase migration new add_new_feature

# 编辑迁移文件
# 位于 supabase/migrations/[timestamp]_add_new_feature.sql

# 应用迁移到本地数据库
supabase db push

# 应用迁移到远程数据库（生产环境）
supabase db push --linked
```

### 数据库操作

```bash
# 查看当前数据库状态
supabase db status

# 重置本地数据库（清空所有数据）
supabase db reset

# 导出数据库架构
supabase db dump > schema.sql

# 查看数据库日志
supabase db logs
```

### 数据库工具

```bash
# 打开 Supabase Studio（本地数据库 UI）
supabase studio

# 访问 http://localhost:54323
# 可视化管理表、RLS 策略、函数等
```

---

## 🎨 开发常用命令

### Astro 开发

```bash
# 启动开发服务器（热重载）
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview

# 检查代码格式
pnpm lint

# 自动修复格式问题
pnpm lint:fix

# 类型检查
pnpm typecheck
```

### Netlify 本地开发

```bash
# 启动 Netlify Dev（模拟 Netlify 环境）
netlify dev

# 访问 http://localhost:8888
# 自动代理 Netlify Functions

# 测试 Netlify Function
curl http://localhost:8888/.netlify/functions/export-report
```

---

## 🚢 部署流程

### 部署到 Netlify

#### 方法 1：Git 连接（推荐）

1. 将代码推送到 GitHub/GitLab
2. 在 Netlify Dashboard 中连接仓库
3. 配置构建设置：
   - Build command: `pnpm build`
   - Publish directory: `dist`
4. 添加环境变量（SUPABASE_URL, SUPABASE_ANON_KEY）
5. 点击 "Deploy site"

#### 方法 2：Netlify CLI 手动部署

```bash
# 登录 Netlify
netlify login

# 初始化项目（首次部署）
netlify init

# 构建项目
pnpm build

# 部署到预览环境
netlify deploy

# 部署到生产环境
netlify deploy --prod
```

### 部署前检查清单

- [ ] 所有测试通过（`pnpm test`）
- [ ] 构建成功（`pnpm build`）
- [ ] 环境变量已在 Netlify 配置
- [ ] Supabase 迁移已应用到生产数据库
- [ ] RLS 策略已启用
- [ ] Lighthouse 评分 > 90

---

## 🔍 常见问题排查

### 问题 1: Supabase 连接失败

**症状**: 页面加载时显示 "Failed to fetch"

**解决方案**:
```bash
# 检查 Supabase 服务是否运行
supabase status

# 如果未运行，启动服务
supabase start

# 检查 .env.local 中的 URL 和密钥是否正确
cat .env.local
```

### 问题 2: RLS 策略导致无法访问数据

**症状**: 查询返回空数组，但数据库中有数据

**解决方案**:
```bash
# 检查 RLS 策略是否正确
supabase studio

# 在 Studio 中导航到 Authentication → Policies
# 确认策略已启用且逻辑正确

# 临时禁用 RLS 进行测试（仅本地）
ALTER TABLE cows DISABLE ROW LEVEL SECURITY;

# 测试完成后重新启用
ALTER TABLE cows ENABLE ROW LEVEL SECURITY;
```

### 问题 3: Netlify Functions 超时

**症状**: Functions 执行时间 > 10 秒

**解决方案**:
```typescript
// 优化 Function 性能
// 1. 使用 Service Role Key 绕过 RLS（仅在必要时）
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // 绕过 RLS
);

// 2. 限制查询数据量
const { data } = await supabase
  .from('cows')
  .select('*')
  .limit(100);  // 添加限制

// 3. 使用批量操作
const { data } = await supabase
  .from('health_records')
  .insert(recordsArray);  // 批量插入而非逐条插入
```

### 问题 4: 构建失败

**症状**: `pnpm build` 失败

**解决方案**:
```bash
# 清理缓存
rm -rf node_modules .astro dist
pnpm install

# 检查 TypeScript 错误
pnpm typecheck

# 检查 lint 错误
pnpm lint

# 逐步构建排查
pnpm astro check
```

---

## 📖 延伸阅读

### 项目文档

- [功能规格说明](./spec.md) - 完整的需求和验收标准
- [实施计划](./plan.md) - 技术架构和开发计划
- [研究文档](./research.md) - 技术选型和决策理由
- [数据模型](./data-model.md) - 数据库架构详解

### 技术文档

- [Astro 文档](https://docs.astro.build/)
- [Supabase 文档](https://supabase.com/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Netlify 文档](https://docs.netlify.com/)
- [Vitest 文档](https://vitest.dev/)
- [Playwright 文档](https://playwright.dev/)

### 项目原则

- [Constitution](../../.specify/memory/constitution.md) - 项目核心原则（TDD、文档、Jamstack、安全等）

---

## 🆘 获取帮助

### 遇到问题？

1. **查看文档**: 先阅读本文档和相关技术文档
2. **搜索 Issue**: 在项目 Issue 中搜索类似问题
3. **创建 Issue**: 提供详细的错误信息和复现步骤
4. **联系团队**: 在团队沟通渠道中提问

### 调试技巧

```bash
# 查看 Astro 详细日志
DEBUG=astro:* pnpm dev

# 查看 Supabase 日志
supabase db logs

# 查看 Netlify Functions 日志
netlify functions:log <function-name>

# 使用浏览器开发者工具
# Network 面板 → 查看 API 请求
# Console 面板 → 查看错误信息
```

---

## ✅ 开发流程清单

每次开发新功能时，遵循以下流程：

1. **规划阶段**
   - [ ] 阅读功能规格（spec.md）
   - [ ] 理解验收标准
   - [ ] 设计数据模型（如需要）

2. **TDD 阶段**
   - [ ] 编写测试用例（红色）
   - [ ] 运行测试，看到失败
   - [ ] 实现功能代码（绿色）
   - [ ] 测试通过
   - [ ] 重构代码

3. **集成阶段**
   - [ ] 更新 Supabase 迁移（如需要）
   - [ ] 添加 RLS 策略
   - [ ] 测试实时订阅（如需要）
   - [ ] 添加审计日志

4. **UI 阶段**
   - [ ] 移动端优先设计（320px 起）
   - [ ] 适配平板和桌面端
   - [ ] 测试触控交互
   - [ ] 添加加载状态和错误处理

5. **文档阶段**
   - [ ] 添加代码注释（TSDoc）
   - [ ] 更新 README（如需要）
   - [ ] 编写组件使用示例

6. **提交阶段**
   - [ ] 运行所有测试
   - [ ] 检查代码覆盖率
   - [ ] 运行 lint 和 typecheck
   - [ ] 提交 Git commit（遵循 Conventional Commits）
   - [ ] 创建 Pull Request

---

**快速上手指南完成！** 🎉

如有任何问题，请参考[延伸阅读](#📖-延伸阅读)或联系团队。

祝编码愉快！ Happy Coding! 🚀

