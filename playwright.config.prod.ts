/**
 * Playwright 生产环境测试配置
 * 用于测试已部署的网站
 * 
 * 使用方法：
 * pnpm test:e2e:prod --config=playwright.config.prod.ts
 */

import { defineConfig, devices } from '@playwright/test';

// 从环境变量获取生产环境URL
const PROD_URL = process.env.BASE_URL || process.env.PROD_URL || 'https://your-site.netlify.app';

if (!process.env.BASE_URL && !process.env.PROD_URL) {
  console.warn('\n⚠️  警告: 未设置生产环境URL，将使用默认值\n');
  console.warn('请使用以下方式设置URL:\n');
  console.warn('  Windows: set BASE_URL=https://your-site.netlify.app');
  console.warn('  Linux/Mac: export BASE_URL=https://your-site.netlify.app\n');
}

export default defineConfig({
  testDir: './tests/e2e',
  
  /* 测试超时 - 生产环境可能需要更长时间 */
  timeout: 60000,
  
  /* 最大失败次数 */
  maxFailures: 5,
  
  /* 并行运行测试 */
  fullyParallel: true,
  
  /* 重试失败的测试 */
  retries: 2,
  
  /* 并发worker数量 */
  workers: 3,
  
  /* Reporter */
  reporter: [
    ['html', { outputFolder: 'playwright-report-prod' }],
    ['list'],
    ['json', { outputFile: 'test-results/prod-results.json' }],
  ],
  
  /* Shared settings for all projects */
  use: {
    /* 生产环境URL */
    baseURL: PROD_URL,
    
    /* Collect trace on failure */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
    
    /* Timeout */
    actionTimeout: 15000,
    navigationTimeout: 45000,
    
    /* 忽略HTTPS错误（如果需要） */
    ignoreHTTPSErrors: false,
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

  /* 生产环境不需要启动本地服务器 */
  // webServer 已移除
});

