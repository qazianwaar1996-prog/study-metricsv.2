/*
 * ai-service.js — StudyMetrics AI Service
 * Phase 8.5 — Secure Backend
 *
 * All Gemini calls now go through the backend at /api/ai.
 * No API key is stored or handled in the browser.
 *
 * Public interface (unchanged):
 *   window.SMAI.send(history, onSuccess, onError)
 *   history: [{ role: 'user'|'assistant', content: string }]
 */
(function () {
  'use strict';

  var API_ENDPOINT = '/api/ai';

  window.SMAI = {

    /*
     * send(history, onSuccess, onError)
     * history: [{ role: 'user'|'assistant', content: string }]
     */
    send: function (history, onSuccess, onError) {

      fetch(API_ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: history })
      })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, status: res.status, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok) {
          throw new Error(
            (result.data && result.data.error) ||
            'Request failed (' + result.status + '). Please try again.'
          );
        }
        if (!result.data.reply) {
          throw new Error('Empty response from AI. Please try again.');
        }
        onSuccess(result.data.reply);
      })
      .catch(function (err) {
        onError(err.message || 'Something went wrong. Please try again.');
      });
    }

  };

})();
