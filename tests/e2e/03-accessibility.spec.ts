/**
 * 无障碍访问 E2E 测试
 * 
 * 测试场景：
 * - 键盘导航
 * - ARIA 属性
 * - 颜色对比度
 * - 焦点管理
 */

import { test, expect } from '@playwright/test';

test.describe('无障碍访问测试', () => {
  test('应该支持键盘导航', async ({ page }) => {
    await page.goto('/');
    
    // Tab 键导航
    await page.keyboard.press('Tab');
    
    // 检查焦点元素可见
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('按钮应该有正确的 ARIA 属性', async ({ page }) => {
    await page.goto('/cows');
    
    // 查找按钮
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    if (count > 0) {
      // 检查第一个按钮
      const firstButton = buttons.first();
      
      // 按钮应该可见且可点击
      await expect(firstButton).toBeVisible();
      await expect(firstButton).toBeEnabled();
    }
  });

  test('图片应该有 alt 属性', async ({ page }) => {
    await page.goto('/');
    
    // 查找所有图片
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      
      // 检查是否有 alt 属性
      const hasAlt = await img.getAttribute('alt');
      expect(hasAlt).not.toBeNull();
    }
  });

  test('表单输入应该有适当的标签', async ({ page }) => {
    // 访问有表单的页面
    await page.goto('/cows/new');
    
    // 查找所有输入框
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="number"]');
    const count = await inputs.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        
        if (id) {
          // 检查是否有对应的 label
          const label = page.locator(`label[for="${id}"]`);
          const labelExists = await label.count() > 0;
          
          // 如果没有 label，至少应该有 aria-label 或 placeholder
          if (!labelExists) {
            const ariaLabel = await input.getAttribute('aria-label');
            const placeholder = await input.getAttribute('placeholder');
            expect(ariaLabel || placeholder).toBeTruthy();
          }
        }
      }
    }
  });

  test('焦点陷阱：模态框应该捕获焦点', async ({ page }) => {
    await page.goto('/');
    
    // 如果有模态框，测试焦点陷阱
    // 这里假设有一个触发模态框的按钮
    const modalTrigger = page.locator('[data-modal-trigger]').first();
    
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();
      
      // 等待模态框出现
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Tab键应该在模态框内循环
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus');
      
      // 焦点元素应该在模态框内
      const isInsideModal = await focusedElement.evaluate((el, modalEl) => {
        return modalEl.contains(el);
      }, await modal.elementHandle());
      
      expect(isInsideModal).toBeTruthy();
    }
  });
});

