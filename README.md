# 奶牛实验数据管理系统

## 📋 项目概述

奶牛实验数据管理系统是一个基于现代 Jamstack 架构的 Web 应用，旨在帮助奶牛养殖场实现数字化管理，提升管理效率和科学决策能力。

系统集成了奶牛档案管理、健康监测、产奶记录、繁殖管理、饲料管理和数据分析等功能模块，为养殖场提供全方位的数据管理解决方案。

## 🎯 核心功能

- **奶牛档案管理**: 完整记录奶牛基本信息、血缘关系、照片等
- **健康监测**: 每日记录体温、精神状态、食欲等健康指标
- **产奶记录**: 详细记录每次挤奶数据（产量、脂肪率、蛋白质率等）
- **繁殖管理**: 追踪配种、妊娠检查、预产期、产犊等繁殖全周期
- **饲料管理**: 管理饲料配方、投喂记录和成本核算
- **数据分析**: 生成可视化图表和统计报表

## 🛠️ 技术栈

### 前端
- **Astro 4.x**: 静态站点生成器，支持 hybrid 渲染模式
- **Tailwind CSS 3.x**: 原子化 CSS 框架，实现响应式设计
- **TypeScript 5.3+**: 类型安全的 JavaScript 超集
- **Chart.js**: 数据可视化库
- **Nanostores**: 轻量级状态管理

### 后端 & 数据库
- **Supabase**: 
  - PostgreSQL 数据库
  - Row-Level Security (RLS) 权限控制
  - Realtime 实时数据同步
  - Auth 用户认证
- **Netlify Functions**: 无服务器后端函数

### 测试
- **Vitest**: 单元测试框架
- **Playwright**: 端到端测试框架

### 部署
- **Netlify**: 静态站点托管和 CI/CD

## 📁 项目结构

