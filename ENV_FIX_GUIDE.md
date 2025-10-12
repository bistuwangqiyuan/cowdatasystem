# 🔧 环境变量修复指南

## 🔍 问题原因

**Astro 框架的环境变量规则：**
- ❌ `SUPABASE_URL` → 客户端无法访问
- ✅ `PUBLIC_SUPABASE_URL` → 客户端可以访问

**当前状态：**
- 您在 Netlify 中设置了 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`
- 但 Astro 在客户端无法读取这些变量
- 导致浏览器中出现 "Missing Supabase environment variables" 错误

---

## ⚡ 快速修复（2分钟）

### 方法 1：在 Netlify 添加 PUBLIC_ 前缀的变量（推荐）

1. **访问 Netlify 环境变量页面：**
   ```
   https://app.netlify.com/sites/cowdatasystem/configuration/env
   ```

2. **保留现有的 3 个变量不变**

3. **添加 2 个新的 PUBLIC_ 前缀变量：**

   点击 **Add a variable** → **Add a single variable**

   **新变量 1:**
   ```
   Key: PUBLIC_SUPABASE_URL
   Value: [复制 SUPABASE_URL 的值]
   Scopes: ✅ Builds, Functions, Post-processing
   ```

   **新变量 2:**
   ```
   Key: PUBLIC_SUPABASE_ANON_KEY
   Value: [复制 SUPABASE_ANON_KEY 的值]
   Scopes: ✅ Builds, Functions, Post-processing
   ```

4. **点击 Save**

5. **Netlify 会自动重新部署**（等待 2-3 分钟）

---

### 为什么需要两套变量？

| 变量名 | 用途 | 说明 |
|--------|------|------|
| `SUPABASE_URL` | 服务端 | Netlify Functions 使用 |
| `PUBLIC_SUPABASE_URL` | 客户端 | 浏览器中的 Astro 代码使用 |
| `SUPABASE_ANON_KEY` | 服务端 | Netlify Functions 使用 |
| `PUBLIC_SUPABASE_ANON_KEY` | 客户端 | 浏览器中的 Astro 代码使用 |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端 | **保密！**只在服务端使用 |

**总共需要 5 个环境变量。**

---

## 📋 完整环境变量清单

确保 Netlify 中有以下 **5 个** 环境变量：

```
✅ SUPABASE_URL                    (服务端使用)
✅ PUBLIC_SUPABASE_URL             (客户端使用) ← 新增
✅ SUPABASE_ANON_KEY               (服务端使用)
✅ PUBLIC_SUPABASE_ANON_KEY        (客户端使用) ← 新增
✅ SUPABASE_SERVICE_ROLE_KEY       (服务端使用，保密)
```

---

## 🧪 验证步骤

部署完成后：

1. **清除浏览器缓存**：
   ```
   Ctrl + Shift + Delete
   ```

2. **硬刷新页面**：
   ```
   Ctrl + Shift + R
   ```

3. **打开开发者工具**：
   ```
   F12 → Console
   ```

4. **访问登录页面**：
   ```
   https://cowdatasystem.netlify.app/login
   ```

5. **检查控制台**：
   - ✅ 应该**没有**环境变量错误
   - ✅ 可以正常登录

---

## 📊 预期时间线

| 步骤 | 时间 |
|------|------|
| 在 Netlify 添加 2 个新变量 | 1 分钟 |
| Netlify 自动重新部署 | 2-3 分钟 |
| 清除缓存并测试 | 1 分钟 |
| **总计** | **~5 分钟** |

---

## 🔒 安全说明

### ⚠️ PUBLIC_ 前缀的变量会暴露给客户端

**安全的变量（可以使用 PUBLIC_）：**
- ✅ `PUBLIC_SUPABASE_URL` - 项目 URL（公开的）
- ✅ `PUBLIC_SUPABASE_ANON_KEY` - 匿名密钥（设计为公开的）

**不安全的变量（绝对不要使用 PUBLIC_）：**
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - **绝对不要加 PUBLIC_ 前缀！**
  - 这个密钥具有管理员权限
  - 只能在服务端（Netlify Functions）使用
  - 如果暴露会导致严重安全问题

---

## 🐛 故障排查

### 问题：添加变量后仍有错误

**解决方案：**

1. **确认变量名拼写正确**：
   - `PUBLIC_SUPABASE_URL`（不是 `PUBLIC_SUPABASE_URI`）
   - 注意大小写和下划线

2. **确认 Netlify 部署成功**：
   - 访问：https://app.netlify.com/sites/cowdatasystem/deploys
   - 最新部署应该显示绿色 "Published"

3. **强制清除所有缓存**：
   - 使用无痕模式：`Ctrl + Shift + N`
   - 或清除所有浏览器数据

4. **检查部署日志**：
   - 在 Netlify Deploys 页面点击最新部署
   - 查看 "Deploy log" 确认构建成功

---

## 📝 本地开发配置

如果您想在本地开发，创建 `.env` 文件：

```env
# .env（本地开发环境）
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**注意：** `.env` 文件已在 `.gitignore` 中，不会被提交到 Git。

---

## ✅ 完成检查清单

- [ ] 在 Netlify 添加 `PUBLIC_SUPABASE_URL`
- [ ] 在 Netlify 添加 `PUBLIC_SUPABASE_ANON_KEY`
- [ ] 保存环境变量
- [ ] 等待 Netlify 自动重新部署（2-3 分钟）
- [ ] 清除浏览器缓存
- [ ] 测试登录功能
- [ ] 确认控制台无错误

---

## 🎉 修复后的效果

完成后，您应该看到：

✅ **无环境变量错误** - 控制台干净  
✅ **可以正常登录** - 使用 test@test.com / test123  
✅ **所有功能正常** - 数据库操作成功  
✅ **页面样式完整** - CSS 正确加载  

---

**准备好了吗？** 现在就去 Netlify 添加这 2 个新变量吧！🚀

**访问：** https://app.netlify.com/sites/cowdatasystem/configuration/env

