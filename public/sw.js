/**
 * Service Worker for Offline Support
 * 
 * 提供基础的离线支持功能：
 * - 缓存核心应用资源（HTML、CSS、JS）
 * - 缓存静态资源（图片、字体）
 * - 缓存 API 响应（短期）
 * - 离线时提供回退页面
 * 
 * 缓存策略：
 * - 导航请求：Network First（在线优先）
 * - 静态资源：Cache First（缓存优先）
 * - API请求：Network First with Cache Fallback
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `cowdata-${CACHE_VERSION}`;

// 需要预缓存的核心资源
const PRECACHE_URLS = [
  '/',
  '/login',
  '/cows',
  '/help',
  '/offline.html',
  '/manifest.json',
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching core resources');
      return cache.addAll(PRECACHE_URLS);
    })
  );
  
  // 立即激活新的 Service Worker
  self.skipWaiting();
});

// 激活 Service Worker（清理旧缓存）
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`[SW] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // 立即接管所有客户端
  self.clients.claim();
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }
  
  // 跳过外部资源（除了 Supabase）
  if (url.origin !== self.location.origin && !url.hostname.includes('supabase')) {
    return;
  }
  
  // 导航请求：Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 缓存成功的响应
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // 离线时返回缓存的页面或离线页面
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/offline.html');
          });
        })
    );
    return;
  }
  
  // 静态资源：Cache First
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request).then((response) => {
          // 缓存新资源
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // API 请求：Network First with短期缓存
  if (url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 只缓存 GET 请求的成功响应
          if (response.ok && request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // 离线时返回缓存的 API 响应
          return caches.match(request);
        })
    );
    return;
  }
});

// 后台同步（未来功能）
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('[SW] Syncing data...');
  // TODO: 实现数据同步逻辑
}

// 推送通知（未来功能）
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: data.url,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});

