/**
 * Astro Configuration
 * 
 * 配置说明:
 * - output: 'hybrid' - 混合渲染模式,支持SSG + SSR
 * - adapter: netlify - Netlify部署适配器
 * - integrations: Tailwind CSS集成
 * 
 * @see https://docs.astro.build/en/reference/configuration-reference/
 */

import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

export default defineConfig({
  // 输出模式: hybrid允许混合使用静态和动态渲染
  output: 'hybrid',
  
  // Netlify适配器
  adapter: netlify(),
  
  // 集成
  integrations: [
    tailwind({
      // 应用基础样式
      applyBaseStyles: true,
    }),
  ],
  
  // 站点配置
  site: 'https://cowdatasystem.netlify.app', // 替换为实际域名
  
  // 服务器配置
  server: {
    port: 4321,
    host: true,
  },
  
  // Vite配置
  vite: {
    // 路径别名
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@lib': '/src/lib',
        '@services': '/src/services',
        '@types': '/src/types',
      },
    },
    // 优化依赖
    optimizeDeps: {
      include: ['@supabase/supabase-js', 'chart.js', 'nanostores'],
    },
  },
  
  // Markdown配置
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
});

