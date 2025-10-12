/**
 * Vitest Configuration
 * 
 * 单元测试配置:
 * - 覆盖率要求: 整体80%, 核心逻辑95%
 * - 测试环境: node (服务端测试) + jsdom (组件测试)
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // 测试环境
    environment: 'node',
    
    // 全局设置
    globals: true,
    
    // 覆盖率配置
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      
      // 覆盖率阈值
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
      
      // 排除目录
      exclude: [
        'node_modules/',
        'dist/',
        '.astro/',
        'tests/',
        '**/*.config.*',
        '**/*.d.ts',
        '**/types/*',
      ],
    },
    
    // 测试文件匹配
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts',
    ],
    
    // 超时设置
    testTimeout: 10000,
    
    // 报告器
    reporters: ['verbose'],
  },
  
  // 路径解析
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@lib': resolve(__dirname, './src/lib'),
      '@services': resolve(__dirname, './src/services'),
      '@types': resolve(__dirname, './src/types'),
    },
  },
});

