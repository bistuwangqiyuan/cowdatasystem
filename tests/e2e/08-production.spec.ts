/**
 * 生产环境综合测试
 * 专门用于测试已部署的网站
 * 
 * 重点测试：
 * - 健康记录页面
 * - 繁殖管理页面
 * - 饲料管理页面
 * - 数据分析页面（NaN问题验证）
 */

import { test, expect } from '@playwright/test';

// 通用的等待时间，生产环境可能需要更长
const PROD_WAIT = 2000;

test.describe('生产环境 - 健康记录页面', () => {
  test('健康记录页面可访问且功能正常', async ({ page }) => {
    await page.goto('/health');
    
    // 检查页面加载 - 使用更具体的选择器
    await expect(page.locator('h1').last()).toContainText('健康记录', { timeout: 10000 });
    
    // 检查添加按钮
    await expect(page.locator('a[href="/health/new"]')).toBeVisible();
    
    // 检查页面内容
    await page.waitForTimeout(PROD_WAIT);
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasEmpty = await page.locator('text=暂无健康记录').isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
    
    // 检查统计区域（如果有数据）
    const hasStats = await page.locator('text=总记录数').isVisible().catch(() => false);
    if (hasStats) {
      const statsText = await page.locator('text=平均体温').locator('..').textContent();
      expect(statsText).not.toContain('NaN');
    }
    
    console.log('✅ 健康记录页面测试通过');
  });

  test('健康记录筛选功能', async ({ page }) => {
    await page.goto('/health');
    await page.waitForTimeout(PROD_WAIT);
    
    // 测试异常记录筛选
    const checkbox = page.locator('input[name="abnormal"]');
    if (await checkbox.isVisible()) {
      await checkbox.check();
      await page.locator('button[type="submit"]:has-text("筛选")').click();
      await expect(page).toHaveURL(/abnormal=true/);
    }
    
    console.log('✅ 健康记录筛选功能正常');
  });

  test('添加健康记录页面可访问', async ({ page }) => {
    await page.goto('/health/new');
    
    // 等待表单加载
    await page.waitForSelector('form', { timeout: 10000 });
    
    // 检查关键表单元素
    await expect(page.locator('input[name="temperature"]')).toBeVisible();
    await expect(page.locator('input[name="mental_state"]').first()).toBeVisible();
    
    console.log('✅ 添加健康记录页面正常');
  });
});

test.describe('生产环境 - 繁殖管理页面', () => {
  test('繁殖管理页面可访问且功能正常', async ({ page }) => {
    await page.goto('/breeding');
    
    // 检查页面标题 - 使用更具体的选择器
    await expect(page.locator('h1').last()).toContainText('繁殖', { timeout: 10000 });
    
    // 检查添加按钮
    await expect(page.locator('a[href="/breeding/new"]')).toBeVisible();
    
    // 检查页面内容
    await page.waitForTimeout(PROD_WAIT);
    const pageContent = await page.content();
    expect(pageContent).not.toContain('NaN');
    
    console.log('✅ 繁殖管理页面测试通过');
  });

  test('繁殖记录列表显示', async ({ page }) => {
    await page.goto('/breeding');
    await page.waitForTimeout(PROD_WAIT);
    
    // 检查列表或空状态
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasEmpty = await page.locator('text=暂无繁殖记录').isVisible().catch(() => false);
    
    expect(hasTable || hasEmpty).toBeTruthy();
    
    console.log('✅ 繁殖记录列表显示正常');
  });

  test('添加繁殖记录页面可访问', async ({ page }) => {
    await page.goto('/breeding/new');
    
    // 等待表单加载
    await page.waitForSelector('form', { timeout: 10000 });
    await expect(page.locator('form')).toBeVisible();
    
    console.log('✅ 添加繁殖记录页面正常');
  });
});

test.describe('生产环境 - 饲料管理页面', () => {
  test('饲料管理页面可访问', async ({ page }) => {
    await page.goto('/feed');
    
    // 检查页面标题 - 使用更具体的选择器
    await expect(page.locator('h1').last()).toBeVisible({ timeout: 10000 });
    
    // 检查页面内容
    await page.waitForTimeout(PROD_WAIT);
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
    
    console.log('✅ 饲料管理页面测试通过');
  });

  test('饲料页面无JavaScript错误', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.goto('/feed');
    await page.waitForTimeout(PROD_WAIT);
    
    if (errors.length > 0) {
      console.warn('⚠️ 发现JavaScript错误:', errors);
    }
    
    expect(errors.length).toBe(0);
    console.log('✅ 饲料页面无错误');
  });
});

