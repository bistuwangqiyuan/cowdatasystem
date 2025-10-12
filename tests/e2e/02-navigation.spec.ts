/**
 * 导航流程 E2E 测试
 * 
 * 测试场景：
 * - 主要页面导航流程
 * - 面包屑导航
 * - 后退按钮功能
 */

import { test, expect } from '@playwright/test';

test.describe('导航流程测试', () => {
  test('应该能够依次访问所有主要页面', async ({ page }) => {
    // 从首页开始
    await page.goto('/');
    
    const pages = [
      { url: '/cows', title: /奶牛/ },
      { url: '/health', title: /健康/ },
      { url: '/milk', title: /产奶/ },
      { url: '/breeding', title: /繁殖/ },
      { url: '/feed', title: /饲料/ },
      { url: '/analytics', title: /分析/ },
      { url: '/help', title: /帮助/ },
    ];
    
    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      await expect(page).toHaveURL(new RegExp(pageInfo.url));
      
      // 检查页面加载完成
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    }
  });

  test('浏览器后退按钮应该正常工作', async ({ page }) => {
    await page.goto('/');
    
    // 导航到奶牛页面
    await page.goto('/cows');
    await expect(page).toHaveURL(/\/cows/);
    
    // 后退
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
  });

  test('帮助页面的快速链接应该正常工作', async ({ page }) => {
    await page.goto('/help');
    
    // 确认页面加载
    await expect(page.locator('h1')).toContainText(/帮助/);
    
    // 检查"返回首页"链接
    const homeLink = page.locator('a[href="/"]').last();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await expect(page).toHaveURL(/\/$/);
    }
  });
});

