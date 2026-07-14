/*!
 * Study Metrics — Calculator Enhancements
 * File: js/calculators.js   Phase 3 — additive only.
 * Loads AFTER script.js, premium.js, and individual calc JS.
 * Never modifies calc logic. Uses only DOM hooks + SM utilities.
 */
(function () {
  'use strict';

  /* Bail gracefully if SM not available */
  if (typeof window.SM === 'undefined') return;

  var qs  = SM.$;
  var qsa = SM.$$;
  var pRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     1. FIELD ACTIVE CLASS — adds .field-active on the parent .field
        when an input inside it is focused.
        Works with existing label.field-focus logic in premium.js
        (premium.js adds class to label; we add class to field wrapper)
     ============================================================ */
  function initFieldActive () {
    qsa('.field').forEach(function (field) {
      var inp = qs('input, select, textarea', field);
      if (!inp) return;
      inp.addEventListener('focus', function () { field.classList.add('field-active'); });
      inp.addEventListener('blur',  function () { field.classList.remove('field-active'); });
    });
  }

  /* ============================================================
     2. INPUT VALIDATION STATES — adds is-valid / is-error classes
        on .input.lg inputs based on validity.
        Non-breaking: adds classes only, calc logic unchanged.
     ============================================================ */
  function initValidationStates () {
    qsa('.input.lg[type=number]').forEach(function (inp) {
      function check () {
        if (inp.value === '') {
          inp.classList.remove('is-valid', 'is-error');
          return;
        }
        var val = parseFloat(inp.value);
        var min = parseFloat(inp.min);
        var max = parseFloat(inp.max);
        var valid = !isNaN(val);
        if (!isNaN(min)) valid = valid && val >= min;
        if (!isNaN(max)) valid = valid && val <= max;

        if (valid) {
          inp.classList.add('is-valid');
          inp.classList.remove('is-error');
        } else {
          inp.classList.add('is-error');
          inp.classList.remove('is-valid');
        }
      }

      inp.addEventListener('input',  check);
      inp.addEventListener('blur',   check);
      inp.addEventListener('change', check);

      /* Initial check if pre-filled */
      if (inp.value !== '') check();
    });
  }

  /* ============================================================
     3. RESULT CARD FLASH — observes result numbers for changes
        and adds .result-flash to the parent card momentarily.
        Works for all calc pages automatically.
     ============================================================ */
  function initResultFlash () {
    if (pRM) return;

    var cardMap = [
      { num: '.gpa-big',      card: '.gpa-hero' },
      { num: '.res-big',      card: '.res-hero' },
      { num: '.grade-big',    card: '.grade-hero' },
      { num: '.gauge-num .n', card: '.gauge-card' },
      { num: '.ring .pct',    card: '.ring-card' }
    ];

    cardMap.forEach(function (pair) {
      var num  = qs(pair.num);
      var card = qs(pair.card);
      if (!num || !card) return;

      var prev = num.textContent;
      new MutationObserver(function () {
        if (num.textContent !== prev && num.textContent !== '—') {
          prev = num.textContent;
          card.classList.remove('result-flash');
          void card.offsetWidth; /* reflow */
          card.classList.add('result-flash');
          setTimeout(function () { card.classList.remove('result-flash'); }, 600);
        }
      }).observe(num, { childList: true, characterData: true, subtree: true });
    });
  }

  /* ============================================================
     4. SLIDER GRADIENT FILL — updates CSS --pct custom property
        on range input so the filled portion has a gradient.
        Only enhances, doesn't change slider behaviour.
     ============================================================ */
  function initSliderFill () {
    qsa('input[type=range]').forEach(function (slider) {
      function fill () {
        var min = parseFloat(slider.min) || 0;
        var max = parseFloat(slider.max) || 100;
        var val = parseFloat(slider.value) || 0;
        var pct = ((val - min) / (max - min)) * 100;
        slider.style.setProperty('--pct', pct.toFixed(1) + '%');
      }
      slider.addEventListener('input', fill);
      fill(); /* initial */
    });
  }

  /* ============================================================
     5. WEB SHARE API — upgrades the existing shareBtn to use
        native share sheet on supporting devices, falls back
        to the existing SM.copy() gracefully.
     ============================================================ */
  function initWebShare () {
    var shareBtn = qs('#shareBtn');
    if (!shareBtn || !navigator.share) return;

    /* Clone the existing click handler */
    var origOnClick = shareBtn.onclick;
    var origListeners = [];

    /* We can't read existing event listeners, so we use a wrapper:
       replace onclick with a Web Share version that tries native share
       first, then falls back to copy. */
    shareBtn.onclick = null;

    shareBtn.addEventListener('click', function (e) {
      e.stopImmediatePropagation();

      /* Build the share text from visible result elements */
      var resultEl = qs('.gpa-big, .res-big, .grade-big, .gauge-num .n, .ring .pct');
      var labelEl  = qs('.gpa-hero .label, .res-hero .label, .grade-hero .label, .gauge-label, .ring-status');
      var result   = resultEl ? resultEl.textContent.trim() : '';
      var label    = labelEl  ? labelEl.textContent.trim()  : 'Result';

      if (!result || result === '—') {
        SM.toast('Enter values first', 'info');
        return;
      }

      var text = label + ': ' + result + ' — Calculated on Study Metrics (studymetrics.app)';

      navigator.share({ title: 'Study Metrics', text: text, url: window.location.href })
        .catch(function (err) {
          /* User cancelled or API unsupported in this context — fall back */
          if (err.name !== 'AbortError') SM.copy(text);
        });
    });

    /* Update button label to indicate native sharing */
    var txt = shareBtn.lastChild;
    if (txt && txt.nodeType === 3) txt.textContent = ' Share';
  }

  /* ============================================================
     6. VERDICT CHANGE ANIMATION — re-animates the verdict box
        whenever its class changes (ok/info/warn/bad)
     ============================================================ */
  function initVerdictAnim () {
    if (pRM) return;
    var verdict = qs('#verdict');
    if (!verdict) return;

    var prevClass = verdict.className;
    new MutationObserver(function () {
      if (verdict.className !== prevClass) {
        prevClass = verdict.className;
        verdict.style.animation = 'none';
        void verdict.offsetWidth;
        verdict.style.animation = '';
      }
    }).observe(verdict, { attributes: true, attributeFilter: ['class'] });
  }

  /* ============================================================
     7. ROW FOCUS HIGHLIGHT — highlights the whole crow when any
        input inside it is focused
     ============================================================ */
  function initRowFocus () {
    /* Re-run whenever rows are re-rendered (MutationObserver on #rows) */
    function attachRowFocus () {
      qsa('.crow').forEach(function (row) {
        qsa('input, select', row).forEach(function (inp) {
          inp.addEventListener('focus', function () { row.classList.add('crow-focus'); });
          inp.addEventListener('blur',  function () { row.classList.remove('crow-focus'); });
        });
      });
    }

    /* Initial */
    attachRowFocus();

    /* Watch for dynamic row additions */
    var rowsContainer = qs('#rows');
    if (!rowsContainer) return;

    new MutationObserver(function () {
      attachRowFocus();
    }).observe(rowsContainer, { childList: true });
  }

  /* ============================================================
     8. KEYBOARD NAV — Tab between rows in order,
        Enter on a row's last input moves focus to next row's first.
     ============================================================ */
  function initRowKeyNav () {
    var rowsContainer = qs('#rows');
    if (!rowsContainer) return;

    rowsContainer.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var inp = e.target;
      if (!inp.matches('input, select')) return;

      /* Find all inputs in order */
      var all = qsa('input:not([type=hidden]), select', rowsContainer);
      var idx = all.indexOf(inp);
      if (idx === -1) return;

      var next = all[idx + 1];
      if (next) {
        e.preventDefault();
        next.focus();
        next.select && next.select();
      }
    });
  }

  /* ============================================================
     9. ATTENDANCE RING — color reactive to status
        (replaces the inline arc.style.stroke = '#hex' in JS with
        CSS variable updates so transitions work properly)
        Observation only — no logic change.
     ============================================================ */
  function initAttendanceRingColors () {
    var verdict = qs('#verdict');
    var arc     = qs('#ringArc');
    var pctEl   = qs('.ring .pct');
    if (!verdict || !arc) return;

    var colorMap = {
      ok:   '#10b981',
      bad:  '#ef4444',
      warn: '#f59e0b',
      info: '#3b82f6'
    };

    new MutationObserver(function () {
      var cls = verdict.className;
      var match = cls.match(/\b(ok|bad|warn|info)\b/);
      if (match) {
        var color = colorMap[match[1]] || '#3b82f6';
        arc.style.stroke = color;
        if (pctEl) pctEl.style.color = '#fff';
      }
    }).observe(verdict, { attributes: true, attributeFilter: ['class'] });
  }

  /* ============================================================
     10. RESET BTN SPRING ANIMATION
     ============================================================ */
  function initResetBtnAnim () {
    var btn = qs('#resetBtn');
    if (!btn || pRM) return;
    btn.addEventListener('click', function () {
      btn.classList.add('btn-spring');
      setTimeout(function () { btn.classList.remove('btn-spring'); }, 400);
    });
  }

  /* ============================================================
     11. COPY BTN SUCCESS FLASH — visual feedback
         (works alongside existing SM.copy inside calc JS)
     ============================================================ */
  function initCopyFeedback () {
    /* Already handled by premium.js initShareButtons — this adds
       a complementary aria-live announcement */
    var btn = qs('#shareBtn');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var pctEl = qs('.ring .pct, .gpa-big, .res-big, .grade-big, .gauge-num .n');
      if (!pctEl || pctEl.textContent === '—') return;

      /* Announce to screen readers */
      var announce = document.createElement('div');
      announce.setAttribute('aria-live', 'polite');
      announce.setAttribute('aria-atomic', 'true');
      announce.className = 'sr-only';
      announce.textContent = 'Result copied to clipboard.';
      document.body.appendChild(announce);
      setTimeout(function () { announce.remove(); }, 2000);
    });
  }

  /* ============================================================
     12. SCALE NOTE ENHANCEMENT — inline link click tracking
         (just adds a subtle highlight animation)
     ============================================================ */
  function initScaleNoteLinks () {
    qsa('.scale-note a').forEach(function (link) {
      link.addEventListener('click', function () {
        link.style.opacity = '.6';
        setTimeout(function () { link.style.opacity = ''; }, 200);
      });
    });
  }

  /* ============================================================
     13. PERCENTAGE CALCULATOR — add input icons inline
         Only runs on percentage-calculator.html
     ============================================================ */
  function initPercentageIcons () {
    if (!qs('#m_got')) return; /* not on this page */

    var iconMap = {
      'm_got': '✓', 'm_max': '/',
      'x_a': '#', 'x_b': '/',
      'p_pct': '%', 'p_num': 'n',
      'c_from': '↑', 'c_to': '→'
    };

    Object.keys(iconMap).forEach(function (id) {
      var el = qs('#' + id);
      if (!el || el.parentElement.classList.contains('input-icon-wrap')) return;
      /* Wrap only if not already wrapped */
      var parent = el.parentElement;
      var wrap = document.createElement('div');
      wrap.className = 'input-icon-wrap';
      parent.insertBefore(wrap, el);
      wrap.appendChild(el);

      var ico = document.createElement('span');
      ico.className = 'ico-left';
      ico.textContent = iconMap[id];
      ico.style.cssText = 'font-size:.75rem;font-weight:700;font-family:var(--font-display)';
      wrap.insertBefore(ico, el);

      el.classList.add('has-icon');
      el.style.paddingLeft = '36px';
    });
  }

  /* ============================================================
     INIT — run after DOM ready, after calc JS has run
     ============================================================ */
  function init () {
    initFieldActive();
    initValidationStates();
    initResultFlash();
    initSliderFill();
    initVerdictAnim();
    initRowFocus();
    initRowKeyNav();
    initAttendanceRingColors();
    initResetBtnAnim();
    initCopyFeedback();
    initScaleNoteLinks();
    initPercentageIcons();

    /* Web Share — only if native API available */
    if (typeof navigator.share === 'function') {
      initWebShare();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    /* DOM already ready — still defer so calc JS has settled */
    setTimeout(init, 0);
  }

})();

/* ============================================================
   14. PERCENTAGE CALC — result-box number animation
       Observes .result-box .rv for text changes
   ============================================================ */
(function () {
  var rv = document.querySelector('.result-box .rv');
  if (!rv) return;
  var prev = rv.textContent;
  new MutationObserver(function () {
    if (rv.textContent !== prev) {
      prev = rv.textContent;
      rv.classList.remove('num-updated');
      void rv.offsetWidth;
      rv.classList.add('num-updated');
      setTimeout(function () { rv.classList.remove('num-updated'); }, 500);
    }
  }).observe(rv, { childList: true, characterData: true, subtree: true });
})();

/* ============================================================
   15. PERCENTAGE CALC — panel slide animation on tab switch
   ============================================================ */
(function () {
  var tabs = document.querySelectorAll('.tabs button');
  if (!tabs.length) return;
  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = btn.getAttribute('data-tab');
      var panel = document.getElementById('panel-' + target);
      if (!panel) return;
      panel.style.animation = 'none';
      void panel.offsetWidth;
      panel.style.animation = '';
    });
  });
})();
