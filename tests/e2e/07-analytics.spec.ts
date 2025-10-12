/**
 * 数据分析页面 E2E 测试
 * 测试数据统计和分析功能，特别是NaN问题的修复
 */

import { test, expect } from '@playwright/test';

test.describe('数据分析页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
  });

  test('页面基本元素加载', async ({ page }) => {
    // 检查页面标题
    await expect(page.locator('h1')).toContainText('数据分析');
    
    // 检查页面描述
    await expect(page.locator('p').first()).toBeVisible();
  });

  test('核心指标卡片显示正常', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // 检查4个核心指标卡片
    const cards = page.locator('.bg-gradient-to-br');
    const cardCount = await cards.count();
    
    expect(cardCount).toBeGreaterThanOrEqual(4);
    
    // 检查每个卡片都可见
    for (let i = 0; i < Math.min(cardCount, 4); i++) {
      await expect(cards.nth(i)).toBeVisible();
    }
  });

  test('奶牛总数统计显示', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // 查找奶牛总数卡片
    const cowCountCard = page.locator('text=奶牛总数').locator('..');
    await expect(cowCountCard).toBeVisible();
    
    // 获取数值
    const countText = await cowCountCard.locator('.text-4xl').textContent();
    expect(countText).toBeTruthy();
    expect(countText).not.toContain('NaN');
    
    // 应该是数字
    const count = parseInt(countText || '0');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('产奶量统计显示 - 不应该是NaN', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // 查找产奶量卡片
    const milkCard = page.locator('text=总产奶量').locator('..');
    await expect(milkCard).toBeVisible();
    
    // 获取总产奶量
    const totalMilkText = await milkCard.locator('.text-4xl').first().textContent();
    expect(totalMilkText).not.toContain('NaN');
    
    // 获取平均产奶量
    const avgMilkText = await milkCard.locator('text=平均').textContent();
    expect(avgMilkText).not.toContain('NaN');
  });

  test('健康监测统计显示', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // 查找健康记录卡片
    const healthCard = page.locator('text=健康记录').locator('..');
    await expect(healthCard).toBeVisible();
    
    // 检查异常率
    const abnormalRateText = await healthCard.locator('text=异常率').textContent();
    expect(abnormalRateText).not.toContain('NaN');
  });

  test('繁殖统计显示', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // 查找繁殖记录卡片
    const breedingCard = page.locator('text=繁殖记录').locator('..');
    await expect(breedingCard).toBeVisible();
    
    // 检查成功率
    const successRateText = await breedingCard.locator('text=成功率').textContent();
    expect(successRateText).not.toContain('NaN');
  });

  test('产奶趋势图表显示', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // 查找趋势图表区域
    const trendSection = page.locator('text=近7天产奶趋势').locator('..');
    await expect(trendSection).toBeVisible();
    
    // 检查是否有数据或空状态提示
    const hasData = await trendSection.locator('.space-y-3').isVisible().catch(() => false);
    const hasEmpty = await trendSection.locator('text=暂无最近的产奶数据').isVisible().catch(() => false);
    
    expect(hasData || hasEmpty).toBeTruthy();
    
    if (hasData) {
      // 确保趋势数据不包含NaN
      const trendContent = await trendSection.textContent();
      expect(trendContent).not.toContain('NaN');
    }
  });

  test('品种分布图显示', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // 查找品种分布区域
    const breedSection = page.locator('text=按品种分布').locator('..');
    await expect(breedSection).toBeVisible();
    
    // 内容不应该包含NaN
    const content = await breedSection.textContent();
    expect(content).not.toContain('NaN');
  });

  test('状态分布图显示', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // 查找状态分布区域
    const statusSection = page.locator('text=按状态分布').locator('..');
    await expect(statusSection).toBeVisible();
    
    // 内容不应该包含NaN
    const content = await statusSection.textContent();
    expect(content).not.toContain('NaN');
  });

  test('快速导航卡片', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // 检查4个快速导航卡片
    const navCards = [
      { text: '奶牛档案', href: '/cows' },
      { text: '健康记录', href: '/health' },
      { text: '产奶记录', href: '/milk' },
      { text: '繁殖管理', href: '/breeding' }
    ];
    
    for (const card of navCards) {
      const link = page.locator(`a[href="${card.href}"]`).filter({ hasText: card.text });
      await expect(link).toBeVisible();
      
      // 检查数量显示不是NaN
      const cardContent = await link.textContent();
      expect(cardContent).not.toContain('NaN');
    }
  });

  test('快速导航链接可点击', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // 点击奶牛档案卡片
    const cowsLink = page.locator('a[href="/cows"]').filter({ hasText: '奶牛档案' });
    await cowsLink.click();
    
    // 应该跳转到奶牛列表页
    await expect(page).toHaveURL('/cows');
  });

  test('响应式设计 - 桌面端', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    
    // 核心指标应该是4列布局
    const grid = page.locator('.grid').first();
    await expect(grid).toBeVisible();
  });

  test('响应式设计 - 平板', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    
    // 页面应该正常显示
    await expect(page.locator('h1')).toBeVisible();
  });

  test('响应式设计 - 手机', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // 核心指标应该是单列布局
    await expect(page.locator('h1')).toBeVisible();
  });

  test('页面无JavaScript错误', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.waitForTimeout(2000);
    
    // 报告所有错误（如果有）
    if (errors.length > 0) {
      console.log('JavaScript错误:', errors);
    }
    
    // 应该没有严重错误
    expect(errors.length).toBe(0);
  });

  test('数据加载性能', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // 页面应该在5秒内加载完成
    expect(loadTime).toBeLessThan(5000);
  });

  test('所有统计数值格式正确', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // 获取整个页面内容
    const pageContent = await page.content();
    
    // 不应该包含NaN、undefined、null等无效值
    expect(pageContent).not.toContain('NaN');
    expect(pageContent).not.toMatch(/undefined(?![a-zA-Z])/); // 避免匹配单词中的undefined
    expect(pageContent).not.toMatch(/\bnull\b/); // 只匹配独立的null
    
    // 所有百分比应该有%符号
    const percentages = await page.locator('text=率:').locator('..').allTextContents();
    for (const text of percentages) {
      if (text.includes('率:')) {
        expect(text).toMatch(/%/);
      }
    }
  });
});

test.describe('数据分析 - 边界情况', () => {
  test('空数据状态处理', async ({ page }) => {
    // 如果没有数据，应该显示0或空状态，而不是NaN
    await page.goto('/analytics');
    await page.waitForTimeout(1000);
    
    const pageText = await page.textContent('body');
    
    // 即使没有数据，也不应该显示NaN
    expect(pageText).not.toContain('NaN');
  });
});

