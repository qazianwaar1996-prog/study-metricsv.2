/* ============================================================
   script.js — Core SM utilities only
   Navigation, scroll, reveal, toast are handled by premium.js
   ============================================================ */
(function () {
  "use strict";

  /* ── Shared utility namespace ── */
  window.SM = {
    $:  function (s, r) { return (r || document).querySelector(s); },
    $$: function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); },
    round: function (n, d) {
      d = d === undefined ? 2 : d;
      var f = Math.pow(10, d);
      return Math.round((n + Number.EPSILON) * f) / f;
    },
    clamp: function (n, min, max) { return Math.max(min, Math.min(max, n)); },
    esc: function (s) {
      var map = {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};
      return String(s || "").replace(/[&<>"']/g, function (m) { return map[m]; });
    },
    uid: function () { return Math.random().toString(36).slice(2, 9); },
    store: {
      get: function (k, fallback) {
        try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
        catch (e) { return fallback; }
      },
      set: function (k, v) {
        try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
      }
    },
    toast: function (msg, type) {
      /* Remove any existing toast first */
      var existing = document.querySelector('.toast');
      if (existing) { existing.remove(); }

      var toast = document.createElement("div");
      toast.className = "toast";
      if (type) toast.classList.add(type);
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.textContent = msg;
      document.body.appendChild(toast);

      /* Force reflow before adding .show */
      void toast.offsetWidth;
      toast.classList.add("show");

      setTimeout(function () {
        toast.classList.remove("show");
        setTimeout(function () { if (toast.parentNode) toast.remove(); }, 400);
      }, 3000);
    },
    copy: function (text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          SM.toast("Copied to clipboard!", "success");
        }).catch(function () {
          SM._copyFallback(text);
        });
      } else {
        SM._copyFallback(text);
      }
    },
    _copyFallback: function (text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); SM.toast("Copied!", "success"); }
      catch (e) { SM.toast("Copy failed", "error"); }
      ta.remove();
    }
  };

})();
