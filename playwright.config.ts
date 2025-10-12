/**
 * Playwright E2E Testing Configuration
 * 
 * 端到端测试配置文件，用于测试关键用户流程
 * 
 * 测试覆盖：
 * - 用户认证流程
 * - 奶牛档案管理
 * - 健康与产奶记录
 * - 数据分析和导出
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  
  /* 最大失败次数 */
  maxFailures: 3,
  
  /* 并行运行测试 */
  fullyParallel: true,
  
  /* 重试失败的测试 */
  retries: process.env.CI ? 2 : 0,
  
  /* 并发worker数量 */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  
  /* Shared settings for all projects */
  use: {
    /* Base URL */
    baseURL: process.env.BASE_URL || 'http://localhost:4321',
    
    /* Collect trace on failure */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
    
    /* Timeout */
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Mobile viewports */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run local dev server before starting tests */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
