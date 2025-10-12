# 🔐 Netlify 环境变量设置指南

## ⚠️ 重要提示

您的应用当前**缺少 Supabase 环境变量**，导致登录和所有数据库操作失败。

**错误信息：**
```
Missing Supabase environment variables. 
Required: SUPABASE_URL, SUPABASE_ANON_KEY
```

---

## 🚀 快速修复（3分钟）

### 步骤 1：获取 Supabase 凭据

1. 访问 **Supabase Dashboard**: https://supabase.com/dashboard
2. 选择您的项目
3. 点击左侧菜单的 **⚙️ Settings** → **API**
4. 找到以下信息：

   **项目 URL:**
   ```
   https://YOUR_PROJECT_REF.supabase.co
   ```
   
   **anon public (公开密钥):**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...（很长的字符串）
   ```
   
   **service_role (服务密钥 - 保密！):**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...（很长的字符串）
   ```

📋 **复制这三个值备用**

---

### 步骤 2：在 Netlify 中设置环境变量

#### 方法 A：通过 Netlify Dashboard（推荐）

1. 访问 **Netlify Dashboard**: https://app.netlify.com
2. 选择您的项目：`cowdatasystem`
3. 导航到：**Site configuration** → **Environment variables**
   - 或直接访问：`https://app.netlify.com/sites/cowdatasystem/configuration/env`

4. 点击 **Add a variable** → **Add a single variable**

5. 添加以下 **3 个环境变量**：

   **变量 1:**
   - Key: `SUPABASE_URL`
   - Value: `https://YOUR_PROJECT_REF.supabase.co`
   - Scopes: ✅ 所有分支 (Builds, Functions, Post-processing)
   
   **变量 2:**
   - Key: `SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`（您的 anon public key）
   - Scopes: ✅ 所有分支
   
   **变量 3:**
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`（您的 service_role key）
   - Scopes: ✅ 所有分支

6. 点击 **Save**

---

#### 方法 B：通过 Netlify CLI

如果您已经安装了 Netlify CLI：

```bash
# 设置环境变量
netlify env:set SUPABASE_URL "https://YOUR_PROJECT_REF.supabase.co"
netlify env:set SUPABASE_ANON_KEY "your_anon_key_here"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your_service_role_key_here"

# 验证设置
netlify env:list
```

---

### 步骤 3：触发重新部署

环境变量设置后，需要重新部署应用：

#### 选项 A：自动部署（推荐）
```bash
# 推送任何代码更改
git commit --allow-empty -m "chore: trigger redeploy"
git push origin main
```

#### 选项 B：手动部署
1. 在 Netlify Dashboard 中
2. 导航到：**Deploys**
3. 点击 **Trigger deploy** → **Deploy site**

---

### 步骤 4：验证修复

部署完成后（约 2-3 分钟），访问：
- **登录页面**: https://cowdatasystem.netlify.app/login
- 尝试登录，应该不再显示环境变量错误

---

## 🔒 安全注意事项

### ⚠️ 敏感信息保护

- **SUPABASE_ANON_KEY**: 可以在客户端使用（安全）
- **SUPABASE_SERVICE_ROLE_KEY**: **绝对不要在客户端暴露！**
  - 只在服务端/Netlify Functions 中使用
  - 具有管理员权限，可以绕过 RLS

### ✅ 最佳实践

1. **不要提交到 Git**：
   - `.env` 文件已在 `.gitignore` 中
   - 永远不要将密钥提交到代码库

2. **定期轮换密钥**：
   - 在 Supabase Dashboard → Settings → API 中可以重新生成密钥

3. **使用不同环境的不同密钥**：
   - 生产环境：使用生产 Supabase 项目
   - 开发环境：使用开发 Supabase 项目

---

## 📝 环境变量清单

完整的环境变量列表：

| 变量名 | 必需 | 描述 | 位置 |
|--------|------|------|------|
| `SUPABASE_URL` | ✅ | Supabase 项目 URL | Settings → API |
| `SUPABASE_ANON_KEY` | ✅ | 公开匿名密钥 | Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | 服务角色密钥（保密） | Settings → API |
| `NODE_VERSION` | ⚠️ | Node.js 版本 | 已在 `netlify.toml` 设置 |
| `PNPM_VERSION` | ⚠️ | pnpm 版本 | 已在 `netlify.toml` 设置 |

---

## 🐛 故障排查

### 问题：环境变量设置后仍然报错

**解决方案：**
1. 确认变量名拼写正确（区分大小写）
2. 确认已触发重新部署
3. 检查 Netlify 部署日志，确认环境变量已加载
4. 清除浏览器缓存并硬刷新（`Ctrl + Shift + R`）

---

### 问题：如何在本地开发中使用环境变量？

**解决方案：**

1. 在项目根目录创建 `.env` 文件（已被 `.gitignore` 忽略）：
   ```env
   SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. 启动开发服务器：
   ```bash
   pnpm dev
   ```

3. Astro 会自动加载 `.env` 文件中的变量

---

### 问题：在 Netlify Functions 中访问环境变量

**解决方案：**

Netlify Functions 可以通过 `process.env` 访问：

```javascript
// netlify/functions/example.ts
export async function handler(event, context) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // 使用环境变量...
}
```

---

## ✅ 完成检查清单

在继续之前，请确认：

- [ ] 已从 Supabase Dashboard 获取所有 3 个凭据
- [ ] 已在 Netlify Dashboard 中设置所有 3 个环境变量
- [ ] 已触发重新部署
- [ ] 部署成功完成（检查 Netlify Deploys 页面）
- [ ] 登录页面不再显示环境变量错误
- [ ] 可以成功登录应用

---

## 📞 需要帮助？

如果仍然遇到问题：

1. **检查 Netlify 部署日志**：
   - Deploys → 选择最新部署 → 查看日志

2. **检查浏览器控制台**：
   - 按 `F12` 打开开发者工具
   - 查看 Console 和 Network 标签页

3. **验证 Supabase 凭据**：
   - 在 Supabase Dashboard 中重新检查 API 密钥
   - 确保项目未暂停或删除

---

**最后更新**: 2025-10-12  
**文档版本**: 1.0.0

