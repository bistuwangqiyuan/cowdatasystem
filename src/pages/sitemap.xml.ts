/**
 * Sitemap XML Generator
 * 
 * 自动生成 sitemap.xml 文件，包含所有公开页面的 URL、更新时间、优先级等信息。
 * 符合 XML Sitemap 协议规范：https://www.sitemaps.org/protocol.html
 * 
 * 更新频率：
 * - 静态页面：monthly
 * - 列表页面：weekly
 * - 数据页面：daily
 * 
 * 优先级：
 * - 首页：1.0
 * - 核心功能页：0.8
 * - 列表页：0.6
 * - 详情页：0.4
 */

import type { APIRoute } from 'astro';

// 网站基础URL（从环境变量获取）
const SITE_URL = import.meta.env.SITE || 'https://cowdatasystem.netlify.app';

// 静态页面配置
const STATIC_PAGES = [
  {
    url: '',
    changefreq: 'weekly',
    priority: 1.0,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    url: '/cows',
    changefreq: 'daily',
    priority: 0.9,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    url: '/health',
    changefreq: 'daily',
    priority: 0.8,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    url: '/milk',
    changefreq: 'daily',
    priority: 0.8,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    url: '/breeding',
    changefreq: 'daily',
    priority: 0.8,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    url: '/feed',
    changefreq: 'daily',
    priority: 0.8,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    url: '/analytics',
    changefreq: 'weekly',
    priority: 0.7,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    url: '/help',
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    url: '/login',
    changefreq: 'monthly',
    priority: 0.3,
    lastmod: new Date().toISOString().split('T')[0],
  },
];

/**
 * 生成 sitemap XML 内容
 */
function generateSitemap(): string {
  const pages = STATIC_PAGES.map((page) => {
    return `
  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${pages}
</urlset>`;
}

/**
 * GET 请求处理器
 * 返回 XML 格式的 sitemap
 */
export const GET: APIRoute = async () => {
  try {
    const sitemap = generateSitemap();
    
    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 缓存1小时
        'X-Robots-Tag': 'noindex', // Sitemap 本身不需要被索引
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
};

