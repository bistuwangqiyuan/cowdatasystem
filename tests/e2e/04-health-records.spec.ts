/**
 * 健康记录页面 E2E 测试
 * 测试健康记录的查看、筛选和统计功能
 */

import { test, expect } from '@playwright/test';

test.describe('健康记录管理', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到健康记录页面
    await page.goto('/health');
  });

  test('页面基本元素加载正常', async ({ page }) => {
    // 检查页面标题
    await expect(page.locator('h1')).toContainText('健康记录');
    
    // 检查添加按钮
    const addButton = page.locator('a[href="/health/new"]');
    await expect(addButton).toBeVisible();
    await expect(addButton).toContainText('添加');
  });

  test('健康记录列表显示', async ({ page }) => {
    // 等待记录加载
    await page.waitForTimeout(1000);
    
    // 检查是否有表格或空状态
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=暂无健康记录').isVisible().catch(() => false);
    
    expect(hasTable || hasEmptyState).toBeTruthy();
    
    if (hasTable) {
      // 检查表头
      await expect(page.locator('th:has-text("检查时间")')).toBeVisible();
      await expect(page.locator('th:has-text("体温")')).toBeVisible();
      await expect(page.locator('th:has-text("状态")')).toBeVisible();
    }
  });

  test('筛选功能 - 仅显示异常记录', async ({ page }) => {
    // 勾选异常记录筛选
    const abnormalCheckbox = page.locator('input[name="abnormal"]');
    await abnormalCheckbox.check();
    
    // 点击筛选按钮
    await page.locator('button[type="submit"]:has-text("筛选")').click();
    
    // 检查URL参数
    await expect(page).toHaveURL(/abnormal=true/);
  });

  test('统计信息显示', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // 检查是否有统计卡片
    const hasStats = await page.locator('text=总记录数').isVisible().catch(() => false);
    
    if (hasStats) {
      // 检查统计项
      await expect(page.locator('text=总记录数')).toBeVisible();
      await expect(page.locator('text=异常记录')).toBeVisible();
      await expect(page.locator('text=平均体温')).toBeVisible();
      
      // 检查数值不是NaN
      const avgTemp = await page.locator('text=平均体温').locator('..').locator('.text-2xl').textContent();
      expect(avgTemp).not.toContain('NaN');
    }
  });

  test('导航到添加健康记录页面', async ({ page }) => {
    await page.locator('a[href="/health/new"]').click();
    
    // 检查是否跳转到新增页面
    await expect(page).toHaveURL('/health/new');
    
    // 检查表单元素
    await expect(page.locator('input[name="temperature"]')).toBeVisible();
    await expect(page.locator('input[name="mental_state"]').first()).toBeVisible();
    await expect(page.locator('input[name="appetite"]').first()).toBeVisible();
  });

  test('健康记录详情查看', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // 检查是否有详情按钮
    const detailButton = page.locator('a:has-text("详情")').first();
    const hasRecords = await detailButton.isVisible().catch(() => false);
    
    if (hasRecords) {
      await detailButton.click();
      
      // 应该跳转到详情页
      await expect(page).toHaveURL(/\/health\/[a-f0-9-]+/);
    }
  });

  test('响应式设计 - 移动端', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 重新加载页面
    await page.reload();
    
    // 检查页面布局
    await expect(page.locator('h1')).toBeVisible();
    
    // 添加按钮应该全宽
    const addButton = page.locator('a[href="/health/new"]');
    await expect(addButton).toBeVisible();
  });
});

test.describe('健康记录表单验证', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/health/new');
  });

  test('表单必填项验证', async ({ page }) => {
    // 直接提交空表单
    await page.locator('button[type="submit"]').click();
    
    // 浏览器应该显示验证错误（HTML5 validation）
    // 检查温度输入框是否有required属性
    const tempInput = page.locator('input[name="temperature"]');
    await expect(tempInput).toHaveAttribute('required');
  });

  test('体温范围验证', async ({ page }) => {
    const tempInput = page.locator('input[name="temperature"]');
    
    // 检查最小最大值
    await expect(tempInput).toHaveAttribute('min', '35.0');
    await expect(tempInput).toHaveAttribute('max', '45.0');
    await expect(tempInput).toHaveAttribute('step', '0.1');
  });

  test('表单取消操作', async ({ page }) => {
    // 点击取消按钮
    await page.locator('a:has-text("取消")').click();
    
    // 应该返回列表页
    await expect(page).toHaveURL('/health');
  });
});

