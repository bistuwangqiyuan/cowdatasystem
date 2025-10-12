/**
 * 繁殖管理页面 E2E 测试
 * 测试繁殖记录的查看、创建和管理功能
 */

import { test, expect } from '@playwright/test';

test.describe('繁殖管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/breeding');
  });

  test('页面基本元素加载', async ({ page }) => {
    // 检查页面标题
    await expect(page.locator('h1')).toContainText('繁殖');
    
    // 检查添加按钮
    const addButton = page.locator('a[href="/breeding/new"]');
    await expect(addButton).toBeVisible();
  });

  test('繁殖记录列表显示', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // 检查列表或空状态
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=暂无繁殖记录').isVisible().catch(() => false);
    
    expect(hasTable || hasEmptyState).toBeTruthy();
    
    if (hasTable) {
      // 检查表头存在
      await expect(page.locator('table thead')).toBeVisible();
    }
  });

  test('导航到创建繁殖记录页面', async ({ page }) => {
    await page.locator('a[href="/breeding/new"]').click();
    
    // 检查URL
    await expect(page).toHaveURL('/breeding/new');
    
    // 检查表单元素
    await page.waitForSelector('form', { timeout: 5000 });
    const form = page.locator('form');
    await expect(form).toBeVisible();
  });

  test('繁殖统计信息', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // 检查是否有统计卡片
    const hasStats = await page.locator('.grid').first().isVisible().catch(() => false);
    
    if (hasStats) {
      // 统计应该不包含NaN
      const pageContent = await page.content();
      expect(pageContent).not.toContain('NaN');
    }
  });

  test('繁殖方法筛选', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // 查找筛选表单
    const filterForm = page.locator('form[method="get"]').first();
    const hasFilter = await filterForm.isVisible().catch(() => false);
    
    if (hasFilter) {
      // 测试筛选功能
      await expect(filterForm).toBeVisible();
    }
  });

  test('响应式布局 - 平板', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('繁殖记录表单', () => {
  test('表单加载和基本验证', async ({ page }) => {
    await page.goto('/breeding/new');
    
    // 等待表单加载
    await page.waitForSelector('form');
    
    // 检查配种日期字段
    const breedingDateInput = page.locator('input[name="breeding_date"]');
    const hasBreedingDate = await breedingDateInput.isVisible().catch(() => false);
    
    if (hasBreedingDate) {
      await expect(breedingDateInput).toHaveAttribute('required');
    }
  });

  test('表单提交按钮存在', async ({ page }) => {
    await page.goto('/breeding/new');
    
    await page.waitForSelector('form');
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });
});

