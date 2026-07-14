/*!
 * Study Metrics — Premium Engine v2.0
 * All bugs fixed. Single source of truth for all UI interactions.
 * No conflicts with script.js (which is now utilities-only).
 */
(function () {
  'use strict';

  /* ── Utilities ─────────────────────────────────────────────── */
  var qs  = function (s, c) { return (c || document).querySelector(s); };
  var qsa = function (s, c) { return Array.from((c || document).querySelectorAll(s)); };
  var pRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(pointer: coarse)').matches;

  /* ── FIX #6/#20: Page fade-in via CSS, not JS opacity ───────── */
  /* CSS class handles the fade — no JS opacity risk of blank page */
  document.documentElement.classList.add('js-loaded');

  /* ── FIX #1: Apply premium class ONCE before anything runs ──── */
  document.body.classList.add('premium');

  /* ============================================================
     1. BACKGROUND — Aurora blobs, noise, glow (decorative only)
     ============================================================ */
  function injectBackground () {
    var bg = document.createElement('div');
    bg.className = 'prem-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML =
      '<div class="blob blob-1"></div>' +
      '<div class="blob blob-2"></div>' +
      '<div class="blob blob-3"></div>';
    document.body.insertBefore(bg, document.body.firstChild);

    var noise = document.createElement('div');
    noise.className = 'noise-overlay';
    noise.setAttribute('aria-hidden', 'true');
    document.body.appendChild(noise);
  }

  /* ============================================================
     2. SCROLL PROGRESS BAR
     ============================================================ */
  function initScrollProgress () {
    var bar = document.createElement('div');
    bar.id = 'scroll-progress';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-label', 'Page reading progress');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    bar.setAttribute('aria-valuenow', '0');
    document.body.appendChild(bar);

    window.addEventListener('scroll', function () {
      var scrolled = window.scrollY;
      var total = document.documentElement.scrollHeight - window.innerHeight;
      var pct = total > 0 ? Math.round((scrolled / total) * 100) : 0;
      bar.style.width = pct + '%';
      bar.setAttribute('aria-valuenow', pct);
    }, { passive: true });
  }

  /* ============================================================
     3. CUSTOM CURSOR — desktop only, no layout impact
     ============================================================ */
  function initCursor () {
    if (pRM || isTouch) return;

    var dot  = document.createElement('div'); dot.id  = 'cursor-dot';
    var ring = document.createElement('div'); ring.id = 'cursor-ring';
    dot.setAttribute('aria-hidden', 'true');
    ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var mx = -200, my = -200, rx = -200, ry = -200;
    var rAF = null;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';
    }, { passive: true });

    function animRing () {
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;
      ring.style.left = Math.round(rx) + 'px';
      ring.style.top  = Math.round(ry) + 'px';
      rAF = requestAnimationFrame(animRing);
    }
    rAF = requestAnimationFrame(animRing);

    var hoverSel = 'a, button, [role="button"], input, select, textarea, label';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(hoverSel)) document.body.classList.add('cursor-hover');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(hoverSel)) document.body.classList.remove('cursor-hover');
    });
    document.addEventListener('mousedown', function () { document.body.classList.add('cursor-click'); });
    document.addEventListener('mouseup',   function () { document.body.classList.remove('cursor-click'); });
    document.addEventListener('mouseleave', function () {
      dot.style.opacity = '0'; ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function () {
      dot.style.opacity = '1'; ring.style.opacity = '1';
    });
  }

  /* ============================================================
     4. MOUSE GLOW — subtle radial following glow
     ============================================================ */
  function initMouseGlow () {
    if (pRM || isTouch) return;

    var glow = document.createElement('div');
    glow.id = 'mouse-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);

    var tX = -600, tY = -600, cX = -600, cY = -600;
    document.addEventListener('mousemove', function (e) {
      tX = e.clientX; tY = e.clientY;
    }, { passive: true });

    function update () {
      cX += (tX - cX) * 0.07;
      cY += (tY - cY) * 0.07;
      glow.style.left = Math.round(cX) + 'px';
      glow.style.top  = Math.round(cY) + 'px';
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  /* ============================================================
     5. SCROLL REVEAL — FIX #1/#7/#14: Single observer, no conflicts
     ============================================================ */
  function initReveal () {
    /* FIX #14: Don't add stagger to grids whose children already have .reveal
       — instead let the reveal observer handle them individually with delays */
    var targets = qsa('.reveal');

    /* FIX #7: Elements already in viewport get instant activation (no 0.8s delay) */
    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('active'); });
      return;
    }

    var seen = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !seen.has(entry.target)) {
          seen.add(entry.target);
          entry.target.classList.add('active');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    /* FIX #7: Check if element is already in viewport — activate immediately */
    targets.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        /* Already visible — activate with tiny delay so CSS transition runs */
        setTimeout(function () { el.classList.add('active'); }, 50);
      } else {
        io.observe(el);
      }
    });
  }

  /* ============================================================
     6. NUMBER COUNTERS — hero stats
     ============================================================ */
  function animateNumber (el, from, to, duration) {
    if (pRM) { el.textContent = el.textContent; return; }
    var txt = el.textContent.trim();
    var suffix = txt.replace(/[0-9.]/g, '');
    var start  = null;
    var isFloat = String(to).includes('.');
    var dec = isFloat ? String(to).split('.')[1].length : 0;

    function step (ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var ease = 1 - Math.pow(1 - progress, 3);
      var val = from + (to - from) * ease;
      el.textContent = (isFloat ? val.toFixed(dec) : Math.round(val)) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initCounters () {
    var statNums = qsa('.hero-stats .n, .stats-grid .n');
    if (!statNums.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el  = entry.target;
        var txt = el.textContent.trim();
        var num = parseFloat(txt.replace(/[^0-9.]/g, ''));
        if (!isNaN(num) && num > 0) animateNumber(el, 0, num, 1600);
        io.unobserve(el);
      });
    }, { threshold: 0.6 });

    statNums.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     7. NAVBAR — FIX #2/#3: Single handler, no conflicts
     ============================================================ */
  function initNavbar () {
    var header  = qs('.site-head');
    var toggle  = qs('#menuToggle');
    var navLinks = qs('.nav-links');
    var btt     = qs('#backToTop');

    /* Scroll handler — single addEventListener, replaces window.onscroll */
    window.addEventListener('scroll', function () {
      if (header) header.classList.toggle('nav-scrolled', window.scrollY > 50);
      if (btt)    btt.classList.toggle('show', window.scrollY > 400);
    }, { passive: true });

    /* FIX #4: Single back-to-top handler */
    if (btt) {
      btt.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    /* FIX #2: Single mobile menu handler */
    if (toggle && navLinks) {
      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = navLinks.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.innerHTML = open
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
      });

      document.addEventListener('click', function (e) {
        if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
          navLinks.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });

      /* Close on Escape key */
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navLinks.classList.contains('open')) {
          navLinks.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.focus();
        }
      });
    }
  }

  /* ============================================================
     8. SMOOTH ANCHOR SCROLL — FIX #5: deduplicated
     ============================================================ */
  function initSmoothScroll () {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute('href');
      if (id === '#') return;
      var target = qs(id);
      if (!target) return;
      e.preventDefault();
      var headerH = (qs('.site-head') || { offsetHeight: 0 }).offsetHeight;
      var top = target.getBoundingClientRect().top + window.scrollY - headerH - 8;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
  }

  /* ============================================================
     9. PAGE TRANSITION — FIX #6/#20: CSS-based, safe fallback
     ============================================================ */
  function initPageTransition () {
    if (pRM) return;

    /* FIX: Use CSS class instead of inline opacity — if JS fails, page is visible */
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') ||
          href.startsWith('mailto') || href.startsWith('tel') ||
          link.target === '_blank' || link.hasAttribute('download')) return;

      e.preventDefault();
      document.body.classList.add('page-leaving');
      setTimeout(function () { window.location.href = href; }, 250);
    });
  }

  /* ============================================================
     10. RIPPLE EFFECT on buttons
     ============================================================ */
  function initRipple () {
    if (pRM) return;
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.btn');
      if (!btn) return;
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height) * 2;
      var x = e.clientX - rect.left - size / 2;
      var y = e.clientY - rect.top  - size / 2;
      var rip = document.createElement('span');
      rip.className = 'btn-ripple';
      rip.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + x + 'px;top:' + y + 'px;';
      btn.appendChild(rip);
      setTimeout(function () { if (rip.parentNode) rip.remove(); }, 700);
    });
  }

  /* ============================================================
     11. CARD TILT — FIX #12: No transform conflict, uses CSS var
     ============================================================ */
  function initCardTilt () {
    if (pRM || isTouch) return;

    qsa('.tool.live').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width;
        var y = (e.clientY - rect.top)  / rect.height;
        /* FIX #12: Use CSS custom props instead of competing transform */
        card.style.setProperty('--tilt-x', ((y - 0.5) * -8) + 'deg');
        card.style.setProperty('--tilt-y', ((x - 0.5) *  8) + 'deg');
        card.style.setProperty('--mx', (x * 100) + '%');
        card.style.setProperty('--my', (y * 100) + '%');
        card.classList.add('tilting');
      });
      card.addEventListener('mouseleave', function () {
        card.style.removeProperty('--tilt-x');
        card.style.removeProperty('--tilt-y');
        card.classList.remove('tilting');
      });
    });
  }

  /* ============================================================
     12. MAGNETIC BUTTONS — FIX #12: separate from btn:active transform
     ============================================================ */
  function initMagneticButtons () {
    if (pRM || isTouch) return;
    qsa('.btn-primary.btn-lg').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = (e.clientX - rect.left - rect.width / 2) * 0.18;
        var y = (e.clientY - rect.top  - rect.height / 2) * 0.22;
        btn.style.setProperty('--mag-x', x + 'px');
        btn.style.setProperty('--mag-y', y + 'px');
        btn.classList.add('magnetic');
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.removeProperty('--mag-x');
        btn.style.removeProperty('--mag-y');
        btn.classList.remove('magnetic');
      });
    });
  }

  /* ============================================================
     13. INPUT FOCUS EFFECTS
     ============================================================ */
  function initInputEffects () {
    qsa('.field').forEach(function (field) {
      var input = qs('input, select, textarea', field);
      var label = qs('label', field);
      if (!input || !label) return;
      input.addEventListener('focus', function () { label.classList.add('field-focus'); });
      input.addEventListener('blur',  function () { label.classList.remove('field-focus'); });
    });

    /* Animate result numbers when content changes */
    qsa('.gpa-big, .res-big, .grade-big, .gauge-num .n, .ring .pct').forEach(function (el) {
      var prev = el.textContent;
      new MutationObserver(function () {
        if (el.textContent !== prev && el.textContent !== '—') {
          prev = el.textContent;
          el.classList.remove('num-updated');
          void el.offsetWidth;
          el.classList.add('num-updated');
          setTimeout(function () { el.classList.remove('num-updated'); }, 500);
        }
      }).observe(el, { childList: true, characterData: true, subtree: true });
    });
  }

  /* ============================================================
     14. GPA RING ANIMATION — integrated, no separate file patch
     ============================================================ */
  function initGpaRing () {
    var arc = qs('#gpaRingArc');
    var gpaBig = qs('.gpa-big');
    if (!arc || !gpaBig) return;

    function updateRing (gpa) {
      var pct = Math.min(Math.max(parseFloat(gpa) || 0, 0), 4) / 4;
      arc.style.strokeDashoffset = 314 - (314 * pct);
    }

    new MutationObserver(function () { updateRing(gpaBig.textContent); })
      .observe(gpaBig, { childList: true, characterData: true, subtree: true });

    setTimeout(function () { updateRing(gpaBig.textContent); }, 400);
  }

  /* ============================================================
     15. PDF DOWNLOAD
     ============================================================ */
  function initPDFButton () {
    var btn = qs('#pdfBtn');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var orig = btn.innerHTML;
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Printing…';
      btn.classList.add('btn-loading');
      setTimeout(function () {
        window.print();
        setTimeout(function () {
          btn.innerHTML = orig;
          btn.classList.remove('btn-loading');
        }, 800);
      }, 200);
    });
  }

  /* ============================================================
     16. SHARE/COPY BUTTON FEEDBACK
     ============================================================ */
  function initShareButtons () {
    qsa('#shareBtn, #copyBtn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var orig = btn.innerHTML;
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Copied!';
        btn.classList.add('btn-copied');
        setTimeout(function () {
          btn.innerHTML = orig;
          btn.classList.remove('btn-copied');
        }, 2000);
      });
    });
  }

  /* ============================================================
     17. ICON MICRO-ANIMATIONS
     ============================================================ */
  function initIconAnims () {
    if (pRM) return;
    qsa('.hiw-num').forEach(function (el) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          el.classList.add('num-pop');
          setTimeout(function () { el.classList.remove('num-pop'); }, 600);
          io.unobserve(el);
        });
      }, { threshold: 0.8 });
      io.observe(el);
    });
  }

  /* ============================================================
     18. FAQ ANIMATIONS
     ============================================================ */
  function initFAQ () {
    qsa('.faq details').forEach(function (detail) {
      detail.addEventListener('toggle', function () {
        var p = qs('p', detail);
        if (detail.open && p && !pRM) {
          p.style.animation = 'none';
          void p.offsetWidth;
          p.style.animation = 'rowIn .3s cubic-bezier(.22,1,.36,1)';
        }
      });
    });
  }

  /* ============================================================
     19. KICKER BADGE ENTRANCE
     ============================================================ */
  function initKickers () {
    if (pRM) return;
    qsa('.kicker').forEach(function (el) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            el.classList.add('kicker-visible');
            io.unobserve(el);
          }
        });
      }, { threshold: 0.5 });
      io.observe(el);
    });
  }

  /* ============================================================
     20. LIGHTWEIGHT PARTICLES — FIX #15: z-index below inputs
     ============================================================ */
  function initParticles () {
    if (pRM || isTouch) return;

    var container = document.createElement('div');
    container.className = 'particles';
    container.setAttribute('aria-hidden', 'true');
    document.body.appendChild(container);

    var colors = [
      'rgba(124,58,237,.5)', 'rgba(37,99,235,.45)',
      'rgba(6,182,212,.45)', 'rgba(139,92,246,.5)'
    ];
    var count = window.innerWidth > 1024 ? 16 : window.innerWidth > 768 ? 10 : 6;

    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      p.className = 'particle';
      var x   = Math.random() * 100;
      var dur = 14 + Math.random() * 18;
      var del = -(Math.random() * dur);
      var tx  = (Math.random() - 0.5) * 100;
      var sz  = 2 + Math.random() * 2.5;
      p.style.cssText = [
        'left:' + x + '%',
        '--d:' + dur + 's',
        '--tx:' + tx + 'px',
        'animation-delay:' + del + 's',
        'width:' + sz + 'px',
        'height:' + sz + 'px',
        'background:' + colors[i % colors.length]
      ].join(';');
      container.appendChild(p);
    }
  }

  /* ============================================================
     21. ROW ADD BUTTON FEEDBACK
     ============================================================ */
  function initRowButtons () {
    if (pRM) return;
    qsa('#addRow, #addRow2').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.classList.add('btn-spring');
        setTimeout(function () { btn.classList.remove('btn-spring'); }, 400);
      });
    });
  }

  /* ============================================================
     22. NEWSLETTER FORM (footer)
     NOTE: front-end only — wire #newsletterForm up to a real
     email provider (e.g. Mailchimp/ConvertKit/Buttondown) before
     relying on this to actually collect addresses.
     ============================================================ */
  function initNewsletter () {
    var form = qs('#newsletterForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = qs('input[type="email"]', form);
      if (!input || !input.checkValidity()) return;
      if (window.SM && SM.toast) SM.toast("Thanks — you're subscribed!", 'success');
      form.reset();
    });
  }

  /* ============================================================
     INIT — ordered correctly, no race conditions
     ============================================================ */
  function init () {
    /* Inject decorative elements first */
    injectBackground();
    initScrollProgress();

    /* Core navigation — single handlers */
    initNavbar();
    initSmoothScroll();

    /* Interactions */
    initRipple();
    initFAQ();
    initKickers();
    initRowButtons();
    initNewsletter();
    initGpaRing();
    initPDFButton();
    initShareButtons();

    /* Input effects */
    initInputEffects();

    /* Heavy animations — only if motion is ok */
    if (!pRM) {
      initReveal();
      initCounters();
      initCardTilt();
      initMagneticButtons();
      initIconAnims();
      initParticles();

      /* FIX #8: Floating removed from hero-stats to prevent misalignment */
      /* FIX #13: Animated underlines removed — broke text-wrap:balance */
      /* Cursor and glow — last, lowest priority */
      initCursor();
      initMouseGlow();
    } else {
      /* Reduced motion: instantly activate all reveals */
      qsa('.reveal').forEach(function (el) { el.classList.add('active'); });
    }

    /* Page transition — last (must not interfere with clicks above) */
    initPageTransition();
  }

  /* Run after DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
