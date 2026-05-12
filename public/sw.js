// ================================================
// 🔥 强制清除所有缓存 + Service Worker 自毁程序
// ================================================
// 这个文件的唯一目的：彻底摧毁之前所有坏版本的缓存

// 1. 安装时立即删除所有缓存
self.addEventListener('install', (event) => {
  console.log('[SW自杀程序] 正在删除所有缓存...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW自杀程序] 删除缓存:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[SW自杀程序] 所有缓存已清除！');
      self.skipWaiting();
    })
  );
});

// 2. 激活后通知所有客户端强制刷新
self.addEventListener('activate', (event) => {
  console.log('[SW自杀程序] 激活，准备通知客户端刷新...');
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        console.log('[SW自杀程序] 通知客户端强制刷新');
        client.postMessage({ type: 'FORCE_REFRESH_AND_UNREGISTER_SW' });
      });
      return self.clients.claim();
    })
  );
});

// 3. 拦截所有请求，告诉浏览器不要用SW
self.addEventListener('fetch', (event) => {
  return;
});
