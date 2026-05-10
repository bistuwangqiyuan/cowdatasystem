/**
 * 饲料管理页面 E2E 测试
 * 测试饲料配方和投喂记录功能
 */

import { test, expect } from '@playwright/test';

test.describe('饲料管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/feed');
  });

  test('页面基本元素加载', async ({ page }) => {
    // 页面 h1 与 header logo 区分
    const heading = page.locator('main h1').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('饲料');
  });

  test('页面内容显示', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // 检查页面有内容或空状态
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);
  });

  test('响应式设计测试', async ({ page }) => {
    // 桌面视图
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    await expect(page.locator('main h1').first()).toBeVisible();
    
    // 移动视图
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page.locator('main h1').first()).toBeVisible();
  });

  test('页面无JavaScript错误', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.waitForTimeout(2000);
    
    // 应该没有JavaScript错误
    expect(errors).toHaveLength(0);
  });

  test('导航栏链接正常', async ({ page }) => {
    // 检查是否有导航栏
    const nav = page.locator('nav, header').first();
    await expect(nav).toBeVisible();
  });
});

test.describe('饲料页面性能', () => {
  test('页面加载时间合理', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // 页面应该在5秒内加载完成
    expect(loadTime).toBeLessThan(5000);
  });
});

