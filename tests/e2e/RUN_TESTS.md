# E2E测试运行指南

## 新增测试文件

我们为以下页面添加了完整的E2E测试：

1. **04-health-records.spec.ts** - 健康记录管理测试
2. **05-breeding.spec.ts** - 繁殖管理测试
3. **06-feed.spec.ts** - 饲料管理测试
4. **07-analytics.spec.ts** - 数据分析页面测试（重点测试NaN问题修复）

## 运行测试

### 方式1: 运行所有E2E测试

```bash
pnpm test:e2e
```

### 方式2: 运行特定测试文件

```bash
# 只测试健康记录
pnpm test:e2e tests/e2e/04-health-records.spec.ts

# 只测试繁殖管理
pnpm test:e2e tests/e2e/05-breeding.spec.ts

# 只测试饲料管理
pnpm test:e2e tests/e2e/06-feed.spec.ts

# 只测试数据分析
pnpm test:e2e tests/e2e/07-analytics.spec.ts
```

### 方式3: 使用UI模式（推荐用于调试）

```bash
pnpm test:e2e:ui
```

这将打开Playwright的测试UI，您可以：
- 看到每个测试的执行过程
- 查看失败的测试截图
- 逐步调试测试

### 方式4: 只在特定浏览器运行

```bash
# 只在Chrome运行
pnpm test:e2e --project=chromium

# 只在Firefox运行
pnpm test:e2e --project=firefox

# 只在移动端Chrome运行
pnpm test:e2e --project="Mobile Chrome"
```

### 方式5: 运行特定测试用例

```bash
# 运行标题包含"NaN"的测试
pnpm test:e2e -g "NaN"

# 运行数据分析页面的所有测试
pnpm test:e2e -g "数据分析"
```

## 测试前准备

### 1. 确保开发服务器运行

测试会自动启动开发服务器，但如果您想手动启动：

```bash
pnpm dev
```

### 2. 确保测试数据已添加

在运行测试前，建议先在Supabase中执行测试数据脚本：

```bash
# 在Supabase Dashboard的SQL Editor中执行
# ADD_TEST_DATA.sql
```

这样可以确保：
- 有足够的健康记录进行测试
- 有繁殖记录可以查看
- 数据分析页面有数据显示

### 3. 配置环境变量

确保 `.env` 文件包含正确的Supabase配置：

```env
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 测试覆盖范围

### 健康记录测试 (04-health-records.spec.ts)

- ✅ 页面基本元素加载
- ✅ 健康记录列表显示
- ✅ 筛选功能（异常记录）
- ✅ 统计信息显示（确保不是NaN）
- ✅ 添加健康记录导航
- ✅ 健康记录详情查看
- ✅ 响应式设计
- ✅ 表单验证
- ✅ 体温范围验证

### 繁殖管理测试 (05-breeding.spec.ts)

- ✅ 页面基本元素加载
- ✅ 繁殖记录列表显示
- ✅ 创建繁殖记录导航
- ✅ 统计信息显示
- ✅ 繁殖方法筛选
- ✅ 响应式布局
- ✅ 表单验证

### 饲料管理测试 (06-feed.spec.ts)

- ✅ 页面基本元素加载
- ✅ 页面内容显示
- ✅ 响应式设计
- ✅ 无JavaScript错误
- ✅ 页面加载性能

### 数据分析测试 (07-analytics.spec.ts) ⭐ 重点

- ✅ 核心指标卡片显示
- ✅ **奶牛总数统计（不是NaN）**
- ✅ **产奶量统计（不是NaN）**
- ✅ **健康监测统计（不是NaN）**
- ✅ **繁殖统计（不是NaN）**
- ✅ **产奶趋势图表（不是NaN）**
- ✅ 品种分布图
- ✅ 状态分布图
- ✅ 快速导航卡片
- ✅ 响应式设计（桌面/平板/手机）
- ✅ 无JavaScript错误
- ✅ 数据加载性能
- ✅ **所有统计数值格式正确（重点测试NaN问题）**
- ✅ 空数据状态处理

## 测试结果

测试完成后，您可以查看：

### 1. 控制台输出
直接在终端看到测试结果

### 2. HTML报告
```bash
# 测试完成后，打开HTML报告
npx playwright show-report
```

### 3. 截图和视频
失败的测试会自动保存：
- 截图: `test-results/`
- 视频: `test-results/`
- 追踪文件: `test-results/`

## 常见问题

### Q: 测试失败提示"Target page closed"

**A**: 可能是页面加载超时。解决方法：
1. 增加 `page.waitForTimeout()` 的时间
2. 检查开发服务器是否正常运行
3. 检查Supabase连接是否正常

### Q: 测试提示"NaN"仍然存在

**A**: 确保：
1. 已经应用了 `src/pages/analytics/index.astro` 的修复
2. 清除浏览器缓存或使用无痕模式
3. 数据库中有实际数据

### Q: 健康记录测试失败

**A**: 检查：
1. 数据库中是否有健康记录
2. 字段名映射是否正确（参考 FIELD_MAPPING_ISSUES.md）
3. 是否已执行 ADD_TEST_DATA.sql

### Q: 移动端测试失败

**A**: 
1. 检查响应式CSS是否正确
2. 某些元素在移动端可能被隐藏
3. 触摸事件与点击事件的差异

## 性能基准

预期测试时间：
- 单个测试文件：30-60秒
- 所有E2E测试：2-5分钟
- UI模式：交互式，无固定时间

## 持续集成

在CI环境中运行：

```yaml
# .github/workflows/test.yml
- name: Run E2E Tests
  run: pnpm test:e2e
  env:
    CI: true
```

## 调试技巧

### 1. 使用 --debug 模式
```bash
pnpm test:e2e --debug
```

### 2. 暂停测试查看页面
```typescript
await page.pause(); // 在测试中添加这行
```

### 3. 查看浏览器控制台
```typescript
page.on('console', msg => console.log(msg.text()));
```

### 4. 慢速执行
```bash
pnpm test:e2e --slow-mo=1000
```

## 下一步

1. ✅ 执行测试数据脚本 `ADD_TEST_DATA.sql`
2. ✅ 运行所有测试：`pnpm test:e2e`
3. ✅ 查看HTML报告确认所有测试通过
4. ✅ 特别关注数据分析页面的NaN测试是否通过

---

**测试创建时间**: 2025-10-12
**测试目标**: 验证健康记录、繁殖管理、饲料管理和数据分析页面功能正常，特别是确保数据分析页面不显示NaN

