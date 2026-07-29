// Vian Q 工作台 Service Worker — 离线缓存
const CACHE_NAME = 'vianq-workstation-v5';
const ASSETS = [
  './vianq-v5.html',
  './manifest.json',
  './app-icon.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function() {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // 网络优先，失败回退缓存（行情API等始终走网络）
  var url = new URL(e.request.url);
  // 不缓存第三方行情接口请求
  if (url.hostname !== location.hostname) return;
  e.respondWith(
    fetch(e.request)
      .then(function(res) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, copy).catch(function() {});
        });
        return res;
      })
      .catch(function() {
        return caches.match(e.request).then(function(cached) {
          return cached || caches.match('./vianq-v5.html');
        });
      })
  );
});
