# 奶牛实验数据管理系统 (Cow Experiment Data Management System)

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge-id/deploy-status)](https://app.netlify.com/sites/your-site-name/deploys)

一个基于 Jamstack 架构的现代化奶牛养殖数据管理系统,帮助养殖场实现数字化管理和科学决策。

## 🌟 核心功能

- **奶牛档案管理**: 完整的奶牛信息管理,包括编号、品种、系谱追溯
- **健康监测**: 每日体温、精神状态、食欲等健康数据记录与预警
- **产奶记录**: 产量、脂肪率、蛋白质率等质量指标跟踪
- **繁殖管理**: 从发情监测到产犊的完整繁殖周期管理
- **饲料管理**: 配方管理、投喂记录和成本核算
- **数据分析**: 多维度数据分析和可视化报表
- **实时同步**: 多用户协作,数据实时同步
- **移动优先**: 专为养殖场现场操作优化的移动端体验

## 🛠️ 技术栈

- **前端**: [Astro](https://astro.build/) 4.x + [Tailwind CSS](https://tailwindcss.com/) 3.x
- **后端**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Realtime)
- **部署**: [Netlify](https://www.netlify.com/)
- **状态管理**: [Nanostores](https://github.com/nanostores/nanostores)
- **数据可视化**: [Chart.js](https://www.chartjs.org/) 4.x
- **测试**: [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)

## 📋 前置要求

- **Node.js**: >= 20.x
- **pnpm**: >= 8.x (推荐使用pnpm)
- **Supabase CLI**: >= 1.x (用于本地开发)
- **Git**: >= 2.x

## 🚀 快速开始

### 1. 克隆项目

\`\`\`bash
git clone https://github.com/your-username/cowdatasystem.git
cd cowdatasystem
\`\`\`

### 2. 安装依赖

\`\`\`bash
pnpm install
\`\`\`

### 3. 配置环境变量

复制环境变量模板:

\`\`\`bash
cp .env.example .env.local
\`\`\`

编辑 \`.env.local\` 并填入你的 Supabase 项目信息:

\`\`\`env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
\`\`\`

### 4. 初始化 Supabase

\`\`\`bash
# 启动本地 Supabase 实例
pnpm supabase:start

# 应用数据库迁移
supabase db reset
\`\`\`

### 5. 启动开发服务器

\`\`\`bash
pnpm dev
\`\`\`

访问 [http://localhost:4321](http://localhost:4321)

## 📂 项目结构

\`\`\`
cowdatasystem/
├── src/
│   ├── pages/              # Astro 页面
│   ├── components/         # 可复用组件
│   ├── lib/                # 工具函数和核心逻辑
│   ├── services/           # 数据服务层
│   ├── types/              # TypeScript 类型定义
│   └── styles/             # 全局样式
├── netlify/
│   └── functions/          # Netlify Functions (serverless)
├── supabase/
│   ├── migrations/         # 数据库迁移脚本
│   └── seed.sql            # 测试数据
├── tests/
│   ├── unit/               # 单元测试
│   ├── integration/        # 集成测试
│   └── e2e/                # 端到端测试
├── public/                 # 静态资源
└── specs/                  # 项目规格文档
\`\`\`

## 🧪 测试

### 运行单元测试

\`\`\`bash
pnpm test:unit
\`\`\`

### 运行 E2E 测试

\`\`\`bash
pnpm test:e2e
\`\`\`

### 查看测试覆盖率

\`\`\`bash
pnpm test:unit --coverage
\`\`\`

## 📦 构建和部署

### 本地构建

\`\`\`bash
pnpm build
\`\`\`

### 预览构建结果

\`\`\`bash
pnpm preview
\`\`\`

### 部署到 Netlify

本项目配置了 Netlify 自动部署:

1. 将代码推送到 GitHub
2. 在 Netlify 中连接你的仓库
3. 配置环境变量 (SUPABASE_URL, SUPABASE_ANON_KEY)
4. Netlify 将自动构建和部署

## 🔒 安全与权限

系统实现了三级权限控制:

- **管理员 (admin)**: 全部权限,包括成本数据访问
- **养殖员 (staff)**: 可录入和查看数据,不可访问成本信息
- **访客 (guest)**: 只读权限

所有数据表启用了 Supabase Row Level Security (RLS),确保数据安全。

## 📖 文档

- [功能规格说明](./specs/001-netlify/spec.md)
- [实施计划](./specs/001-netlify/plan.md)
- [数据模型设计](./specs/001-netlify/data-model.md)
- [API 合约](./specs/001-netlify/contracts/)
- [快速上手指南](./specs/001-netlify/quickstart.md)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发规范

- **测试驱动开发 (TDD)**: 先写测试,再写实现
- **代码覆盖率**: 整体 ≥ 80%, 核心逻辑 ≥ 95%
- **代码风格**: 使用 Prettier 格式化,ESLint 检查
- **提交信息**: 遵循 [Conventional Commits](https://www.conventionalcommits.org/)

## 🐛 问题反馈

如果你发现了 bug 或有功能建议,请在 [Issues](https://github.com/your-username/cowdatasystem/issues) 中提交。

## 📝 许可证

[MIT License](./LICENSE)

## 👥 作者

- **项目维护者**: Your Name
- **邮箱**: your.email@example.com

## 🙏 致谢

- [Astro](https://astro.build/) - 现代化的 Web 框架
- [Supabase](https://supabase.com/) - 开源的 Firebase 替代品
- [Netlify](https://www.netlify.com/) - 出色的部署平台
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架

---

**版本**: v1.0.0  
**最后更新**: 2025-10-12

