// Service worker Metika — offline-first.
// NAIKKAN CACHE_VERSION setiap kali aset frontend atau konten berubah.
const CACHE_VERSION = 'lb-v1.3.1';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/tokens.css',
  'css/base.css',
  'css/components.css',
  'assets/fonts/nunito.woff2',
  'assets/icons/icon-192.png',
  'assets/icons/favicon.png',
  'js/app.js', 'js/router.js', 'js/ui.js', 'js/store.js', 'js/api.js', 'js/content.js', 'js/pwa.js',
  'js/engine/expr.js', 'js/engine/format.js', 'js/engine/generator.js', 'js/engine/checker.js', 'js/engine/anon.js',
  'js/components/viz.js', 'js/components/question.js', 'js/components/quiz.js', 'js/components/story.js',
  'js/components/formula.js', 'js/components/layout.js',
  'js/views/welcome.js', 'js/views/join.js', 'js/views/home.js', 'js/views/modules.js', 'js/views/lesson.js',
  'js/views/practice.js', 'js/views/formula.js', 'js/views/profile.js', 'js/views/challenge.js',
  'js/views/review.js', 'js/views/survey.js', 'js/views/test.js',
  'js/views/kuis.js', 'js/views/bank.js', 'js/views/saved.js', 'js/views/history.js', 'js/views/daily.js', 'js/views/games.js',
  'content/manifest.json',
  'content/misconceptions.json',
  'content/surveys.json',
  'content/questions/templates.json',
  'content/questions/challenge.json',
  'content/questions/tests.json',
  'content/modules/m1.json', 'content/modules/m2.json', 'content/modules/m3.json',
  'content/modules/m4.json', 'content/modules/m5.json', 'content/modules/m6.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // POST data penelitian tidak di-cache
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/api/')) return; // API selalu ke jaringan

  // Konten: stale-while-revalidate (cepat + tetap diperbarui).
  if (url.pathname.includes('/content/')) {
    event.respondWith(caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => cached);
      return cached || network;
    }));
    return;
  }

  // Navigasi: jaringan dulu, jatuh ke index.html di cache saat offline.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('index.html')));
    return;
  }

  // Aset app shell: cache dulu.
  event.respondWith(caches.match(req, { ignoreSearch: true }).then((cached) => cached || fetch(req).then((res) => {
    if (res.ok) caches.open(CACHE_VERSION).then((c) => c.put(req, res.clone()));
    return res;
  })));
});
