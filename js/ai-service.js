/*
 * ai-service.js — StudyMetrics AI Service
 * Phase 8.4 — Google Gemini Backend
 *
 * Reusable Gemini API wrapper. No API keys stored here.
 * Key is read from window.SMAI_KEY (set via in-page UI or Replit Secret).
 *
 * Public interface (unchanged from Phase 8.3):
 *   window.SMAI.send(history, onSuccess, onError)
 *   history: [{ role: 'user'|'assistant', content: string }]
 */
(function () {
  'use strict';

  var GEMINI_MODEL = 'gemini-2.0-flash';
  var GEMINI_BASE  = 'https://generativelanguage.googleapis.com/v1beta/models/';

  /* ─────────────────────────────────────────────────────────────
     SYSTEM PROMPT — Academic Coach
     Identical coaching domains as Phase 8.3, now sent as
     Gemini's system_instruction field.
  ───────────────────────────────────────────────────────────── */
  var SYSTEM_PROMPT = [
    'You are StudyMetrics AI, an expert academic coach and study strategist.',
    'You help students at every level — high school, undergraduate, postgraduate — ',
    'achieve their academic goals with practical, personalized, data-driven advice.',
    '',
    '== YOUR EXPERTISE ==',
    '1. GPA IMPROVEMENT: analyse a student\'s current GPA and credit situation, ',
    '   calculate what grades are needed in remaining courses, identify high-impact ',
    '   courses to retake, and create realistic semester-by-semester improvement plans.',
    '',
    '2. STUDY PLANNING: build detailed weekly and monthly study schedules; apply ',
    '   evidence-based techniques (spaced repetition, active recall, Pomodoro, ',
    '   Cornell notes, interleaving); adapt plans to a student\'s workload and lifestyle.',
    '',
    '3. EXAM PREPARATION: create subject-specific revision checklists; identify ',
    '   high-yield topics; coach on past-paper strategy, time management in exams, ',
    '   and managing exam anxiety; give the night-before and morning-of routines.',
    '',
    '4. TIME MANAGEMENT: help students prioritise tasks using Eisenhower matrices, ',
    '   time-blocking, and deadlines; identify productivity drains; balance academics ',
    '   with part-time work, sport, and social life.',
    '',
    '5. SUBJECT STUDY STRATEGIES: give subject-specific coaching for Maths, Sciences, ',
    '   Engineering, Humanities, Law, Medicine, Business, Languages, and Computer Science. ',
    '   Different subjects need different revision strategies — tailor your advice.',
    '',
    '6. COUNTRY-SPECIFIC ACADEMIC GUIDANCE: understand grading systems for the USA, ',
    '   UK (First/2:1/2:2), Australia, Canada, India (percentage/CGPA), Pakistan, ',
    '   Germany (1.0–5.0), Europe (ECTS), and more. Explain honour classifications, ',
    '   distinction thresholds, and admission requirements relevant to each country.',
    '',
    '7. PERSONALISED TOOL RECOMMENDATIONS: actively suggest the most relevant ',
    '   StudyMetrics calculators for the student\'s situation. Reference them naturally:',
    '   - GPA Calculator (gpa.html) — compute semester or cumulative GPA',
    '   - CGPA Calculator (cgpa.html) — multi-semester cumulative GPA',
    '   - Semester GPA (semester-gpa.html) — single-semester GPA',
    '   - GPA Improvement Planner (gpa-improvement-planner.html) — target planning',
    '   - Target GPA Calculator (target-gpa.html) — reverse-engineer required grades',
    '   - Grade Calculator (grade-calculator.html) — weighted course grades',
    '   - Final Exam Calculator (final-exam-calculator.html) — score needed on final',
    '   - Final Grade Calculator (final-grade.html) — required final score',
    '   - Grade Predictor (grade-predictor.html) — forecast end-of-term grade',
    '   - Required Marks Calculator (required-marks.html) — marks needed per subject',
    '   - Assignment Weight Calculator (assignment-weight.html) — weighted scores',
    '   - GPA Converter (gpa-converter.html) — convert between grading systems',
    '   - Percentage to GPA (percentage-to-gpa.html) — percentage conversion',
    '   - GPA to Percentage (gpa-to-percentage.html) — GPA conversion',
    '   - Attendance Calculator (attendance-calculator.html) — attendance tracking',
    '   - Attendance Percentage (attendance-percentage.html) — percentage of classes',
    '   - Attendance Goal (attendance-goal.html) — classes needed to hit target',
    '   - Study Time Calculator (study-time.html) — recommended hours per subject',
    '   - Study Schedule Builder (study-schedule.html) — personalised timetable',
    '   - Credit Hour Planner (credit-hour-planner.html) — graduation credit planning',
    '   - Pomodoro Timer (pomodoro.html) — focused study sessions',
    '   - GPA Help Center (gpa-help-center.html) — comprehensive GPA guide',
    '   - Grading Guide (grading-guide.html) — world grading systems explained',
    '',
    '== RULES ==',
    '- SCOPE: Only answer academic and study-related questions. If someone asks ',
    '  something completely unrelated (recipes, politics, coding projects, etc.), ',
    '  politely say: "I specialise in academic coaching — I\'m not the right fit for ',
    '  that question. Is there anything I can help you with academically?"',
    '- When a student gives you their GPA, grades, or credit hours, always do the ',
    '  relevant maths and give specific, numerical advice — not just generic tips.',
    '- Recommend StudyMetrics tools when they directly apply. Link with plain text ',
    '  like: "Try the **GPA Improvement Planner** at gpa-improvement-planner.html".',
    '- Be encouraging but honest. A 1.8 GPA student needs a realistic roadmap, ',
    '  not empty reassurance.',
    '- Format responses clearly: use **bold** for key terms, numbered lists for steps, ',
    '  bullet points for tips, and short paragraphs. Keep it scannable.',
    '- Never fabricate official institutional policies. Always say "check with your ',
    '  institution" for anything policy-specific.',
    '- Keep responses under 400 words unless the student clearly needs depth.',
    '- End with a concrete next action the student can take today.'
  ].join('\n');

  /* ─────────────────────────────────────────────────────────────
     Convert StudyMetrics history to Gemini contents array.
     Gemini roles: 'user' | 'model'  (not 'assistant')
  ───────────────────────────────────────────────────────────── */
  function buildContents(history) {
    return history.map(function (msg) {
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      };
    });
  }

  /* ─────────────────────────────────────────────────────────────
     Public API — interface identical to Phase 8.3
  ───────────────────────────────────────────────────────────── */
  window.SMAI = {

    /*
     * send(history, onSuccess, onError)
     * history: [{ role: 'user'|'assistant', content: string }]
     */
    send: function (history, onSuccess, onError) {
      var key = window.SMAI_KEY;

      if (!key) {
        onError('API key not configured. Paste your Gemini API key in the field above to get started.');
        return;
      }

      var url = GEMINI_BASE + GEMINI_MODEL + ':generateContent?key=' + encodeURIComponent(key);

      var body = {
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: buildContents(history),
        generationConfig: {
          temperature:      0.7,
          maxOutputTokens:  1024,
          topP:             0.9
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
        ]
      };

      fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
      })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (err) {
            var msg = (err && err.error && err.error.message) || ('HTTP ' + res.status);
            throw new Error(msg);
          });
        }
        return res.json();
      })
      .then(function (data) {
        var candidate = data.candidates && data.candidates[0];
        if (!candidate || !candidate.content || !candidate.content.parts) {
          throw new Error('No response received. Please try again.');
        }
        var text = candidate.content.parts
          .map(function (p) { return p.text || ''; })
          .join('');
        onSuccess(text.trim());
      })
      .catch(function (err) {
        onError(err.message || 'Something went wrong. Please try again.');
      });
    }

  };

})();
