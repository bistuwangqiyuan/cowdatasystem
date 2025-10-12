# E2E 测试文档

## 概述

本目录包含使用 Playwright 编写的端到端（E2E）测试，覆盖系统的关键用户流程。

## 测试覆盖范围

### 已实现的测试

1. **首页测试** (`01-home.spec.ts`)
   - ✅ 页面正常加载
   - ✅ 导航链接功能
   - ✅ 响应式布局（移动端）
   - ✅ SEO 元标签检查

2. **导航流程测试** (`02-navigation.spec.ts`)
   - ✅ 主要页面导航
   - ✅ 浏览器后退/前进功能
   - ✅ 快速链接功能

3. **无障碍访问测试** (`03-accessibility.spec.ts`)
   - ✅ 键盘导航
   - ✅ ARIA 属性
   - ✅ 图片 alt 属性
   - ✅ 表单标签
   - ✅ 焦点管理

### 待实现的测试（可选）

以下测试需要实际的认证和数据库连接才能运行：

4. **用户认证测试**
   - 登录/登出流程
   - 密码重置
   - 会话管理

5. **奶牛档案管理测试**
   - 添加新奶牛
   - 编辑奶牛信息
   - 删除奶牛
   - 搜索和筛选

6. **数据记录测试**
   - 健康记录录入
   - 产奶数据录入
   - 数据验证

7. **数据分析测试**
   - 图表显示
   - 数据导出
   - 报表生成

## 运行测试

### 前置要求

```bash
# 安装依赖
pnpm install

# 安装 Playwright 浏览器
pnpm exec playwright install
```

### 运行所有测试

```bash
# 运行所有 E2E 测试
pnpm test:e2e

# 或者
pnpm exec playwright test
```

### 运行特定测试

```bash
# 运行单个测试文件
pnpm exec playwright test tests/e2e/01-home.spec.ts

# 运行特定浏览器
pnpm exec playwright test --project=chromium

# 运行移动端测试
pnpm exec playwright test --project="Mobile Chrome"
```

### 调试模式

```bash
# UI 模式（推荐）
pnpm exec playwright test --ui

# Debug 模式
pnpm exec playwright test --debug

# 查看测试报告
pnpm exec playwright show-report
```

### CI/CD 环境

```bash
# 在 CI 环境运行
CI=true pnpm exec playwright test

# 生成报告
pnpm exec playwright test --reporter=html
```

## 测试配置

测试配置位于根目录的 `playwright.config.ts` 文件中。

### 主要配置项

- **baseURL**: `http://localhost:4321` (开发服务器)
- **retries**: CI 环境重试 2 次，本地不重试
- **workers**: CI 环境单线程，本地并发
- **timeout**: 
  - 操作超时：10秒
  - 导航超时：30秒

### 浏览器配置

测试在以下浏览器中运行：
- ✅ Desktop Chrome (Chromium)
- ✅ Desktop Firefox
- ✅ Desktop Safari (WebKit)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

## 编写新测试

### 测试文件命名规范

```
XX-feature.spec.ts
```

其中 `XX` 是两位数字（用于排序），`feature` 是测试的功能名称。

### 测试模板

```typescript
import { test, expect } from '@playwright/test';

test.describe('功能名称测试', () => {
  test('应该...', async ({ page }) => {
    await page.goto('/target-page');
    
    // 测试步骤
    const element = page.locator('selector');
    await expect(element).toBeVisible();
  });
});
```

### 最佳实践

1. **使用语义化定位器**
   ```typescript
   // 推荐：使用 role、text、label
   page.getByRole('button', { name: '提交' })
   page.getByText('奶牛档案')
   page.getByLabel('奶牛编号')
   
   // 避免：依赖 CSS 类或 ID
   page.locator('.btn-submit')
   page.locator('#cow-id')
   ```

2. **等待元素可见**
   ```typescript
   await expect(element).toBeVisible();
   await page.waitForLoadState('networkidle');
   ```

3. **使用描述性测试名称**
   ```typescript
   // 推荐
   test('应该在点击"添加奶牛"后导航到新建页面', ...)
   
   // 避免
   test('test1', ...)
   ```

4. **独立测试**
   - 每个测试应该独立运行
   - 不依赖其他测试的状态
   - 使用 beforeEach 设置初始状态

5. **错误处理**
   ```typescript
   try {
     await page.locator('optional-element').click({ timeout: 5000 });
   } catch (error) {
     // 元素不存在，继续测试
   }
   ```

## 常见问题

### Q: 测试超时怎么办？

A: 检查以下几点：
1. 开发服务器是否正常运行
2. 网络连接是否正常
3. 增加 timeout 配置：
   ```typescript
   test('slow test', async ({ page }) => {
     test.setTimeout(60000); // 60秒
     // ...
   });
   ```

### Q: 如何跳过某个测试？

A: 使用 `test.skip()`：
```typescript
test.skip('暂时跳过的测试', async ({ page }) => {
  // ...
});
```

### Q: 如何只运行某个测试？

A: 使用 `test.only()`：
```typescript
test.only('只运行这个测试', async ({ page }) => {
  // ...
});
```

### Q: 测试失败后如何查看详情？

A: 
1. 查看截图：`test-results/` 目录
2. 查看视频：`test-results/` 目录
3. 查看 trace：`pnpm exec playwright show-trace trace.zip`

## 持续集成

### GitHub Actions 示例

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Netlify 部署前测试

在 `netlify.toml` 中配置：

```toml
[build]
  command = "pnpm build"
  
[build.environment]
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1"
  
[[plugins]]
  package = "@netlify/plugin-playwright"
```

## 性能基准

目标测试执行时间：
- 单个测试：< 30秒
- 完整测试套件：< 5分钟
- CI 环境：< 10分钟

## 相关资源

- [Playwright 官方文档](https://playwright.dev/)
- [Playwright 最佳实践](https://playwright.dev/docs/best-practices)
- [测试选择器指南](https://playwright.dev/docs/selectors)
- [调试指南](https://playwright.dev/docs/debug)

## 维护者

- 项目负责人
- 最后更新：2025-10-12

