/* 梦角传讯 — Service Worker */
const CACHE_NAME = 'mengjiao-v1';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './pages/index-new-v2.html',
  './pages/chat-new.html',
  './pages/call-new.html',
  './pages/customize-profile.html',
  './pages/customize-replies.html',
  './pages/customize-voice.html',
  './pages/anniversary-new.html',
  './assets/image-utils.js',
  './assets/sticker-utils.js',
  './assets/voice-utils.js',
  './assets/character.png',
  './assets/avatar-user.jpg',
  './assets/avatar-dream.jpg',
  './colors_and_type.css',
  './icon.svg',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .catch(() => {})
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

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => null);
    })
  );
});
