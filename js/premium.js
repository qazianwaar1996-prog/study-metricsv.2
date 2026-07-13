/*!
 * Study Metrics — Premium Animation Engine
 * Awwwards-calibre interactions & effects
 * Performance-first: CSS animations, RAF, IntersectionObserver
 */
(function () {
  'use strict';

  /* ── Utilities ─────────────────────────────────────────── */
  var qs  = function(s, c) { return (c||document).querySelector(s); };
  var qsa = function(s, c) { return Array.from((c||document).querySelectorAll(s)); };
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. Apply Premium Mode ──────────────────────────────── */
  document.documentElement.setAttribute('data-theme', 'premium');
  document.body.classList.add('premium');

  /* ── 2. Inject Background Layer ─────────────────────────── */
  function injectBackground() {
    var bg = document.createElement('div');
    bg.className = 'prem-bg';
    bg.innerHTML = '<div class="blob blob-1"></div><div class="blob blob-2"></div><div class="blob blob-3"></div>';
    document.body.insertBefore(bg, document.body.firstChild);

    var noise = document.createElement('div');
    noise.className = 'noise-overlay';
    noise.setAttribute('aria-hidden', 'true');
    document.body.appendChild(noise);
  }

  /* ── 3. Scroll Progress Bar ─────────────────────────────── */
  function initScrollProgress() {
    var bar = document.createElement('div');
    bar.id = 'scroll-progress';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-label', 'Reading progress');
    document.body.appendChild(bar);

    window.addEventListener('scroll', function() {
      var scrolled = window.scrollY;
      var total = document.documentElement.scrollHeight - window.innerHeight;
      var pct = total > 0 ? (scrolled / total) * 100 : 0;
      bar.style.width = pct + '%';
    }, { passive: true });
  }

  /* ── 4. Custom Cursor ───────────────────────────────────── */
  function initCursor() {
    if (prefersReducedMotion) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    var dot  = document.createElement('div'); dot.id = 'cursor-dot';
    var ring = document.createElement('div'); ring.id = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var mx = -100, my = -100, rx = -100, ry = -100;

    document.addEventListener('mousemove', function(e) {
      mx = e.clientX; my = e.clientY;
      dot.style.left  = mx + 'px';
      dot.style.top   = my + 'px';
    }, { passive: true });

    // Ring follows with RAF lag
    function animRing() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(animRing);
    }
    requestAnimationFrame(animRing);

    // Hover state on interactive elements
    document.addEventListener('mouseover', function(e) {
      if (e.target.closest('a, button, [role="button"], input, select, textarea')) {
        document.body.classList.add('cursor-hover');
      }
    });
    document.addEventListener('mouseout', function(e) {
      if (e.target.closest('a, button, [role="button"], input, select, textarea')) {
        document.body.classList.remove('cursor-hover');
      }
    });
    document.addEventListener('mousedown', function() { document.body.classList.add('cursor-click'); });
    document.addEventListener('mouseup',   function() { document.body.classList.remove('cursor-click'); });

    document.addEventListener('mouseleave', function() { dot.style.opacity = '0'; ring.style.opacity = '0'; });
    document.addEventListener('mouseenter', function() { dot.style.opacity = '1'; ring.style.opacity = '1'; });
  }

  /* ── 5. Mouse Following Glow ────────────────────────────── */
  function initMouseGlow() {
    if (prefersReducedMotion) return;
    var glow = document.createElement('div');
    glow.id = 'mouse-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);

    var tX = 0, tY = 0, cX = 0, cY = 0;
    document.addEventListener('mousemove', function(e) {
      tX = e.clientX; tY = e.clientY;
    }, { passive: true });

    function update() {
      cX += (tX - cX) * 0.08;
      cY += (tY - cY) * 0.08;
      glow.style.left = cX + 'px';
      glow.style.top  = cY + 'px';
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  /* ── 6. Scroll Reveal (IntersectionObserver) ────────────── */
  function initReveal() {
    // Add reveal classes to existing .reveal elements
    qsa('.reveal').forEach(function(el) {
      el.classList.add('reveal-up');
      el.classList.remove('reveal');
    });

    // Mark tool grids for stagger
    qsa('.tools-grid').forEach(function(el) {
      el.classList.add('stagger-children');
    });
    qsa('.hiw-grid').forEach(function(el) {
      el.classList.add('stagger-children');
    });

    var targets = qsa('.reveal-up, .reveal-left, .reveal-right, .reveal-scale, .reveal-fade, .stagger-children');

    if (!('IntersectionObserver' in window)) {
      targets.forEach(function(el) { el.classList.add('active'); });
      return;
    }

    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function(el) { io.observe(el); });
  }

  /* ── 7. Animated Number Counters ────────────────────────── */
  function animateNumber(el, from, to, duration) {
    if (prefersReducedMotion) { el.textContent = to; return; }
    var start = null;
    var isFloat = String(to).includes('.');
    var decimals = isFloat ? String(to).split('.')[1].length : 0;

    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      var val = from + (to - from) * ease;
      el.textContent = isFloat ? val.toFixed(decimals) : Math.round(val);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    var statNums = qsa('.hero-stats .n');
    if (!statNums.length) return;

    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var text = el.textContent.trim();
        var num = parseFloat(text.replace(/[^0-9.]/g, ''));
        if (!isNaN(num)) animateNumber(el, 0, num, 1800);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });

    statNums.forEach(function(el) { io.observe(el); });
  }

  /* ── 8. Card Tilt Effect ────────────────────────────────── */
  function initCardTilt() {
    if (prefersReducedMotion) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    qsa('.tool.live').forEach(function(card) {
      card.addEventListener('mousemove', function(e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width;
        var y = (e.clientY - rect.top)  / rect.height;
        var tiltX = (y - 0.5) * -10;
        var tiltY = (x - 0.5) *  10;

        card.style.transform = 'perspective(800px) rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg) translateY(-6px) scale(1.01)';
        card.style.setProperty('--mx', (x * 100) + '%');
        card.style.setProperty('--my', (y * 100) + '%');
      });

      card.addEventListener('mouseleave', function() {
        card.style.transform = '';
      });
    });
  }

  /* ── 9. Magnetic Buttons ────────────────────────────────── */
  function initMagneticButtons() {
    if (prefersReducedMotion) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    qsa('.btn-primary.btn-lg, .btn.btn-lg').forEach(function(btn) {
      btn.addEventListener('mousemove', function(e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width  / 2;
        var y = e.clientY - rect.top  - rect.height / 2;
        btn.style.transform = 'translate(' + (x * 0.2) + 'px, ' + (y * 0.3) + 'px)';
      });
      btn.addEventListener('mouseleave', function() {
        btn.style.transform = '';
        btn.style.transition = 'transform .5s cubic-bezier(.34,1.56,.64,1)';
        setTimeout(function() { btn.style.transition = ''; }, 500);
      });
    });
  }

  /* ── 10. Ripple Effect on Buttons ───────────────────────── */
  function initRipple() {
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('.btn');
      if (!btn) return;

      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height) * 2;
      var x = e.clientX - rect.left - size / 2;
      var y = e.clientY - rect.top  - size / 2;

      var ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      ripple.style.cssText = 'width:'+size+'px;height:'+size+'px;left:'+x+'px;top:'+y+'px;';
      btn.appendChild(ripple);
      setTimeout(function() { ripple.remove(); }, 700);
    });
  }

  /* ── 11. Sticky Navbar Blur on Scroll ───────────────────── */
  function initNavbar() {
    var header = qs('.site-head');
    if (!header) return;
    var threshold = 40;

    window.addEventListener('scroll', function() {
      if (window.scrollY > threshold) {
        header.classList.add('nav-scrolled');
      } else {
        header.classList.remove('nav-scrolled');
      }
    }, { passive: true });
  }

  /* ── 12. Smooth Anchor Scroll ───────────────────────────── */
  function initSmoothScroll() {
    document.addEventListener('click', function(e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var target = qs(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      var offset = 90;
      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  }

  /* ── 13. Back to Top ────────────────────────────────────── */
  function initBackToTop() {
    var btn = qs('#backToTop');
    if (!btn) return;

    window.addEventListener('scroll', function() {
      btn.classList.toggle('show', window.scrollY > 400);
    }, { passive: true });

    btn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── 14. Mobile Menu ────────────────────────────────────── */
  function initMobileMenu() {
    var toggle = qs('#menuToggle');
    var nav    = qs('.nav-links');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function() {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
      toggle.innerHTML = open
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
    });

    // Close on outside click
    document.addEventListener('click', function(e) {
      if (!toggle.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── 15. Input Focus Glow Labels ────────────────────────── */
  function initInputEffects() {
    qsa('.field').forEach(function(field) {
      var input = qs('input, select, textarea', field);
      var label = qs('label', field);
      if (!input || !label) return;

      input.addEventListener('focus', function() {
        label.style.color = '#a78bfa';
        label.style.transition = 'color .2s';
      });
      input.addEventListener('blur', function() {
        label.style.color = '';
      });
    });

    // Animate result numbers when they change
    qsa('.gpa-big, .res-big, .grade-big, .gauge-num .n, .ring .pct').forEach(function(el) {
      var prev = el.textContent;
      new MutationObserver(function() {
        if (el.textContent !== prev) {
          prev = el.textContent;
          el.classList.remove('updated');
          void el.offsetWidth; // reflow
          el.classList.add('updated', 'result-num-animated');
          setTimeout(function() { el.classList.remove('updated'); }, 500);
        }
      }).observe(el, { childList: true, characterData: true, subtree: true });
    });
  }

  /* ── 16. Animated Progress Bars in Calculators ──────────── */
  function initProgressBars() {
    qsa('.prem-progress').forEach(function(bar) {
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (e.isIntersecting) { bar.classList.add('active'); io.unobserve(bar); }
        });
      }, { threshold: 0.5 });
      io.observe(bar);
    });

    // Animate existing bar-track fills
    qsa('.bar-track').forEach(function(track) {
      var segs = qsa('.bar-seg', track);
      segs.forEach(function(seg) {
        var w = seg.style.width || '0%';
        seg.style.width = '0%';
        seg.style.transition = 'width .8s cubic-bezier(.22,1,.36,1)';
        setTimeout(function() { seg.style.width = w; }, 200);
      });
    });
  }

  /* ── 17. Page Transition ────────────────────────────────── */
  function initPageTransition() {
    if (prefersReducedMotion) return;

    // Fade-in on load
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity .4s ease';
    window.addEventListener('load', function() {
      document.body.style.opacity = '1';
    });

    // Fade-out on internal link click
    document.addEventListener('click', function(e) {
      var link = e.target.closest('a');
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') ||
          href.startsWith('mailto') || link.target === '_blank') return;

      e.preventDefault();
      document.body.style.opacity = '0';
      setTimeout(function() { window.location.href = href; }, 300);
    });
  }

  /* ── 18. Animated Underline on Section Headings ─────────── */
  function initAnimatedUnderlines() {
    qsa('.sec-head h2, .tool-head h1, .page-head h1').forEach(function(el) {
      el.style.position = 'relative';
      el.style.display  = 'inline-block';

      var line = document.createElement('span');
      line.style.cssText = [
        'position:absolute',
        'left:0',
        'bottom:-4px',
        'height:2px',
        'width:0',
        'background:linear-gradient(90deg,#7c3aed,#06b6d4)',
        'border-radius:2px',
        'transition:width .8s cubic-bezier(.22,1,.36,1)',
        'pointer-events:none'
      ].join(';');
      el.appendChild(line);

      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            setTimeout(function() { line.style.width = '60%'; }, 400);
            io.unobserve(el);
          }
        });
      }, { threshold: 0.5 });
      io.observe(el);
    });
  }

  /* ── 19. Icon Hover Animations ──────────────────────────── */
  function initIconAnimations() {
    qsa('.tool-ico, .rel-ico, .hiw-num, .contact-line .ico').forEach(function(ico) {
      ico.addEventListener('mouseenter', function() {
        if (prefersReducedMotion) return;
        ico.style.transition = 'transform .3s cubic-bezier(.34,1.56,.64,1)';
        ico.style.transform  = 'scale(1.15) rotate(-8deg)';
      });
      ico.addEventListener('mouseleave', function() {
        ico.style.transform = '';
      });
    });
  }

  /* ── 20. Toast Success Animation ───────────────────────── */
  // Patch SM.toast to add premium animations
  function patchToast() {
    if (!window.SM || !SM.toast) return;
    var _original = SM.toast;
    SM.toast = function(msg, type) {
      _original(msg, type);
      // The original creates a .toast element; shake is applied via CSS class
      var t = qs('.toast');
      if (t && type === 'error') {
        t.classList.add('error');
      }
    };
  }

  /* ── 21. Copy / Share button micro-interaction ──────────── */
  function initCopyButtons() {
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-copy], #shareBtn, #copyBtn');
      if (!btn) return;
      var icon = qs('svg', btn);
      if (!icon) return;
      var originalHTML = btn.innerHTML;
      // Flash checkmark
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg> Copied!';
      btn.style.background = 'rgba(16,185,129,.2)';
      btn.style.borderColor = 'rgba(16,185,129,.4)';
      btn.style.color = '#6ee7b7';
      setTimeout(function() {
        btn.innerHTML = originalHTML;
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.style.color = '';
      }, 2000);
    });
  }

  /* ── 22. FAQ Smooth Open/Close ──────────────────────────── */
  function initFAQ() {
    qsa('.faq details').forEach(function(detail) {
      detail.addEventListener('toggle', function() {
        if (detail.open) {
          var content = qs('p', detail);
          if (!content) return;
          content.style.animation = 'rowIn .35s cubic-bezier(.22,1,.36,1)';
        }
      });
    });
  }

  /* ── 23. Section Reveal with Progress Lines ─────────────── */
  function initSectionLines() {
    qsa('.hiw-step').forEach(function(step, i) {
      var num = qs('.hiw-num', step);
      if (!num) return;

      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting) return;
          setTimeout(function() {
            num.style.transform = 'scale(1.15)';
            num.style.transition = 'transform .4s cubic-bezier(.34,1.56,.64,1)';
            setTimeout(function() { num.style.transform = ''; }, 400);
          }, i * 150);
          io.unobserve(step);
        });
      }, { threshold: 0.5 });
      io.observe(step);
    });
  }

  /* ── 24. Gradient Text Cycling for Hero ─────────────────── */
  function initGradientText() {
    var heroEm = qs('.hero h1 .em');
    if (!heroEm || prefersReducedMotion) return;
    heroEm.classList.add('gradient-text-anim');
  }

  /* ── 25. Floating Elements in Hero Stats ─────────────────── */
  function initFloating() {
    if (prefersReducedMotion) return;
    qsa('.hero-stats > div').forEach(function(el, i) {
      el.classList.add('float-' + ((i % 3) + 1));
    });
  }

  /* ── 26. Result card pop when calculator updates ─────────── */
  function initResultAnimation() {
    var resultEls = qsa('.gpa-hero, .res-hero, .grade-hero, .gauge-card, .ring-card');
    resultEls.forEach(function(el) {
      var observer = new MutationObserver(function() {
        if (prefersReducedMotion) return;
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = 'numPop .4s cubic-bezier(.34,1.56,.64,1)';
        setTimeout(function() { el.style.animation = ''; }, 500);
      });
      observer.observe(el, { childList: true, subtree: true, characterData: true });
    });
  }

  /* ── 27. Kicker badge entrance ───────────────────────────── */
  function initKickers() {
    qsa('.kicker').forEach(function(el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting) return;
          el.style.transition = 'opacity .5s ease, transform .5s cubic-bezier(.22,1,.36,1)';
          el.style.opacity = '1';
          el.style.transform = '';
          io.unobserve(el);
        });
      }, { threshold: 0.5 });
      io.observe(el);
    });
  }

  /* ── 28. Row add animation ───────────────────────────────── */
  function initRowAnimations() {
    // Rows already have @keyframes rowIn in CSS
    // This patches the add-row buttons to pulse when clicked
    qsa('#addRow, #addRow2').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (prefersReducedMotion) return;
        btn.style.transform = 'scale(.92)';
        setTimeout(function() {
          btn.style.transform = '';
          btn.style.transition = 'transform .4s cubic-bezier(.34,1.56,.64,1)';
        }, 120);
      });
    });
  }

  /* ── INIT ────────────────────────────────────────────────── */
  function init() {
    injectBackground();
    initScrollProgress();
    initCursor();
    initMouseGlow();
    initNavbar();
    initSmoothScroll();
    initBackToTop();
    initMobileMenu();
    initRipple();
    initFAQ();
    initGradientText();
    initFloating();
    initKickers();
    initRowAnimations();

    if (!prefersReducedMotion) {
      initReveal();
      initCounters();
      initCardTilt();
      initMagneticButtons();
      initInputEffects();
      initProgressBars();
      initAnimatedUnderlines();
      initIconAnimations();
      initCopyButtons();
      initSectionLines();
      initResultAnimation();
    } else {
      // Still activate reveals immediately for reduced motion
      qsa('.reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-scale, .reveal-fade, .stagger-children').forEach(function(el) {
        el.classList.add('active');
      });
    }

    // Page transition last (needs full DOM)
    initPageTransition();

    // Patch toast after SM is loaded
    setTimeout(patchToast, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

/* ── PDF Download for calculators ── */
(function initPDFDownload() {
  var btn = document.getElementById('pdfBtn');
  if (!btn) return;

  btn.addEventListener('click', function() {
    // Brief visual feedback
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg> Printing…';
    btn.style.background = 'rgba(124,58,237,.2)';
    btn.style.color = '#a78bfa';

    setTimeout(function() {
      window.print();
      setTimeout(function() {
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> PDF';
        btn.style.background = '';
        btn.style.color = '';
      }, 1000);
    }, 300);
  });
})();

/* ── Lightweight Particle System ── */
(function initParticles() {
  if (prefersReducedMotion) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var container = document.createElement('div');
  container.className = 'particles';
  container.setAttribute('aria-hidden', 'true');
  document.body.appendChild(container);

  var colors = ['rgba(124,58,237,.6)', 'rgba(37,99,235,.5)', 'rgba(6,182,212,.5)', 'rgba(139,92,246,.5)'];
  var count = window.innerWidth > 768 ? 18 : 8;

  for (var i = 0; i < count; i++) {
    (function(idx) {
      var p = document.createElement('div');
      p.className = 'particle';
      var x = Math.random() * 100;
      var d = 12 + Math.random() * 20;
      var delay = -(Math.random() * d);
      var tx = (Math.random() - 0.5) * 120;
      var size = 2 + Math.random() * 3;
      p.style.cssText = [
        'left:' + x + '%',
        '--d:' + d + 's',
        '--tx:' + tx + 'px',
        'animation-delay:' + delay + 's',
        'width:' + size + 'px',
        'height:' + size + 'px',
        'background:' + colors[idx % colors.length]
      ].join(';');
      container.appendChild(p);
    })(i);
  }
})();