```
cowdatasystem/
├── src/
│   ├── pages/              # 页面路由
│   │   ├── index.astro     # 首页
│   │   ├── login.astro     # 登录页
│   │   ├── cows/           # 奶牛管理页面
│   │   ├── health/         # 健康记录页面
│   │   ├── milk/           # 产奶记录页面
│   │   ├── breeding/       # 繁殖管理页面
│   │   ├── feed/           # 饲料管理页面
│   │   └── analytics/      # 数据分析页面
│   ├── components/         # 组件
│   │   ├── layout/         # 布局组件
│   │   ├── forms/          # 表单组件
│   │   ├── tables/         # 表格组件
│   │   └── charts/         # 图表组件
│   ├── lib/                # 工具库
│   │   ├── supabase.ts     # Supabase 客户端
│   │   ├── auth.ts         # 认证工具
│   │   ├── validation.ts   # 数据验证
│   │   └── realtime.ts     # 实时订阅
│   ├── services/           # 业务逻辑层
│   ├── types/              # TypeScript 类型定义
│   └── styles/             # 全局样式
├── supabase/
│   ├── migrations/         # 数据库迁移脚本
│   │   ├── 001_initial_schema.sql
│   │   └── 002_rls_policies.sql
│   └── seed.sql            # 种子数据
├── netlify/
│   └── functions/          # Netlify 无服务器函数
├── tests/
│   ├── unit/               # 单元测试
│   ├── integration/        # 集成测试
│   └── e2e/                # 端到端测试
├── specs/                  # 功能规格说明
│   └── 001-netlify/
│       ├── spec.md         # 需求规格
│       ├── plan.md         # 实施计划
│       ├── tasks.md        # 任务清单
│       ├── data-model.md   # 数据模型
│       └── contracts/      # API 合约
├── public/                 # 静态资源
├── astro.config.mjs        # Astro 配置
├── tailwind.config.cjs     # Tailwind CSS 配置
├── tsconfig.json           # TypeScript 配置
├── vitest.config.ts        # Vitest 配置
├── playwright.config.ts    # Playwright 配置
├── netlify.toml            # Netlify 配置
└── package.json            # 项目依赖

```

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0 → [下载安装](https://nodejs.org/)
- **pnpm**: >= 8.0.0 → [安装指南](https://pnpm.io/installation)
- **Git**: >= 2.0.0 → [下载安装](https://git-scm.com/downloads)
- **Supabase 账号** → [免费注册](https://supabase.com/dashboard/sign-up)
- **Netlify 账号** → [免费注册](https://app.netlify.com/signup)

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone <repository-url>
   cd cowdatasystem
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **配置环境变量**
   
   **步骤 3.1**: 创建 Supabase 项目
   - 访问 [Supabase Dashboard](https://supabase.com/dashboard)
   - 点击 **"New project"** 按钮
   - 填写项目名称、数据库密码、地区
   - 等待项目创建完成（约2-3分钟）
   
   **步骤 3.2**: 获取 API 凭证
   - 进入项目设置：[Settings → API](https://supabase.com/dashboard/project/_/settings/api)
   - 复制以下信息：
     * **Project URL** (格式: `https://xxx.supabase.co`)
     * **anon public** key
     * **service_role** key（仅服务器端使用）
   
   **步骤 3.3**: 配置本地环境
   
   创建 `.env` 文件：
   ```bash
   # Windows PowerShell
   New-Item -Path .env -ItemType File
   
   # macOS/Linux
   touch .env
   ```
   
   编辑 `.env` 填入您的凭证：
   ```env
   PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
   
   > 💡 **在哪里找到这些信息？**
   > - 直达链接：[您的项目 API 设置](https://supabase.com/dashboard/project/_/settings/api)
   > - 详细说明：[Supabase 文档 - API 密钥](https://supabase.com/docs/guides/api/api-keys)

4. **初始化数据库并导入测试数据**
   
   **方式一：通过 SQL Editor（推荐，最简单）**
   
   1. 进入 [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
   2. 点击 **"New query"** 创建新查询
   3. 打开项目中的 [`database_setup_with_testdata.sql`](./database_setup_with_testdata.sql) 文件
   4. 复制全部内容并粘贴到 SQL Editor
   5. 点击 **"Run"** 按钮执行
   6. 看到成功消息：`✅ 成功插入3头测试奶牛及其健康和产奶记录！`
   
   **方式二：通过 Supabase CLI**
   
   ```bash
   # 安装 Supabase CLI（如果尚未安装）
   npm install -g supabase
   
   # 链接到远程项目
   supabase link --project-ref YOUR_PROJECT_ID
   
   # 应用迁移
   supabase db push
   ```
   
   > 📖 **详细指南和常见问题**
   > - 完整步骤：[数据库设置指南](./SUPABASE_TESTDATA_GUIDE.md)
   > - 遇到错误？[故障排查](./SUPABASE_TESTDATA_GUIDE.md#常见问题)
   > - 测试数据说明：[测试数据详情](./SUPABASE_TESTDATA_GUIDE.md#测试数据详情)

5. **启动开发服务器**
   ```bash
   pnpm dev
   ```
   
   ✅ **启动成功标志**：
   - 控制台显示：`Server running at http://localhost:4321/`
   - 浏览器自动打开或手动访问：[http://localhost:4321](http://localhost:4321)
   
   **快速测试各功能模块**：
   - 🐄 [奶牛档案](http://localhost:4321/cows) - 应显示3条测试数据
   - 🏥 [健康记录](http://localhost:4321/health) - 应显示3条健康记录
   - 🥛 [产奶记录](http://localhost:4321/milk) - 应显示6条产奶记录
   - 💑 [繁殖管理](http://localhost:4321/breeding) - 功能演示页面
   - 🌾 [饲料管理](http://localhost:4321/feed) - 功能演示页面
   - 📊 [数据分析](http://localhost:4321/analytics) - 数据可视化
   
   > ⚠️ **看不到数据？** 
   > 1. 确认步骤4已成功执行
   > 2. 检查浏览器控制台是否有错误
   > 3. 验证 `.env` 文件配置正确
   > 4. 查看 [常见问题](#常见问题)

## 🧪 测试

### 运行所有测试
```bash
pnpm test
```

### 运行单元测试
```bash
pnpm test:unit
```

### 运行集成测试
```bash
pnpm test:integration
```

### 运行 E2E 测试
```bash
pnpm test:e2e
```

### 测试覆盖率
```bash
pnpm test:coverage
```

## 📦 构建 & 部署

### 本地构建
```bash
pnpm build
```

### 预览构建产物
```bash
pnpm preview
```

### 部署到 Netlify

#### 通过 CLI 部署
```bash
# 首次部署
pnpm netlify deploy

# 生产环境部署
pnpm netlify deploy --prod
```

#### 通过 Git 自动部署
1. 将代码推送到 GitHub
2. 在 Netlify 控制台连接 GitHub 仓库
3. 配置构建设置：
   - Build command: `pnpm build`
   - Publish directory: `dist`
4. 添加环境变量（Supabase 凭证）
5. 触发部署

## 📊 数据模型

系统包含以下核心数据表：

- **users**: 用户信息（admin/staff/guest）
- **cows**: 奶牛档案（编号、品种、性别、血缘关系等）
- **health_records**: 健康记录（体温、精神状态、食欲等）
- **milk_records**: 产奶记录（产量、脂肪率、蛋白质率等）
- **breeding_records**: 繁殖记录（配种、妊娠、产犊等）
- **feed_formulas**: 饲料配方（成分、营养、成本等）
- **feeding_records**: 投喂记录（时间、用量、成本等）
- **medical_records**: 医疗记录（疫苗、治疗等）
- **notifications**: 系统通知（健康预警、繁殖提醒等）
- **audit_logs**: 审计日志（所有数据变更记录）

详细数据模型请参考 [specs/001-netlify/data-model.md](specs/001-netlify/data-model.md)

## 🔐 安全性

### Row-Level Security (RLS)

所有数据表启用了 Row-Level Security，实现基于角色的访问控制：

- **Admin**: 完全访问权限（读、写、删除）
- **Staff**: 读写权限（不能删除）
- **Guest**: 只读权限

### 数据加密

- 传输层加密（HTTPS/TLS）
- 密码使用 bcrypt 加密存储
- 敏感数据字段加密

### 审计日志

所有数据变更（INSERT/UPDATE/DELETE）自动记录到 `audit_logs` 表，包含：
- 操作类型
- 操作用户
- 变更前后的数据
- 操作时间
- IP 地址和 User-Agent

## 📱 移动端支持

系统采用移动优先设计（Mobile-First），支持：

- 响应式布局（320px - 1920px）
- 触控友好的 UI 元素（最小 44x44px）
- PWA 支持（离线缓存、可安装）
- 实时数据同步

## 📝 开发规范

### 代码风格

- ES6+ 语法
- camelCase 变量命名
- PascalCase 组件命名
- 每个文件顶部添加文档注释

### Git 提交规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具链相关
```

### 测试驱动开发 (TDD)

所有新功能必须：
1. 先编写测试用例
2. 实现功能代码
3. 确保测试通过
4. 代码覆盖率 >= 80%

## 🔧 故障排查

### 常见问题

**问题 1**: Supabase 连接失败
- 检查 `.env.local` 中的环境变量是否正确
- 确认 Supabase 项目状态正常
- 检查网络连接

**问题 2**: 构建失败
- 清理缓存：`rm -rf node_modules .astro dist && pnpm install`
- 检查 Node.js 版本是否符合要求
- 查看构建日志定位具体错误

**问题 3**: RLS 权限错误
- 确认用户已登录
- 检查用户角色是否正确
- 查看 RLS 策略配置

## 📄 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。

## 👥 团队

- 项目负责人: [Your Name]
- 技术架构师: [Your Name]
- 开发团队: [Team Members]

## 📮 联系方式

- 邮箱: support@example.com
- 技术支持: tech@example.com
- GitHub Issues: [Repository Issues]

---

**版本**: v0.2.0-MVP  
**更新日期**: 2025-10-12  
**状态**: MVP 完成 ✅ 可部署

## ❓ 常见问题 (FAQ)

### Q1: 如何获取 Supabase API 密钥？

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目
3. 进入 [Settings → API](https://supabase.com/dashboard/project/_/settings/api)
4. 复制 `Project URL`、`anon public key` 和 `service_role key`

📖 [Supabase API 密钥文档](https://supabase.com/docs/guides/api/api-keys)

### Q2: 数据库初始化失败怎么办？

**常见错误及解决方法**：

- **表已存在**: 使用新的 Supabase 项目或先删除现有表
- **权限不足**: 在 SQL Editor 中执行（自动使用管理员权限）
- **找不到 auth.users**: 确保已启用 Authentication 功能

📖 [数据库故障排查](./SUPABASE_TESTDATA_GUIDE.md#常见问题)

### Q3: 本地开发时看不到数据？

1. 检查 `.env` 文件配置
2. 浏览器控制台查看网络请求
3. 在 [Table Editor](https://supabase.com/dashboard/project/_/editor) 确认数据已导入
4. 确认已执行 RLS 策略脚本

### Q4: Netlify 部署失败？

- **构建失败**: 确认所有依赖已提交
- **环境变量**: 在 [Netlify 设置](https://app.netlify.com/sites/cowdatasystem/settings/env) 中配置
- **配置错误**: 检查 `netlify.toml` 语法

📖 [部署指南](./QUICK_DEPLOY.md) | [Netlify 文档](https://docs.netlify.com/)

### Q5: 需要帮助？

- 📖 [项目文档](./specs/)
- 🐛 [报告问题](https://github.com/bistuwangqiyuan/cowdatasystem/issues)
- 📧 联系：wangqiyuan@bistu.edu.cn

---

## 📝 任务清单 (TASK)

### ✅ 已完成任务

#### Phase 1: 项目设置 (2025-10-12)
- [x] T001-T010: 初始化项目环境、安装依赖、配置文件

#### Phase 2: 基础设施 (2025-10-12)
- [x] T011-T015: Supabase 项目设置、数据库迁移、RLS 策略
- [x] T016-T018: 创建 Supabase 客户端、认证工具类及测试
- [x] T019-T020: 创建数据验证工具及测试
- [x] T021-T024: 创建布局组件、首页和登录页

#### Phase 3: US1 奶牛档案管理 (2025-10-12) ✅ MVP
- [x] T026-T033: 奶牛类型、服务层、表单、列表、详情、新增/编辑页面
- [x] T027: 服务层单元测试
- [x] 奶牛 CRUD 功能完整实现
- [x] 搜索和筛选功能
- [x] 实时数据同步
- [x] 响应式设计

#### Phase 4: US2 健康与产奶记录 (2025-10-12) ✅ 完成
- [x] 健康记录类型定义和服务层
- [x] 产奶记录类型定义和服务层
- [x] 健康记录列表页面
- [x] 产奶记录列表页面
- [x] 健康记录表单组件和新增页面
- [x] 产奶记录表单组件和新增页面
- [x] 数据验证和错误处理

#### Phase 5-7: 数据分析 (2025-10-12) ⚡ 基础完成
- [x] 数据统计页面（奶牛统计、品种分布）
- [ ] 高级数据可视化图表
- [ ] 繁殖管理功能
- [ ] 饲料管理功能

### 🔄 进行中任务

#### Phase 4-8: 功能完善
- [ ] 完善健康和产奶记录的表单和详情页面
- [ ] 实现繁殖管理功能
- [ ] 实现饲料管理功能
- [ ] 添加数据可视化图表
- [ ] E2E 测试
- [ ] 性能优化

### ⏳ 待开发任务

#### Phase 4: US2 健康与产奶记录
- [ ] T041-T055: 健康记录和产奶记录管理

#### Phase 5: US3 繁殖管理
- [ ] T056-T065: 繁殖周期追踪和管理

#### Phase 6: US4 饲料管理
- [ ] T066-T075: 饲料配方和投喂记录管理

#### Phase 7: US5 数据分析
- [ ] T076-T082: 数据统计和可视化报表

#### Phase 8: 完善与集成
- [ ] T083-T087: 性能优化、文档完善、部署准备

### 📅 开发中新发现的任务

_(开发过程中发现的新任务将记录在此)_

---

**注意**: 请保持此任务清单更新，完成任务后及时标记。
