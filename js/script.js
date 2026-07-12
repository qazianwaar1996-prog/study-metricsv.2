/* --- js/script.js --- */
(function () {
  "use strict";
  window.SM = {
    $: function (s, r) { return (r || document).querySelector(s); },
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
      var toast = document.createElement("div");
      toast.className = "toast " + (type || "info");
      toast.innerText = msg;
      document.body.appendChild(toast);
      setTimeout(function() { toast.classList.add("show"); }, 100);
      setTimeout(function() {
        toast.classList.remove("show");
        setTimeout(function() { toast.remove(); }, 500);
      }, 3000);
    },
    copy: function(text) {
      navigator.clipboard.writeText(text).then(function() {
        window.SM.toast("Copied to clipboard!", "success");
      });
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.getElementById("menuToggle");
    var links = document.querySelector(".nav-links");
    if (toggle && links) {
      toggle.onclick = function (e) { e.stopPropagation(); links.classList.toggle("open"); };
      document.onclick = function (e) { if (!toggle.contains(e.target)) links.classList.remove("open"); };
    }
    var siteHeader = document.querySelector(".site-head");
    var btt = document.getElementById("backToTop");
    window.onscroll = function () {
      if (siteHeader) siteHeader.classList.toggle("nav-scrolled", window.scrollY > 50);
      if (btt) btt.classList.toggle("show", window.scrollY > 500);
    };
    if (btt) btt.onclick = function() { window.scrollTo({ top: 0, behavior: "smooth" }); };
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      document.querySelectorAll(".reveal").forEach(function(el) { observer.observe(el); });
    }
  });
})();
