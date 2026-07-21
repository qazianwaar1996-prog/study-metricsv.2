/**
 * StudyMetrics — AI Paraphraser
 * js/paraphraser.js | Version 2.0
 * 
 * Clean, modular ES6 script featuring auto-save, history, advanced metrics,
 * word-by-word diff comparisons, and keyboard shortcuts.
 */

window.SM2Paraphraser = (function () {
  'use strict';

  var HISTORY_KEY = 'sm2_paraphraser_history';
  var DRAFT_KEY = 'sm2_paraphraser_draft';

  // State Management
  var state = {
    mode: 'Academic',
    isProcessing: false,
    history: []
  };

  // Paraphrasing Prompts by Selected Mode
  var modePrompts = {
    Academic: "academic rewriting. Use scholarly vocabulary, professional syntax, and an objective, critical tone suitable for scientific publications or research papers.",
    Formal: "formal communication. Use polished, clear, and professional structures suitable for business documents and executive communications.",
    Simple: "maximum readability. Strip away unnecessarily complex jargon and fluff to present the same message clearly and accessibly.",
    Concise: "highly condensed writing. Eliminate wordiness, redundancy, and passive construction to state facts as briefly and directly as possible.",
    Expand: "elaboration and depth. Expand on the core concepts, adding explanatory details and structured explanations while maintaining absolute accuracy."
  };

  // Safe toast utility wrapper
  function notify(msg, type) {
    if (window.SM && typeof window.SM.toast === 'function') {
      window.SM.toast(msg, type || 'info');
    } else {
      console.log(`[StudyMetrics Toast] ${type}: ${msg}`);
    }
  }

  // HTML escaping utility
  function escapeHtml(string) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(string).replace(/[&<>"']/g, function (m) { return map[m]; });
  }

  // Count words, characters, sentences, paragraphs, and read time
  function updateTextStats(text, prefix) {
    var trimmed = String(text || '').trim();
    var words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
    var chars = String(text || '').length;
    
    // Sentence count matching punctuation boundaries
    var sentences = 0;
    if (trimmed !== '') {
      var sentenceMatches = trimmed.match(/[^.!?]+[.!?]+(\s|$)/g);
      sentences = sentenceMatches ? sentenceMatches.length : 1;
    }

    // Paragraph count matching newline boundaries
    var paragraphs = trimmed === '' ? 0 : text.split(/\n+/).filter(Boolean).length;

    // Estimate Reading Time (200 words per minute)
    var readTimeSeconds = Math.round((words / 200) * 60);
    var readTimeStr = '0s';
    if (readTimeSeconds > 0) {
      if (readTimeSeconds < 60) {
        readTimeStr = readTimeSeconds + 's';
      } else {
        var mins = Math.floor(readTimeSeconds / 60);
        var secs = readTimeSeconds % 60;
        readTimeStr = mins + 'm ' + (secs > 0 ? secs + 's' : '');
      }
    }

    var wordEl = document.getElementById(prefix + 'Words');
    var charEl = document.getElementById(prefix + 'Chars');
    var sentEl = document.getElementById(prefix + 'Sentences');
    var paraEl = document.getElementById(prefix + 'Paragraphs');
    var timeEl = document.getElementById(prefix + 'ReadTime');

    if (wordEl) wordEl.textContent = words;
    if (charEl) charEl.textContent = chars;
    if (sentEl) sentEl.textContent = sentences;
    if (paraEl) paraEl.textContent = paragraphs;
    if (timeEl) timeEl.textContent = readTimeStr;
  }

  // Helper to split text into sentences
  function splitSentences(text) {
    if (!text) return [];
    var sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g);
    if (!sentences || sentences.length === 0) {
      return [text];
    }
    return sentences.map(function (s) { return s.trim(); });
  }

  // Word-by-word diffing algorithm using dynamic programming (LCS)
  function diffWords(original, revised) {
    var a = original.split(/(\s+)/);
    var b = revised.split(/(\s+)/);

    var dp = Array(a.length + 1).fill(null).map(function () {
      return Array(b.length + 1).fill(0);
    });

    for (var i = 1; i <= a.length; i++) {
      for (var j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    var result = [];
    var x = a.length;
    var y = b.length;

    while (x > 0 || y > 0) {
      if (x > 0 && y > 0 && a[x - 1] === b[y - 1]) {
        result.unshift(escapeHtml(a[x - 1]));
        x--;
        y--;
      } else if (y > 0 && (x === 0 || dp[x][y - 1] >= dp[x - 1][y])) {
        if (b[y - 1].trim()) {
          result.unshift('<span class="diff-add">' + escapeHtml(b[y - 1]) + '</span>');
        } else {
          result.unshift(b[y - 1]);
        }
        y--;
      } else if (x > 0 && (y === 0 || dp[x][y - 1] < dp[x - 1][y])) {
        if (a[x - 1].trim()) {
          result.unshift('<span class="diff-del">' + escapeHtml(a[x - 1]) + '</span>');
        } else {
          result.unshift(a[x - 1]);
        }
        x--;
      }
    }

    return result.join('');
  }

  // Comparison Side-by-side builder with inner highlights
  function renderSideBySideComparison() {
    var tableBody = document.getElementById('compareTableBody');
    var inputVal = document.getElementById('inputText').value;
    var outputVal = document.getElementById('outputText').value;

    if (!tableBody) return;
    tableBody.innerHTML = '';

    var originalSents = splitSentences(inputVal);
    var rewrittenSents = splitSentences(outputVal);
    var maxLen = Math.max(originalSents.length, rewrittenSents.length);

    for (var i = 0; i < maxLen; i++) {
      var tr = document.createElement('tr');

      var tdOrig = document.createElement('td');
      var tdPara = document.createElement('td');

      var oText = originalSents[i] || '';
      var rText = rewrittenSents[i] || '';

      if (oText && rText) {
        // High-definition inline highlighting using our LCS diff builder
        tdOrig.innerHTML = oText;
        tdPara.innerHTML = diffWords(oText, rText);
      } else {
        tdOrig.textContent = oText || '—';
        tdPara.textContent = rText || '—';
      }

      tr.appendChild(tdOrig);
      tr.appendChild(tdPara);
      tableBody.appendChild(tr);
    }
  }

  // History Management
  function loadHistory() {
    try {
      var stored = localStorage.getItem(HISTORY_KEY);
      state.history = stored ? JSON.parse(stored) : [];
      renderHistoryList();
    } catch (e) {
      state.history = [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
    } catch (e) {}
  }

  function addHistoryItem(original, paraphrased, mode) {
    var item = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      original: original,
      paraphrased: paraphrased,
      mode: mode
    };

    state.history.unshift(item);
    if (state.history.length > 10) {
      state.history.pop();
    }

    saveHistory();
    renderHistoryList();
  }

  function renderHistoryList() {
    var listContainer = document.getElementById('historyList');
    if (!listContainer) return;

    if (state.history.length === 0) {
      listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--ink-3); font-size: var(--step-sm);">No rewrites in history yet.</div>';
      return;
    }

    listContainer.innerHTML = state.history.map(function (item) {
      var preview = escapeHtml(item.original.slice(0, 100)) + (item.original.length > 100 ? '...' : '');
      return '<div class="history-item" data-id="' + item.id + '">' +
        '  <div class="history-item-body" onclick="SM2Paraphraser.loadHistoryItem(\'' + item.id + '\')">' +
        '    <div class="history-item-title">' + preview + '</div>' +
        '    <div class="history-item-meta">' +
        '      <span class="history-item-tag">' + item.mode + '</span>' +
        '      <span>' + item.timestamp + '</span>' +
        '    </div>' +
        '  </div>' +
        '  <button class="history-del-btn" onclick="SM2Paraphraser.deleteHistoryItem(\'' + item.id + '\', event)" aria-label="Delete history entry">×</button>' +
        '</div>';
    }).join('');
  }

  function loadHistoryItem(id) {
    var item = state.history.find(function (x) { return x.id === id; });
    if (!item) return;

    document.getElementById('inputText').value = item.original;
    document.getElementById('outputText').value = item.paraphrased;

    updateTextStats(item.original, 'input');
    updateTextStats(item.paraphrased, 'output');

    // Restore mode selection tab state
    document.querySelectorAll('.tabs button').forEach(function (btn) {
      if (btn.getAttribute('data-mode') === item.mode) {
        btn.click();
      }
    });

    // Reset comparison view to fresh data
    var compareBtn = document.getElementById('compareBtn');
    if (compareBtn && compareBtn.getAttribute('data-status') === 'on') {
      renderSideBySideComparison();
    }

    notify("Restored translation from history", "success");
  }

  function deleteHistoryItem(id, event) {
    if (event) event.stopPropagation();
    state.history = state.history.filter(function (x) { return x.id !== id; });
    saveHistory();
    renderHistoryList();
    notify("Removed item from history", "info");
  }

  function clearHistory() {
    if (state.history.length === 0) return;
    if (confirm("Are you sure you want to clear your rewrite history? This cannot be undone.")) {
      state.history = [];
      saveHistory();
      renderHistoryList();
      notify("History cleared", "info");
    }
  }

  // Draft Auto-saving
  function autoSaveDraft() {
    var val = document.getElementById('inputText').value;
    try {
      localStorage.setItem(DRAFT_KEY, val);
    } catch (e) {}
  }

  function restoreDraft() {
    try {
      var val = localStorage.getItem(DRAFT_KEY);
      if (val) {
        var inputEl = document.getElementById('inputText');
        if (inputEl) {
          inputEl.value = val;
          updateTextStats(val, 'input');
        }
      }
    } catch (e) {}
  }

  // Copy output text
  function handleCopy() {
    var outputVal = document.getElementById('outputText').value.trim();
    if (!outputVal) {
      notify("Nothing to copy yet.", "error");
      return;
    }

    navigator.clipboard.writeText(outputVal).then(function () {
      notify("Copied to clipboard!", "success");
    }).catch(function () {
      fallbackCopy(outputVal);
    });
  }

  function fallbackCopy(text) {
    var textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      notify("Copied to clipboard!", "success");
    } catch (err) {
      notify("Failed to copy text.", "error");
    }
    document.body.removeChild(textArea);
  }

  // Save/Download output file
  function handleDownload() {
    var outputVal = document.getElementById('outputText').value.trim();
    if (!outputVal) {
      notify("There is no paraphrased text to save.", "error");
      return;
    }

    try {
      var blob = new Blob([outputVal], { type: 'text/plain;charset=utf-8' });
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'paraphrased-' + state.mode.toLowerCase() + '.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      notify("Downloaded .txt document", "success");
    } catch (e) {
      notify("Failed to initiate file download.", "error");
    }
  }

  // Paraphrasing core orchestrator
  async function triggerRewrite() {
    var inputEl = document.getElementById('inputText');
    var outputEl = document.getElementById('outputText');
    var rewriteBtn = document.getElementById('rewriteBtn');
    var rewriteBtnText = document.getElementById('rewriteBtnText');
    var rewriteBtnIcon = document.getElementById("rewriteBtnIcon");

    if (!inputEl || !outputEl || state.isProcessing) return;

    var text = inputEl.value.trim();
    if (!text) {
      notify("Please enter some text to paraphrase.", "error");
      return;
    }

    // Set Processing State
    state.isProcessing = true;
    rewriteBtn.disabled = true;
    if (rewriteBtnText) rewriteBtnText.textContent = "Polishing text...";
    if (rewriteBtnIcon) rewriteBtnIcon.style.animation = "spin 1.2s linear infinite";
    outputEl.value = "AI is rewriting your copy...";

    var prompt = "System Instruction: You are an elite academic copyeditor. Your sole objective is to paraphrase and optimize the provided text.\n" +
      "Tone Direction: " + (modePrompts[state.mode] || modePrompts.Academic) + "\n" +
      "Formatting Constraint: Respond with ONLY the finished paraphrased text. Do NOT include preambles, introductory thoughts, conversational notes, or wrapper blocks.\n\n" +
      "Text to edit:\n" + text;

    try {
      var result = "";
      if (window.AIService) {
        if (typeof window.AIService.sendMessage === 'function') {
          result = await window.AIService.sendMessage(prompt);
        } else if (typeof window.AIService.generateText === 'function') {
          result = await window.AIService.generateText(prompt);
        }
      } else {
        // Direct integration if service is missing
        var key = localStorage.getItem('gemini_api_key') || localStorage.getItem('sm_gemini_key') || "";
        if (!key) throw new Error("No API credentials configured.");
        
        var fallbackUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + key;
        var response = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) throw new Error("Gemini Service Offline " + response.status);
        var data = await response.json();
        result = data.candidates[0].content.parts[0].text;
      }

      outputEl.value = result.trim();
      updateTextStats(outputEl.value, 'output');
      notify("Paraphrased successfully!", "success");

      // Save to rewrite history
      addHistoryItem(text, outputEl.value, state.mode);

      // Auto update side-by-side comparison if open
      var compareBtn = document.getElementById('compareBtn');
      if (compareBtn && compareBtn.getAttribute('data-status') === 'on') {
        renderSideBySideComparison();
      }
    } catch (error) {
      outputEl.value = "";
      updateTextStats('', 'output');
      notify(error.message || "Failed to process paraphrasing.", "error");
    } finally {
      state.isProcessing = false;
      rewriteBtn.disabled = false;
      if (rewriteBtnText) rewriteBtnText.textContent = "Paraphrase Text";
      if (rewriteBtnIcon) rewriteBtnIcon.style.animation = "none";
    }
  }

  // Clear fields
  function resetAll() {
    var inputEl = document.getElementById('inputText');
    var outputEl = document.getElementById('outputText');
    var compareBtn = document.getElementById('compareBtn');
    var comparePanel = document.getElementById('comparePanel');

    if (inputEl) inputEl.value = '';
    if (outputEl) outputEl.value = '';

    updateTextStats('', 'input');
    updateTextStats('', 'output');

    if (compareBtn) {
      compareBtn.setAttribute('data-status', 'off');
      compareBtn.classList.remove('on');
    }
    if (comparePanel) {
      comparePanel.style.display = 'none';
    }

    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {}

    notify("Cleared all fields", "info");
  }

  // Keyboard Shortcuts handling
  function handleKeyboardShortcuts(e) {
    // Ctrl + Enter = Paraphrase
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      triggerRewrite();
    }
    // Ctrl + Shift + C = Copy Output
    if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
      e.preventDefault();
      handleCopy();
    }
    // Escape = Clear / Close Compare
    if (e.key === 'Escape') {
      var compareBtn = document.getElementById('compareBtn');
      if (compareBtn && compareBtn.getAttribute('data-status') === 'on') {
        compareBtn.click();
      } else {
        resetAll();
      }
    }
  }

  // Initializer
  function init() {
    var inputEl = document.getElementById('inputText');
    var clearBtn = document.getElementById('clearBtn');
    var rewriteBtn = document.getElementById('rewriteBtn');
    var copyBtn = document.getElementById('copyBtn');
    var downloadBtn = document.getElementById('downloadBtn');
    var compareBtn = document.getElementById('compareBtn');
    var closeCompareBtn = document.getElementById('closeCompareBtn');
    var comparePanel = document.getElementById('comparePanel');
    var clearHistoryBtn = document.getElementById('clearHistoryBtn');

    // Input text tracker with autosave
    if (inputEl) {
      inputEl.addEventListener('input', function () {
        updateTextStats(this.value, 'input');
        autoSaveDraft();
      });
    }

    // Rewrite mode selection
    document.querySelectorAll('.tabs button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.tabs button').forEach(function (b) { b.classList.remove('on'); });
        this.classList.add('on');
        state.mode = this.getAttribute('data-mode') || 'Academic';
      });
    });

    // DOM event hooks
    if (rewriteBtn) rewriteBtn.addEventListener('click', triggerRewrite);
    if (clearBtn) clearBtn.addEventListener('click', resetAll);
    if (copyBtn) copyBtn.addEventListener('click', handleCopy);
    if (downloadBtn) downloadBtn.addEventListener('click', handleDownload);
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearHistory);

    if (compareBtn) {
      compareBtn.addEventListener('click', function () {
        var status = this.getAttribute('data-status');
        if (status === 'off') {
          var inputVal = (inputEl ? inputEl.value : '').trim();
          var outputVal = (document.getElementById('outputText') ? document.getElementById('outputText').value : '').trim();

          if (!inputVal || !outputVal) {
            notify("Paraphrase some text first to run comparisons.", "error");
            return;
          }

          this.setAttribute('data-status', 'on');
          this.classList.add('on');
          if (comparePanel) comparePanel.style.display = 'block';
          renderSideBySideComparison();
          if (comparePanel) comparePanel.scrollIntoView({ behavior: 'smooth' });
        } else {
          this.setAttribute('data-status', 'off');
          this.classList.remove('on');
          if (comparePanel) comparePanel.style.display = 'none';
        }
      });
    }

    if (closeCompareBtn) {
      closeCompareBtn.addEventListener('click', function () {
        if (compareBtn) {
          compareBtn.setAttribute('data-status', 'off');
          compareBtn.classList.remove('on');
        }
        if (comparePanel) comparePanel.style.display = 'none';
      });
    }

    // Register Keyboard Shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Initial restoration sequence
    restoreDraft();
    loadHistory();
  }

  // Load modules smoothly
  document.addEventListener('DOMContentLoaded', init);

  return {
    loadHistoryItem: loadHistoryItem,
    deleteHistoryItem: deleteHistoryItem
  };

})(); 