test.describe('生产环境 - 数据分析页面（重点）', () => {
  test('数据分析页面完整测试 - 不显示NaN', async ({ page }) => {
    await page.goto('/analytics');
    
    // 检查页面标题 - 使用更具体的选择器
    await expect(page.locator('h1').last()).toContainText('数据分析', { timeout: 10000 });
    
    // 等待数据加载
    await page.waitForTimeout(PROD_WAIT);
    
    // 获取整个页面内容
    const pageContent = await page.content();
    
    // 关键验证：不应该包含NaN
    expect(pageContent).not.toContain('NaN');
    console.log('✅ 页面不包含NaN');
    
    // 检查核心指标卡片
    const cards = page.locator('.bg-gradient-to-br');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(4);
    console.log(`✅ 核心指标卡片: ${cardCount}个`);
  });

  test('奶牛总数统计正常', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForTimeout(PROD_WAIT);
    
    const cowCard = page.locator('text=奶牛总数').locator('..');
    await expect(cowCard).toBeVisible();
    
    const countText = await cowCard.locator('.text-4xl').textContent();
    expect(countText).not.toContain('NaN');
    expect(countText).toBeTruthy();
    
    console.log(`✅ 奶牛总数: ${countText}`);
  });

  test('产奶量统计正常 - 重点验证NaN修复', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForTimeout(PROD_WAIT);
    
    const milkCard = page.locator('text=总产奶量').locator('..');
    if (await milkCard.isVisible()) {
      const totalText = await milkCard.locator('.text-4xl').first().textContent();
      expect(totalText).not.toContain('NaN');
      console.log(`✅ 总产奶量: ${totalText}`);
      
      const avgText = await milkCard.locator('text=平均').textContent();
      expect(avgText).not.toContain('NaN');
      console.log(`✅ 平均产奶量: ${avgText}`);
    }
  });

  test('健康监测统计正常', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForTimeout(PROD_WAIT);
    
    // 使用更具体的选择器定位健康记录卡片
    const healthCard = page.locator('.bg-gradient-to-br').filter({ hasText: '健康记录' }).first();
    if (await healthCard.isVisible().catch(() => false)) {
      const cardText = await healthCard.textContent();
      expect(cardText).not.toContain('NaN');
      console.log(`✅ 健康统计正常`);
    }
  });

  test('繁殖统计正常', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForTimeout(PROD_WAIT);
    
    const breedingCard = page.locator('text=繁殖记录').locator('..');
    if (await breedingCard.isVisible()) {
      const cardText = await breedingCard.textContent();
      expect(cardText).not.toContain('NaN');
      console.log(`✅ 繁殖统计正常`);
    }
  });

  test('产奶趋势图显示正常', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForTimeout(PROD_WAIT);
    
    const trendSection = page.locator('text=近7天产奶趋势').locator('..');
    await expect(trendSection).toBeVisible();
    
    const trendText = await trendSection.textContent();
    expect(trendText).not.toContain('NaN');
    console.log('✅ 产奶趋势图正常');
  });

  test('品种分布图显示正常', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForTimeout(PROD_WAIT);
    
    const breedSection = page.locator('text=按品种分布').locator('..');
    await expect(breedSection).toBeVisible();
    
    const content = await breedSection.textContent();
    expect(content).not.toContain('NaN');
    console.log('✅ 品种分布图正常');
  });

  test('快速导航卡片正常', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForTimeout(PROD_WAIT);
    
    const navCards = [
      { text: '奶牛档案', href: '/cows' },
      { text: '健康记录', href: '/health' },
      { text: '产奶记录', href: '/milk' },
      { text: '繁殖管理', href: '/breeding' }
    ];
    
    for (const card of navCards) {
      // 使用更具体的选择器：在快速导航区域内查找
      const link = page.locator('.grid a').filter({ hasText: card.text, has: page.locator(`[href="${card.href}"]`) }).first();
      const isVisible = await link.isVisible().catch(() => false);
      
      if (isVisible) {
        const cardContent = await link.textContent();
        expect(cardContent).not.toContain('NaN');
      }
    }
    
    console.log('✅ 快速导航卡片全部正常');
  });

  test('所有数值格式验证', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForTimeout(PROD_WAIT);
    
    const bodyText = await page.textContent('body');
    
    // 不应该包含这些无效值
    expect(bodyText).not.toContain('NaN');
    expect(bodyText).not.toMatch(/\bundefined\b/);
    
    console.log('✅ 所有数值格式正确');
  });
});

test.describe('生产环境 - 响应式设计', () => {
  test('移动端 - 数据分析页面', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/analytics');
    
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(PROD_WAIT);
    
    const content = await page.content();
    expect(content).not.toContain('NaN');
    
    console.log('✅ 移动端数据分析页面正常');
  });

  test('平板端 - 健康记录页面', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/health');
    
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ 平板端健康记录页面正常');
  });
});

test.describe('生产环境 - 性能测试', () => {
  test('数据分析页面加载性能', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ 页面加载时间: ${loadTime}ms`);
    
    // 生产环境允许更长的加载时间
    expect(loadTime).toBeLessThan(10000);
    console.log('✅ 加载性能合格');
  });
});

