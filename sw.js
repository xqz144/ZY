/* 梦角传讯 — Service Worker
 * v2：全量缓存所有页面/CSS/JS/图片资源，PWA 第二次打开秒开、完全离线可用；
 * 同时作为 Android 版（Capacitor）WebView 本地资源层的 fallback。
 * 升级版本号（CACHE_NAME）即可触发用户端在下次打开时后台静默刷新缓存
 * —— 也就是"热更新"的基础。
 */
const CACHE_NAME = 'mengjiao-v2';

const URLS_TO_CACHE = [
  // ======= 入口 =======
  './',
  './index.html',
  './index-zy.html',
  './manifest.json',
  './sw.js',
  './icon.svg',
  './colors_and_type.css',
  './map-preview.html',
  './plan_test.html',
  './plan_test2.html',

  // ======= 根目录图片 =======
  './face.png',
  './fkk3.png',
  './js2.png',
  './kzxz.png',
  './sp5tx2.png',
  './sppf1.png',
  './spq2.png',

  // ======= 页面 =======
  './pages/announcement.html',
  './pages/atmosphere.html',
  './pages/cards.html',
  './pages/cards-new.html',
  './pages/chat.html',
  './pages/chat-new.html',
  './pages/chat-settings.html',
  './pages/customize.html',
  './pages/customize-profile.html',
  './pages/customize-replies.html',
  './pages/customize-voice.html',
  './pages/index-new.html',
  './pages/index-new-v2.html',
  './pages/ledger.html',
  './pages/letter-new.html',
  './pages/moments-new.html',
  './pages/moments-new-v2.html',
  './pages/moyu.html',
  './pages/plan.html',
  './pages/reply-library.html',
  './pages/spark-new.html',
  './pages/sweet.html',

  // ======= CSS =======
  './css/diary.css',
  './css/extapp-unified.css',
  './css/home.css',
  './css/ledger.css',
  './css/map.css',
  './css/moments.css',
  './css/pet-style.css',
  './css/plan.css',
  './css/shop.css',
  './css/spark.css',
  './css/styles.css',
  './css/sweet.css',

  // ======= JS =======
  './js/accounting.js',
  './js/app.js',
  './js/backup-engine.js',
  './js/config.js',
  './js/core.js',
  './js/data.js',
  './js/diary.js',
  './js/features.js',
  './js/games.js',
  './js/gift-cabinet.js',
  './js/home.js',
  './js/ledger.js',
  './js/listeners.js',
  './js/moments.js',
  './js/moyu.js',
  './js/onboarding.js',
  './js/pet-game.js',
  './js/plan.js',
  './js/shop.js',
  './js/spark-shared.js',
  './js/spark.js',
  './js/state.js',
  './js/sweet-trailmap.js',
  './js/sweet.js',
  './js/ta-phone.js',
  './js/utils.js',

  // ======= 功能插件 =======
  './js/features/call.js',
  './js/features/envelope.js',
  './js/features/group-chat.js',
  './js/features/map.js',
  './js/features/mood.js',
  './js/features/red-packet.js',
  './js/features/reply-library.js',
  './js/features/theme-editor.js',

  // ======= 静态资源（头像 / 麒麟组件 / 地图 / 工具函数）=======
  './assets/avatar-user.jpg',
  './assets/avatar-dream.jpg',
  './assets/character.png',
  './assets/image-utils.js',
  './assets/sticker-utils.js',
  './assets/voice-utils.js',
  './assets/kirin_armor.png',
  './assets/kirin_bg.png',
  './assets/kirin_cape.png',
  './assets/kirin_embroidery.png',
  './assets/kirin_face.png',
  './assets/kirin_front.png',
  './assets/kirin_gold.png',
  './assets/kirin_parts.png',
  './assets/map_qiyu.jpg',
  './assets/map_qiyu_v2.jpg',
  './assets/map_qiyu_v3.jpg',
  './assets/map_qiyu_v4.jpg',
  './assets/map_qiyu_v5.jpg',
  './assets/map_qiyu_v6.jpg',
  './assets/微信图片_20260819141630_127_38.jpg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE).catch(err => {
        // addAll 是原子的，一个 404 就全失败；降级为逐文件 add
        console.warn('[sw] cache.addAll 部分失败，降级逐文件 add:', err && err.message);
        return Promise.all(URLS_TO_CACHE.map(url =>
          cache.add(url).catch(() => { /* 忽略单文件失败 */ })
        ));
      }))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* GET 请求策略：
 *   本地静态/同源资源 → Cache First（命中即秒回，离线也能开）
 *   未命中 → 网络拉取并顺手缓存（stale-while-revalidate 兼容新资源）
 *   非 GET → 放过
 */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // 对外 API / 跨域 / text_to_image 等走网络优先（不缓存大图片/接口）
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isExternalApi = /text_to_image|api\.dicebear\.com|fonts\.googleapis|unpkg\.com|cdn/i.test(url.host + url.pathname);

  if (!sameOrigin || isExternalApi) {
    // 跨域资源：普通网络，失败就返回 cache 命中的结果（离线兜底）
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // 同源：Cache First，未命中则网络 + 顺手缓存
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(resp => {
        // 仅缓存 2xx 的 GET
        if (resp && resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone)).catch(() => {});
        }
        return resp;
      }).catch(() => null);
    })
  );
});
