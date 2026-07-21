/* ============================================================
   StudyMetrics PWA — Service Worker  v2.1
   Strategy:
     • Static assets (css/js/images/fonts) → Cache-First
     • HTML pages                           → Network-First → offline fallback
     • Offline fallback                     → /index.html
   ============================================================ */
'use strict';

var CACHE_NAME   = 'sm-static-v2.1';
var HTML_CACHE   = 'sm-pages-v2.1';
var OFFLINE_URL  = '/index.html';

/* ---- Files to pre-cache on install ---- */
var PRECACHE_STATIC = [
  '/css/style.css',
  '/css/studymetrics-v2.css',
  '/css/premium.css',
  '/css/personalization.css',
  '/css/calculators.css',
  '/css/content-platform.css',
  '/css/consent.css',
  '/css/print.css',
  '/js/script.js',
  '/js/sm-shell.js',
  '/js/sm-v2-features.js',
  '/js/premium.js',
  '/js/analytics.js',
  '/js/consent.js',
  '/images/favicon.svg',
  '/images/avatar.svg',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/manifest.json'
];

var PRECACHE_HTML = [
  '/index.html',
  '/pomodoro.html',
  '/gpa.html',
  '/dashboard.html',
  '/404.html'
];

/* ─────────────────────────────── INSTALL ─────────────────────────────── */
self.addEventListener('install', function (e) {
  e.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(function (cache) {
        return cache.addAll(PRECACHE_STATIC).catch(function (err) {
          console.warn('[SW] Some static assets failed to pre-cache:', err);
        });
      }),
      caches.open(HTML_CACHE).then(function (cache) {
        return cache.addAll(PRECACHE_HTML).catch(function (err) {
          console.warn('[SW] Some HTML pages failed to pre-cache:', err);
        });
      })
    ]).then(function () {
      return self.skipWaiting();
    })
  );
});

/* ─────────────────────────────── ACTIVATE ────────────────────────────── */
self.addEventListener('activate', function (e) {
  var validCaches = [CACHE_NAME, HTML_CACHE];
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (validCaches.indexOf(key) === -1) {
            return caches.delete(key);
          }
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* ─────────────────────────────── FETCH ───────────────────────────────── */
self.addEventListener('fetch', function (e) {
  var req = e.request;

  /* Skip non-GET, cross-origin, and chrome-extension requests */
  if (req.method !== 'GET') return;
  try {
    var url = new URL(req.url);
    if (url.origin !== self.location.origin) return;
  } catch (err) { return; }

  var url2 = new URL(req.url);
  var path  = url2.pathname;

  /* ── Determine request type ── */
  var isHTML  = req.headers.get('Accept') && req.headers.get('Accept').indexOf('text/html') !== -1;
  var isFont  = path.indexOf('/fonts/') !== -1 || url2.hostname.indexOf('fonts.g') !== -1;
  var isStatic = /\.(css|js|png|svg|jpg|jpeg|gif|webp|woff|woff2|ttf|ico)(\?|$)/.test(path);

  if (isHTML || path === '/' || path.endsWith('.html')) {
    /* ── Network-First for HTML ── */
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) {
          var cloned = res.clone();
          caches.open(HTML_CACHE).then(function (cache) { cache.put(req, cloned); });
        }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (cached) {
          return cached || caches.match(OFFLINE_URL);
        });
      })
    );
    return;
  }

  if (isStatic || isFont) {
    /* ── Cache-First for static assets ── */
    e.respondWith(
      caches.match(req).then(function (cached) {
        if (cached) return cached;
        return fetch(req).then(function (res) {
          if (res && res.ok) {
            var cloned = res.clone();
            caches.open(CACHE_NAME).then(function (cache) { cache.put(req, cloned); });
          }
          return res;
        }).catch(function () {
          /* Fonts: silently fail; static: nothing to fall back to */
          return new Response('', { status: 503, statusText: 'Offline' });
        });
      })
    );
    return;
  }

  /* All other requests: network with fallback to cache */
  e.respondWith(
    fetch(req).catch(function () {
      return caches.match(req).then(function (cached) {
        return cached || caches.match(OFFLINE_URL);
      });
    })
  );
});
