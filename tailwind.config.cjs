/**
 * Tailwind CSS Configuration
 * 
 * 移动优先设计配置:
 * - 默认断点从320px开始
 * - 触控友好的最小尺寸(44px)
 * - 自定义颜色主题
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}',
    './public/**/*.html',
  ],
  
  theme: {
    extend: {
      // 移动优先断点
      screens: {
        'xs': '320px',    // 超小屏幕(手机竖屏)
        'sm': '640px',    // 小屏幕
        'md': '768px',    // 中等屏幕(平板)
        'lg': '1024px',   // 大屏幕(桌面)
        'xl': '1280px',   // 超大屏幕
        '2xl': '1536px',  // 2K屏幕
        'touch': '44px',  // 触控友好最小尺寸
      },
      
      // 自定义颜色
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // 主色调
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        success: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
          dark: '#065f46',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
          dark: '#92400e',
        },
        danger: {
          DEFAULT: '#ef4444',
          light: '#fee2e2',
          dark: '#991b1b',
        },
      },
      
      // 字体
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'SF Mono',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      
      // 间距
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        'touch': '44px', // 触控最小尺寸
      },
      
      // 动画
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  
  plugins: [
    // 表单插件(如需要)
    // require('@tailwindcss/forms'),
    // 排版插件(如需要)
    // require('@tailwindcss/typography'),
  ],
};

