/* ============================================================
   StudyMetrics PWA — Registration + Install Button  v2.1
   • Registers sw.js
   • Captures beforeinstallprompt → shows "Install App" button
   • Injects Install button into sm2-top-tools and mobile nav
   • Offline banner on network change
   ============================================================ */
(function () {
  'use strict';

  /* ── Service Worker registration ── */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(function (reg) {
          /* Check for updates once per hour */
          setInterval(function () { reg.update(); }, 60 * 60 * 1000);
        })
        .catch(function (err) {
          console.warn('[PWA] SW registration failed:', err);
        });
    });
  }

  /* ── Install Prompt ── */
  var deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    injectInstallButton();
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    removeInstallButton();
    if (window.SM && SM.toast) SM.toast('Study Metrics installed! 🎉', 'success');
  });

  function triggerInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function (choice) {
      if (choice.outcome === 'accepted') {
        deferredPrompt = null;
        removeInstallButton();
      }
    });
  }

  function removeInstallButton() {
    document.querySelectorAll('.sm-install-btn').forEach(function (el) { el.remove(); });
  }

  function injectInstallButton() {
    /* Avoid duplicates */
    if (document.querySelector('.sm-install-btn')) return;

    /* --- Desktop: inject into sm2-top-tools --- */
    var btn = document.createElement('button');
    btn.className = 'sm2-icon-btn sm-install-btn';
    btn.setAttribute('aria-label', 'Install Study Metrics app');
    btn.setAttribute('title', 'Install App');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v13M8 12l4 4 4-4"/><path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"/></svg>';
    btn.addEventListener('click', triggerInstall);

    var INSTALL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v13M8 12l4 4 4-4"/><path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"/></svg>';

    /* Wait for shell to inject sm2-top-tools */
    function tryInjectDesktop() {
      var topTools = document.querySelector('.sm2-top-tools');
      if (topTools) {
        topTools.insertBefore(btn, topTools.firstChild);
        return true;
      }
      /* Legacy pages (.site-head) have no .sm2-top-tools — inject into .nav-cta so
         the install action is available on every page, desktop and mobile. */
      var navCta = document.querySelector('.site-head .nav-cta');
      if (navCta) {
        var lbtn = document.createElement('button');
        lbtn.className = 'btn btn-ghost sm-install-btn';
        lbtn.setAttribute('aria-label', 'Install Study Metrics app');
        lbtn.setAttribute('title', 'Install App');
        lbtn.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:8px 12px;min-width:0';
        lbtn.innerHTML = INSTALL_ICON + '<span>Install</span>';
        lbtn.addEventListener('click', triggerInstall);
        var toggle = navCta.querySelector('#menuToggle, .menu-toggle');
        if (toggle) { navCta.insertBefore(lbtn, toggle); } else { navCta.appendChild(lbtn); }
        return true;
      }
      return false;
    }

    if (!tryInjectDesktop()) {
      var obs = new MutationObserver(function () {
        if (tryInjectDesktop()) obs.disconnect();
      });
      obs.observe(document.body, { childList: true, subtree: true });
      /* Never leave the observer running indefinitely if no target ever appears. */
      setTimeout(function () { obs.disconnect(); }, 10000);
    }

    /* --- Mobile bottom-nav: Add install item --- */
    function tryInjectMobile() {
      var bottomnav = document.querySelector('.sm2-bottomnav');
      if (bottomnav && !bottomnav.querySelector('.sm-install-btn')) {
        var mBtn = document.createElement('button');
        mBtn.className = 'sm-install-btn';
        mBtn.setAttribute('aria-label', 'Install App');
        mBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v13M8 12l4 4 4-4"/><path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"/></svg><span>Install</span>';
        mBtn.addEventListener('click', triggerInstall);
        bottomnav.appendChild(mBtn);
        return true;
      }
      return false;
    }

    if (!tryInjectMobile()) {
      var obs2 = new MutationObserver(function () {
        if (tryInjectMobile()) obs2.disconnect();
      });
      obs2.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { obs2.disconnect(); }, 10000);
    }
  }

  /* ── Offline / Online banner ── */
  function showOfflineBanner() {
    if (document.getElementById('sm-offline-banner')) return;
    var bar = document.createElement('div');
    bar.id = 'sm-offline-banner';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    bar.textContent = '⚠ You are offline — some features may be limited.';
    bar.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:99999',
      'background:#c98a12', 'color:#fff', 'font-size:13px',
      'font-family:var(--font-sans,system-ui,sans-serif)',
      'text-align:center', 'padding:7px 16px',
      'box-shadow:0 2px 8px rgba(0,0,0,.3)'
    ].join(';');
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function hideOfflineBanner() {
    var bar = document.getElementById('sm-offline-banner');
    if (bar) bar.remove();
  }

  if (!navigator.onLine) showOfflineBanner();
  window.addEventListener('offline', showOfflineBanner);
  window.addEventListener('online', hideOfflineBanner);

})();
