// Study Metrics — content platform behaviors (Phase 6.2)
// Reused across guide/article/hub pages. No dependencies.

(function () {
  // ---- Reading progress bar ----
  var bar = document.getElementById('readProgress');
  if (bar) {
    var onScroll = function () {
      var h = document.documentElement;
      var scrollTop = h.scrollTop || document.body.scrollTop;
      var scrollHeight = (h.scrollHeight || document.body.scrollHeight) - h.clientHeight;
      var pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      bar.style.width = pct + '%';
    };
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- Copy link button(s) ----
  document.querySelectorAll('.copy-link-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var url = btn.getAttribute('data-url') || window.location.href;
      var done = function () {
        var original = btn.getAttribute('data-label') || btn.textContent.trim();
        btn.classList.add('copied');
        btn.textContent = 'Link copied';
        setTimeout(function () {
          btn.classList.remove('copied');
          btn.textContent = original;
        }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(function () { fallbackCopy(url, done); });
      } else {
        fallbackCopy(url, done);
      }
    });
  });

  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* no-op */ }
    document.body.removeChild(ta);
    done();
  }

  // ---- Print button(s) ----
  document.querySelectorAll('.print-page-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { window.print(); });
  });

  // ---- Generic search/filter for card grids ----
  // Usage: <input class="input" data-search-target="#someGrid" data-search-item=".tool">
  document.querySelectorAll('[data-search-target]').forEach(function (input) {
    var grid = document.querySelector(input.getAttribute('data-search-target'));
    var itemSel = input.getAttribute('data-search-item') || '.tool';
    var emptyEl = grid ? grid.parentElement.querySelector('.site-search-empty') : null;
    if (!grid) return;
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      var visible = 0;
      grid.querySelectorAll(itemSel).forEach(function (item) {
        var text = item.textContent.toLowerCase();
        var match = q === '' || text.indexOf(q) !== -1;
        item.style.display = match ? '' : 'none';
        if (match) visible++;
      });
      if (emptyEl) emptyEl.style.display = visible === 0 ? 'block' : 'none';
    });
  });
})();
