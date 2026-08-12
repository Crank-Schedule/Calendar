// 크랭크 스케줄 서비스 워커
// 전략: HTML/JSON은 network-first(항상 최신, 오프라인 시 캐시 폴백),
//       폰트/이미지/CSS 등 정적 자산은 stale-while-revalidate.
// 관리자 페이지(admin.html)와 API 호출은 절대 캐시하지 않습니다.
const CACHE = 'crank-schedule-v27';
const APP_SHELL = [
  './crank_schedule.html',
  './replay.html',
  './schedule_css.css?v=20260812-98',
  './admin_css.css?v=20260812-10',
  './schedule_core.js?v=20260811-3',
  './manifest.json',
  './assets/images/favicon.jpg',
  './assets/images/lol_icon.png',
  './assets/images/sc2_icon.png',
  './assets/images/sc_icon.png',
  './assets/images/er_icon.png',
  './assets/images/mk_icon.png',
  './assets/images/poke_icon.png',
  './assets/images/watch_icon.png',
  './assets/images/truck_icon.svg',
  './assets/images/adventure_icon.svg',
  './assets/images/diablo_icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

function isStaticAsset(url) {
  return /\.(?:css|js|png|jpg|jpeg|webp|svg|woff2?|ttf)(?:\?|$)/i.test(url);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 관리자 페이지와 외부 API(워커, 유튜브, 치지직)는 항상 네트워크로만.
  if (url.pathname.includes('admin.html') || url.origin !== self.location.origin) return;

  // HTML 문서 · 스케줄 JSON: network-first
  const isDoc = request.mode === 'navigate' || url.pathname.endsWith('.html');
  const isJson = url.pathname.endsWith('.json');
  const isCode = url.pathname.endsWith('.js');
  if (isDoc || isJson || isCode) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request, { ignoreSearch: true }).then(
            (cached) => cached || caches.match('./crank_schedule.html'),
          ),
        ),
    );
    return;
  }

  // 정적 자산: stale-while-revalidate
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
