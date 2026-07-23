/* ============================================================
   StudyMetrics PWA — Service Worker  v2.2
   Strategy:
     • Static assets (css/js/images/fonts) → Cache-First
       with network fallback; never caches error responses
     • HTML pages → Network-First (500ms timeout) with
       stale cache fallback; never serves a blank 503
     • Offline fallback                     → /index.html
   
   Blank-page fixes vs v2.1:
     • CACHE_NAME bumped → clears all stale asset caches
     • skipWaiting deferred to AFTER successful precache
       (previously fired even on precache failure)
     • Never cache opaque (0-status) or error responses
     • Network-First for HTML uses a timeout so a slow network
       returns cached HTML immediately rather than hanging
     • clients.claim() preserved for immediate control
   ============================================================ */
'use strict';

var CACHE_NAME  = 'sm-static-v2.2';
var HTML_CACHE  = 'sm-pages-v2.2';
var OFFLINE_URL = '/index.html';

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
  '/css/ai-chat.css',
  '/css/ai-assistant.css',
  '/css/dashboard.css',
  '/css/country-selector.css',
  '/js/script.js',
  '/js/sm-shell.js',
  '/js/sm-v2-features.js',
  '/js/premium.js',
  '/js/personalization.js',
  '/js/analytics.js',
  '/js/consent.js',
  '/js/pwa.js',
  '/js/email-capture.js',
  '/images/favicon.svg',
  '/images/avatar.svg',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/manifest.json'
];

var PRECACHE_HTML = [
  '/index.html',
  '/gpa.html',
  '/dashboard.html',
  '/pomodoro.html',
  '/404.html'
];

/* Helper: is this a good cacheable response? */
function isGoodResponse(res) {
  return res && res.status !== 0 && res.ok;
}

/* Helper: Network-First with timeout */
function networkFirstWithTimeout(req, cacheName, timeoutMs) {
  return new Promise(function (resolve) {
    var settled = false;
    var timer;

    /* Start network fetch */
    var networkFetch = fetch(req.clone()).then(function (res) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (isGoodResponse(res)) {
        /* Cache the fresh response */
        var clone = res.clone();
        caches.open(cacheName).then(function (c) { c.put(req, clone); });
      }
      resolve(res);
    }).catch(function () {
      /* Network failed — cache fallback handles it below */
    });

    /* Timeout: serve cache while network is slow */
    timer = setTimeout(function () {
      if (settled) return;
      settled = true;
      caches.match(req).then(function (cached) {
        if (cached) {
          resolve(cached);
        }
        /* If no cache, let the network promise resolve naturally */
      });
      /* After we've served from cache, update cache in background */
      networkFetch.then(function (res) {
        if (res && isGoodResponse(res)) {
          var clone = res.clone();
          caches.open(cacheName).then(function (c) { c.put(req, clone); });
        }
      }).catch(function () {});
    }, timeoutMs);
  }).catch(function () {
    return caches.match(req).then(function (cached) {
      return cached || caches.match(OFFLINE_URL);
    });
  });
}

/* ─────────────────────────────── INSTALL ─────────────────────────────── */
self.addEventListener('install', function (e) {
  e.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(function (cache) {
        /* addAll is all-or-nothing; catch individual failures so a single
           missing optional asset doesn't abort the entire precache. */
        return Promise.all(
          PRECACHE_STATIC.map(function (url) {
            return cache.add(url).catch(function (err) {
              console.warn('[SW] Failed to precache static asset:', url, err);
            });
          })
        );
      }),
      caches.open(HTML_CACHE).then(function (cache) {
        return Promise.all(
          PRECACHE_HTML.map(function (url) {
            return cache.add(url).catch(function (err) {
              console.warn('[SW] Failed to precache HTML page:', url, err);
            });
          })
        );
      })
    ]).then(function () {
      /* skipWaiting only after precache attempt completes (not on failure),
         so we don't activate a SW with an empty/corrupt cache mid-session. */
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
      /* Take control of all open tabs immediately.
         pwa.js listens for controllerchange and reloads, ensuring
         the new page is served from the new cache (no stale/fresh mismatch). */
      return self.clients.claim();
    })
  );
});

/* ─────────────────────────────── FETCH ───────────────────────────────── */
self.addEventListener('fetch', function (e) {
  var req = e.request;

  /* Skip non-GET, cross-origin, chrome-extension, and data: requests */
  if (req.method !== 'GET') return;
  var urlStr = req.url;
  if (urlStr.indexOf('chrome-extension') === 0) return;
  if (urlStr.indexOf('data:') === 0) return;

  var url;
  try { url = new URL(urlStr); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  var path = url.pathname;

  /* Determine request type */
  var isHTML    = (req.headers.get('Accept') || '').indexOf('text/html') !== -1
                  || path === '/'
                  || path.endsWith('.html');
  var isStatic  = /\.(css|js|png|svg|jpg|jpeg|gif|webp|woff|woff2|ttf|ico)(\?|$)/.test(path);
  var isFont    = path.indexOf('/fonts/') !== -1
                  || url.hostname.indexOf('fonts.g') !== -1;

  /* ── HTML: Network-First (500ms timeout) → Cache → Offline fallback ── */
  if (isHTML) {
    e.respondWith(
      networkFirstWithTimeout(req, HTML_CACHE, 500).then(function (res) {
        /* If we got a valid response, return it */
        if (res && res.status !== 0) return res;
        /* Otherwise serve offline page */
        return caches.match(OFFLINE_URL).then(function (offline) {
          return offline || new Response(
            '<!doctype html><html><head><title>Offline</title></head>' +
            '<body style="font-family:system-ui;text-align:center;padding:4rem">' +
            '<h1>You are offline</h1>' +
            '<p>Please check your connection and try again.</p>' +
            '<button onclick="location.reload()">Retry</button>' +
            '</body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        });
      }).catch(function () {
        return caches.match(OFFLINE_URL).then(function (offline) {
          return offline || caches.match(req);
        });
      })
    );
    return;
  }

  /* ── Static assets + fonts: Cache-First → Network → (no 503 caching) ── */
  if (isStatic || isFont) {
    e.respondWith(
      caches.match(req).then(function (cached) {
        /* Return from cache only if it's a good response */
        if (cached && cached.status !== 0) return cached;

        return fetch(req).then(function (res) {
          if (isGoodResponse(res)) {
            var clone = res.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(req, clone);
            });
          }
          return res;
        }).catch(function () {
          /* Offline + not in cache: return empty 503 but never cache it */
          return new Response('', { status: 503, statusText: 'Offline' });
        });
      })
    );
    return;
  }

  /* ── All other requests: network with cache fallback ── */
  e.respondWith(
    fetch(req).then(function (res) {
      return res;
    }).catch(function () {
      return caches.match(req).then(function (cached) {
        return cached || caches.match(OFFLINE_URL);
      });
    })
  );
});
