/**
 * Playwright E2E Test Configuration
 * 
 * 端到端测试配置:
 * - 移动端和桌面端测试
 * - 支持多浏览器测试
 * - 视频录制和截图
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 测试目录
  testDir: './tests/e2e',
  
  // 测试匹配
  testMatch: '**/*.spec.ts',
  
  // 全局超时
  timeout: 30000,
  
  // 失败重试
  retries: process.env.CI ? 2 : 0,
  
  // 并行worker数量
  workers: process.env.CI ? 1 : undefined,
  
  // 报告器
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  
  // 共享配置
  use: {
    // 基础URL
    baseURL: 'http://localhost:4321',
    
    // 截图
    screenshot: 'only-on-failure',
    
    // 视频
    video: 'retain-on-failure',
    
    // 追踪
    trace: 'retain-on-failure',
    
    // 超时
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  
  // 测试项目(多浏览器/设备)
  projects: [
    // 移动端 - iPhone 12
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
      },
    },
    
    // 移动端 - iPhone SE (小屏)
    {
      name: 'Mobile Chrome Small',
      use: {
        ...devices['iPhone SE'],
        viewport: { width: 375, height: 667 },
      },
    },
    
    // 平板
    {
      name: 'Tablet',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 },
      },
    },
    
    // 桌面 - Chrome
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    
    // 桌面 - Firefox
    {
      name: 'Desktop Firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    
    // 桌面 - Safari
    {
      name: 'Desktop Safari',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
  
  // Web Server配置(自动启动开发服务器)
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:4321',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
});

