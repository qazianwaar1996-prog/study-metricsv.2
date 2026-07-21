/**
 * StudyMetrics — Global Shell Extension
 * js/sm-shell.js | Version 1.0
 * 
 * Automatically injects the new AI Paraphraser navigation where needed.
 */
(function () {
  'use strict';

  function integrateAIParaphraser() {
    // 1. Dynamic Sidebar Injection
    var sidebarNav = document.querySelector('.sm2-nav');
    if (sidebarNav) {
      var sidebarExists = sidebarNav.querySelector('a[href="paraphraser.html"]');
      if (!sidebarExists) {
        var aiTutorLink = sidebarNav.querySelector('a[href="ai.html"]');
        var paraLink = document.createElement('a');
        paraLink.href = 'paraphraser.html';
        paraLink.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> AI Paraphraser <span class="sm2-badge">NEW</span>';

        // Highlight active page
        if (window.location.pathname.indexOf('paraphraser.html') !== -1) {
          sidebarNav.querySelectorAll('a').forEach(function (el) { el.classList.remove('active'); });
          paraLink.classList.add('active');
        }

        if (aiTutorLink && aiTutorLink.nextSibling) {
          sidebarNav.insertBefore(paraLink, aiTutorLink.nextSibling);
        } else {
          sidebarNav.appendChild(paraLink);
        }
      }
    }

    // 2. Dynamic Footer Injection (Inject under the standard 'Productivity' or 'Guides & Company' column if present)
    var footerCols = document.querySelectorAll('.foot-col');
    footerCols.forEach(function (col) {
      var header = col.querySelector('h4');
      if (header) {
        var headerText = header.textContent.trim().toLowerCase();
        if (headerText === 'productivity' || headerText === 'guides & company' || headerText === 'gpa & grades') {
          var footerExists = col.querySelector('a[href="paraphraser.html"]');
          if (!footerExists) {
            var footerLink = document.createElement('a');
            footerLink.href = 'paraphraser.html';
            footerLink.textContent = 'AI Paraphraser';
            col.appendChild(footerLink);
          }
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', integrateAIParaphraser);
  } else {
    integrateAIParaphraser();
  }
})(); 
