# 奶牛实验数据管理系统 - 部署指南

## 📋 部署前准备

### 环境要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Netlify CLI (可选)
- Supabase 账号

---

## 🗄️ Supabase 数据库配置

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 记录项目URL和API密钥

### 2. 运行数据库迁移

```sql
-- 在 Supabase SQL Editor 中执行以下文件内容

-- 1. 基础架构
-- 复制并执行 supabase/migrations/001_initial_schema.sql

-- 2. RLS 策略
-- 复制并执行 supabase/migrations/002_rls_policies.sql

-- 3. 种子数据（可选，用于测试）
-- 复制并执行 supabase/seed.sql
```

### 3. 创建测试用户

在 Supabase Auth 中创建测试用户：
- 邮箱: admin@example.com
- 密码: (设置您的密码)
- 角色: 需要在 `users` 表中手动添加记录并关联

---

## 🔧 本地开发配置

### 1. 克隆项目

```bash
git clone <repository-url>
cd cowdatasystem
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

创建 `.env.local` 文件：

```env
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:4321

---

## 🚀 Netlify 部署

### 方法 1: 通过 Git 自动部署 (推荐)

1. **推送代码到 GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **在 Netlify 控制台**
   - 点击 "New site from Git"
   - 选择您的 GitHub 仓库
   - 配置构建设置:
     - Build command: `pnpm build`
     - Publish directory: `dist`
   
3. **添加环境变量**
   - 在 Netlify 站点设置中添加:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
   
4. **触发部署**
   - Netlify 会自动构建和部署

### 方法 2: 通过 CLI 手动部署

1. **安装 Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **登录 Netlify**
   ```bash
   netlify login
   ```

3. **构建项目**
   ```bash
   pnpm build
   ```

4. **部署到生产环境**
   ```bash
   netlify deploy --prod
   ```

---

## 🔐 安全配置

### 1. Supabase RLS 策略

确保所有表都启用了 RLS：
```sql
-- 检查 RLS 状态
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 2. API 密钥管理

- ⚠️ **永远不要**将 `SUPABASE_SERVICE_ROLE_KEY` 暴露给客户端
- 仅在 Netlify Functions 中使用 Service Role Key
- 在客户端只使用 Anon Key

### 3. 安全头部

已在 `netlify.toml` 中配置：
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`

---

## ✅ 部署后验证

### 1. 功能测试清单

- [ ] 用户可以登录
- [ ] 奶牛列表正常显示
- [ ] 可以创建新奶牛
- [ ] 可以编辑奶牛信息
- [ ] 搜索和筛选功能正常
- [ ] 健康记录可以添加
- [ ] 产奶记录可以添加
- [ ] 数据统计页面正常

### 2. 性能检查

```bash
# 使用 Lighthouse 检查性能
npx lighthouse https://your-site.netlify.app --view
```

目标指标：
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

### 3. 错误监控

检查 Netlify 函数日志：
```bash
netlify functions:log
```

---

## 🔄 持续部署流程

### Git 分支策略

```
main (生产环境)
  ↑
develop (开发环境)
  ↑
feature/* (功能分支)
```

### 部署流程

1. **功能开发**
   ```bash
   git checkout -b feature/new-feature
   # 开发...
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

2. **合并到 develop**
   ```bash
   git checkout develop
   git merge feature/new-feature
   git push origin develop
   ```

3. **部署到生产**
   ```bash
   git checkout main
   git merge develop
   git push origin main  # 触发自动部署
   ```

---

## 📊 监控和维护

### 1. 数据库备份

Supabase 自动备份，但建议：
- 每周手动导出重要数据
- 保存迁移脚本的版本

### 2. 日志监控

- Netlify 函数日志: 查看 API 错误
- Supabase 日志: 查看数据库查询
- 浏览器控制台: 查看客户端错误

### 3. 性能监控

使用 Netlify Analytics 监控：
- 页面加载时间
- 访问量
- 地理分布

---

## 🐛 故障排查

### 问题 1: 构建失败

**症状**: Netlify 构建失败  
**解决**:
```bash
# 本地测试构建
pnpm build

# 检查错误日志
# 确保所有环境变量已设置
```

### 问题 2: Supabase 连接失败

**症状**: "Failed to fetch"  
**解决**:
1. 检查环境变量是否正确
2. 检查 Supabase 项目状态
3. 验证 API 密钥有效性

### 问题 3: RLS 权限错误

**症状**: "Permission denied"  
**解决**:
```sql
-- 检查 RLS 策略
SELECT * FROM pg_policies 
WHERE tablename = 'cows';

-- 确保用户在 users 表中存在
SELECT * FROM users WHERE id = 'your-user-id';
```

### 问题 4: 页面 404 错误

**症状**: 动态路由不工作  
**解决**:
- 确保 `netlify.toml` 中的重定向规则正确
- 检查 Astro 配置中的 `output: 'hybrid'`

---

## 📚 其他资源

- [Astro 文档](https://docs.astro.build/)
- [Supabase 文档](https://supabase.com/docs)
- [Netlify 文档](https://docs.netlify.com/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

---

## 🆘 获取帮助

如遇到问题：
1. 查看项目 README.md
2. 查看 IMPLEMENTATION_REPORT.md
3. 检查 GitHub Issues
4. 联系技术支持

---

**部署指南版本**: v1.0  
**最后更新**: 2025-10-12

