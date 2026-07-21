/**
 * StudyMetrics — AI Paraphraser
 * js/paraphraser.js | Version 1.0
 * 
 * Clean, modular ES6 script following the project's styling and API structure.
 */

window.SM2Paraphraser = (function () {
  'use strict';

  // State Management
  var state = {
    mode: 'Academic',
    isProcessing: false
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
      console.log(`[StudyMetrics Toast Fallback] ${type}: ${msg}`);
    }
  }

  // Count words and characters cleanly
  function updateTextStats(text, wordEl, charEl) {
    var trimmed = String(text || '').trim();
    var words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
    var chars = String(text || '').length;

    if (wordEl) wordEl.textContent = words;
    if (charEl) charEl.textContent = chars;
  }

  // Helper to split text into coherent sentences for side-by-side comparison
  function splitSentences(text) {
    if (!text) return [];
    // Split sentences ending in periods, question marks, or exclamation marks
    var sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g);
    if (!sentences || sentences.length === 0) {
      return [text];
    }
    return sentences.map(function (s) { return s.trim(); });
  }

  // Side-by-side comparison logic
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
      tdOrig.textContent = originalSents[i] || '—';

      var tdPara = document.createElement('td');
      tdPara.textContent = rewrittenSents[i] || '—';

      tr.appendChild(tdOrig);
      tr.appendChild(tdPara);
      tableBody.appendChild(tr);
    }
  }

  // Download converted text as .txt file
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

  // Copy output to clipboard safely
  function handleCopy() {
    var outputVal = document.getElementById('outputText').value.trim();
    if (!outputVal) {
      notify("Nothing to copy yet.", "error");
      return;
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(outputVal)
        .then(function () { notify("Copied to clipboard!", "success"); })
        .catch(function () { fallbackCopy(outputVal); });
    } else {
      fallbackCopy(outputVal);
    }
  }

  // Legacy copy fallback
  function fallbackCopy(text) {
    var textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed'; // Avoid scrolling to bottom
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

  // Robust async Gemini Integration with direct REST fallback
  async function requestParaphrase(text, mode) {
    var prompt = "System Instruction: You are an elite academic copyeditor. Your sole objective is to paraphrase and optimize the provided text.\n" +
      "Tone Direction: " + (modePrompts[mode] || modePrompts.Academic) + "\n" +
      "Formatting Constraint: Respond with ONLY the finished paraphrased text. Do NOT include preambles, introductory thoughts, conversational notes, or wrapper blocks.\n\n" +
      "Text to edit:\n" + text;

    // 1. Re-use window.AIService if available
    if (window.AIService) {
      if (typeof window.AIService.sendMessage === 'function') {
        return await window.AIService.sendMessage(prompt);
      }
      if (typeof window.AIService.generateText === 'function') {
        return await window.AIService.generateText(prompt);
      }
    }

    // 2. Direct client-side fetch if API key is stored locally
    var savedKey = localStorage.getItem('gemini_api_key') || localStorage.getItem('sm_gemini_key');
    if (savedKey) {
      var fallbackUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + savedKey;
      var response = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error("Gemini Service Error " + response.status);
      }

      var data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
      }
    }

    throw new Error("StudyMetrics AI Service is temporarily offline.");
  }

  // Core Orchestrator
  async function triggerRewrite() {
    var inputEl = document.getElementById('inputText');
    var outputEl = document.getElementById('outputText');
    var rewriteBtn = document.getElementById('rewriteBtn');
    var rewriteBtnText = document.getElementById('rewriteBtnText');
    var rewriteBtnIcon = document.getElementById("rewriteBtnIcon");

    if (!inputEl || !outputEl || state.isProcessing) return;

    var text = inputEl.value.trim();
    if (!text) {
      notify("Please enter some text to rewrite.", "error");
      return;
    }

    // Update UI State for Loading
    state.isProcessing = true;
    rewriteBtn.disabled = true;
    if (rewriteBtnText) rewriteBtnText.textContent = "Polishing text...";
    if (rewriteBtnIcon) rewriteBtnIcon.style.animation = "spin 1.2s linear infinite";
    outputEl.value = "AI is rewriting your copy...";

    try {
      var result = await requestParaphrase(text, state.mode);
      outputEl.value = result.trim();
      updateTextStats(outputEl.value, document.getElementById('outputWords'), document.getElementById('outputChars'));
      notify("Paraphrased successfully!", "success");

      // Live update comparison panel if visible
      var compareBtn = document.getElementById('compareBtn');
      if (compareBtn && compareBtn.getAttribute('data-status') === 'on') {
        renderSideBySideComparison();
      }
    } catch (error) {
      outputEl.value = "";
      notify(error.message || "Failed to process paraphrasing.", "error");
    } finally {
      state.isProcessing = false;
      rewriteBtn.disabled = false;
      if (rewriteBtnText) rewriteBtnText.textContent = "Paraphrase Text";
      if (rewriteBtnIcon) rewriteBtnIcon.style.animation = "none";
    }
  }

  // Reset and Clear Fields
  function resetAll() {
    var inputEl = document.getElementById('inputText');
    var outputEl = document.getElementById('outputText');
    var compareBtn = document.getElementById('compareBtn');
    var comparePanel = document.getElementById('comparePanel');

    if (inputEl) inputEl.value = '';
    if (outputEl) outputEl.value = '';

    updateTextStats('', document.getElementById('inputWords'), document.getElementById('inputChars'));
    updateTextStats('', document.getElementById('outputWords'), document.getElementById('outputChars'));

    if (compareBtn) {
      compareBtn.setAttribute('data-status', 'off');
      compareBtn.classList.remove('on');
    }
    if (comparePanel) {
      comparePanel.style.display = 'none';
    }

    notify("Cleared all fields", "info");
  }

  // Initialize event bindings cleanly
  function init() {
    var inputEl = document.getElementById('inputText');
    var outputEl = document.getElementById('outputText');
    var clearBtn = document.getElementById('clearBtn');
    var rewriteBtn = document.getElementById('rewriteBtn');
    var copyBtn = document.getElementById('copyBtn');
    var downloadBtn = document.getElementById('downloadBtn');
    var compareBtn = document.getElementById('compareBtn');
    var closeCompareBtn = document.getElementById('closeCompareBtn');
    var comparePanel = document.getElementById('comparePanel');

    var inputWords = document.getElementById('inputWords');
    var inputChars = document.getElementById('inputChars');
    var outputWords = document.getElementById('outputWords');
    var outputChars = document.getElementById('outputChars');

    // Input stats event
    if (inputEl) {
      inputEl.addEventListener('input', function () {
        updateTextStats(this.value, inputWords, inputChars);
      });
    }

    // Rewrite style button clicks
    document.querySelectorAll('.tabs button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.tabs button').forEach(function (b) { b.classList.remove('on'); });
        this.classList.add('on');
        state.mode = this.getAttribute('data-mode') || 'Academic';
      });
    });

    // Event hooks
    if (rewriteBtn) rewriteBtn.addEventListener('click', triggerRewrite);
    if (clearBtn) clearBtn.addEventListener('click', resetAll);
    if (copyBtn) copyBtn.addEventListener('click', handleCopy);
    if (downloadBtn) downloadBtn.addEventListener('click', handleDownload);

    if (compareBtn) {
      compareBtn.addEventListener('click', function () {
        var status = this.getAttribute('data-status');
        if (status === 'off') {
          var inputVal = (inputEl ? inputEl.value : '').trim();
          var outputVal = (outputEl ? outputEl.value : '').trim();

          if (!inputVal || !outputVal) {
            notify("Please write and paraphrase some text first", "error");
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
  }

  // DOM Event hooks
  document.addEventListener('DOMContentLoaded', init);

  return {
    triggerRewrite: triggerRewrite,
    resetAll: resetAll,
    handleCopy: handleCopy,
    handleDownload: handleDownload
  };

})();
