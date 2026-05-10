/**
 * 首页 E2E 测试
 * 
 * 测试场景：
 * - 首页可以正常加载
 * - 导航链接正常工作
 * - 基本页面元素可见
 */

import { test, expect } from '@playwright/test';

test.describe('首页测试', () => {
  test('应该正确加载首页', async ({ page }) => {
    await page.goto('/');
    
    // 检查页面标题
    await expect(page).toHaveTitle(/奶牛数据管理系统/);
    
    // 主要标题：页面 main 内有自己的 <h1>，与 header 中的 "奶牛管理系统" 区分
    const heading = page.locator('main h1').first();
    await expect(heading).toBeVisible();
  });

  test('导航栏链接应该可以正常工作', async ({ page }) => {
    await page.goto('/');
    
    // 检查"奶牛档案"链接
    const cowsLink = page.locator('a[href="/cows"]').first();
    await expect(cowsLink).toBeVisible();
    
    // 点击链接
    await cowsLink.click();
    
    // 等待导航完成
    await page.waitForURL('/cows');
    
    // 验证已经到达奶牛档案页面
    await expect(page).toHaveURL(/\/cows/);
  });

  test('应该包含所有主要导航链接', async ({ page }) => {
    await page.goto('/');
    
    // 检查所有主要导航链接
    const expectedLinks = [
      '/cows',
      '/health',
      '/milk',
      '/breeding',
      '/feed',
      '/analytics',
      '/help',
    ];
    
    for (const link of expectedLinks) {
      const element = page.locator(`a[href="${link}"]`).first();
      await expect(element).toBeVisible({ timeout: 5000 });
    }
  });

  test('移动端：应该显示响应式布局', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // 检查页面可见
    await expect(page.locator('body')).toBeVisible();
    
    // 检查移动端特定元素（如果有）
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('SEO：应该包含正确的 meta 标签', async ({ page }) => {
    await page.goto('/');
    
    // 检查 description meta 标签
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /.+/);
    
    // 检查 viewport meta 标签
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });
});

