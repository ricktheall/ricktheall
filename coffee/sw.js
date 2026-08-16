/* sw.js — TheAll Bible Coffee V2
 * network-first สำหรับไฟล์ของแอป (ได้เวอร์ชันใหม่เสมอเมื่อออนไลน์)
 * แล้ว fallback ไปที่แคชเมื่อออฟไลน์ — ความคืบหน้าของผู้ใช้อยู่ใน localStorage จึงไม่หายอยู่แล้ว
 */
const CACHE = 'tbc-v2-1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './books.js',
  './lessons.js',
  './i18n.js',
  './cups.js',
  './progress.js',
  './app.js',
  './manifest.webmanifest',
  './icons/cup.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(ASSETS.map((a) => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('tbc-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
