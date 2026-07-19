/**
 * StudyMetrics — Secure Backend Server
 * Phase 8.5
 *
 * Responsibilities:
 *   - Serve the static site from the current directory
 *   - Expose POST /api/ai — proxies requests to Gemini
 *   - GEMINI_API_KEY is read from environment (Replit Secret)
 *   - Key is NEVER sent to the browser
 *   - Rate limiting: 20 requests / minute per IP
 *   - Input validation: message required, max length enforced
 *
 * Replit setup:
 *   1. Tools → Secrets → Add:  GEMINI_API_KEY = <your key>
 *   2. Run:  node server.js   (or npm start)
 *   3. Site is served at the Replit URL — AI works instantly.
 */

'use strict';

const express = require('express');
const fetch   = require('node-fetch');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Gemini config ───────────────────────────────────────────── */
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL   =
  'https://generativelanguage.googleapis.com/v1beta/models/' +
  GEMINI_MODEL + ':generateContent';

/* ── System prompt (moved from client to server) ─────────────── */
const SYSTEM_PROMPT = `You are StudyMetrics AI, an expert academic coach and study strategist.
You help students at every level — high school, undergraduate, postgraduate —
achieve their academic goals with practical, personalised, data-driven advice.

== YOUR EXPERTISE ==
1. GPA IMPROVEMENT: analyse a student's current GPA and credit situation,
   calculate what grades are needed in remaining courses, identify high-impact
   courses to retake, and create realistic semester-by-semester improvement plans.

2. STUDY PLANNING: build detailed weekly and monthly study schedules; apply
   evidence-based techniques (spaced repetition, active recall, Pomodoro,
   Cornell notes, interleaving); adapt plans to a student's workload and lifestyle.

3. EXAM PREPARATION: create subject-specific revision checklists; identify
   high-yield topics; coach on past-paper strategy, time management in exams,
   and managing exam anxiety; give the night-before and morning-of routines.

4. TIME MANAGEMENT: help students prioritise tasks using Eisenhower matrices,
   time-blocking, and deadlines; identify productivity drains; balance academics
   with part-time work, sport, and social life.

5. SUBJECT STUDY STRATEGIES: give subject-specific coaching for Maths, Sciences,
   Engineering, Humanities, Law, Medicine, Business, Languages, and Computer Science.
   Different subjects need different revision strategies — tailor your advice.

6. COUNTRY-SPECIFIC ACADEMIC GUIDANCE: understand grading systems for the USA,
   UK (First/2:1/2:2), Australia, Canada, India (percentage/CGPA), Pakistan,
   Germany (1.0–5.0), Europe (ECTS), and more. Explain honour classifications,
   distinction thresholds, and admission requirements relevant to each country.

7. PERSONALISED TOOL RECOMMENDATIONS: actively suggest the most relevant
   StudyMetrics calculators for the student's situation. Reference them naturally:
   - GPA Calculator (gpa.html) — compute semester or cumulative GPA
   - CGPA Calculator (cgpa.html) — multi-semester cumulative GPA
   - Semester GPA (semester-gpa.html) — single-semester GPA
   - GPA Improvement Planner (gpa-improvement-planner.html) — target planning
   - Target GPA Calculator (target-gpa.html) — reverse-engineer required grades
   - Grade Calculator (grade-calculator.html) — weighted course grades
   - Final Exam Calculator (final-exam-calculator.html) — score needed on final
   - Final Grade Calculator (final-grade.html) — required final score
   - Grade Predictor (grade-predictor.html) — forecast end-of-term grade
   - Required Marks Calculator (required-marks.html) — marks needed per subject
   - Assignment Weight Calculator (assignment-weight.html) — weighted scores
   - GPA Converter (gpa-converter.html) — convert between grading systems
   - Percentage to GPA (percentage-to-gpa.html) — percentage conversion
   - GPA to Percentage (gpa-to-percentage.html) — GPA conversion
   - Attendance Calculator (attendance-calculator.html) — attendance tracking
   - Attendance Percentage (attendance-percentage.html) — percentage of classes
   - Attendance Goal (attendance-goal.html) — classes needed to hit target
   - Study Time Calculator (study-time.html) — recommended hours per subject
   - Study Schedule Builder (study-schedule.html) — personalised timetable
   - Credit Hour Planner (credit-hour-planner.html) — graduation credit planning
   - Pomodoro Timer (pomodoro.html) — focused study sessions
   - GPA Help Center (gpa-help-center.html) — comprehensive GPA guide
   - Grading Guide (grading-guide.html) — world grading systems explained

== RULES ==
- SCOPE: Only answer academic and study-related questions. If someone asks
  something completely unrelated, politely say: "I specialise in academic
  coaching — I'm not the right fit for that question. Is there anything I
  can help you with academically?"
- When a student gives you their GPA, grades, or credit hours, always do the
  relevant maths and give specific, numerical advice — not just generic tips.
- Recommend StudyMetrics tools when they directly apply.
- Be encouraging but honest. A 1.8 GPA student needs a realistic roadmap.
- Format responses clearly: use **bold** for key terms, numbered lists for
  steps, bullet points for tips, and short paragraphs. Keep it scannable.
- Never fabricate official institutional policies.
- Keep responses under 400 words unless the student clearly needs depth.
- End with a concrete next action the student can take today.`;

/* ── In-memory rate limiter ──────────────────────────────────── */
/*
 * Stores: { ip -> { count, windowStart } }
 * Window: 60 seconds, limit: 20 requests per window.
 * Resets automatically — no external dependency needed.
 */
const RATE_WINDOW_MS = 60 * 1000;   // 1 minute
const RATE_LIMIT     = 20;          // requests per window
const rateLimitMap   = new Map();

function isRateLimited(ip) {
  const now   = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT) return true;

  entry.count++;
  return false;
}

/* Clean up stale entries every 5 minutes to prevent memory growth */
setInterval(function () {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  for (const [ip, entry] of rateLimitMap) {
    if (entry.windowStart < cutoff) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

/* ── Middleware ──────────────────────────────────────────────── */
app.use(express.json({ limit: '32kb' }));       // prevent oversized bodies
app.use(express.static(path.join(__dirname)));   // serve the static site

/* ── POST /api/ai ────────────────────────────────────────────── */
/*
 * Request body:
 *   { messages: [{ role: 'user'|'assistant', content: string }] }
 *
 * Response:
 *   { reply: string }                   — on success
 *   { error: string }                   — on failure
 */
app.post('/api/ai', async function (req, res) {

  /* 1. Rate limit by IP */
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
  }

  /* 2. Validate API key is configured */
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[StudyMetrics AI] GEMINI_API_KEY is not set in environment.');
    return res.status(503).json({ error: 'AI service is not configured. Please contact the site administrator.' });
  }

  /* 3. Validate request body */
  const { messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid request: messages array is required.' });
  }

  if (messages.length > 40) {
    return res.status(400).json({ error: 'Conversation too long. Please start a new chat.' });
  }

  /* Validate each message */
  for (const msg of messages) {
    if (!msg || typeof msg.content !== 'string') {
      return res.status(400).json({ error: 'Invalid message format.' });
    }
    if (msg.content.length > 4000) {
      return res.status(400).json({ error: 'Message too long (max 4000 characters).' });
    }
    if (!['user', 'assistant'].includes(msg.role)) {
      return res.status(400).json({ error: 'Invalid message role.' });
    }
  }

  /* 4. Build Gemini request */
  const contents = messages.map(function (msg) {
    return {
      role:  msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    };
  });

  const geminiBody = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    contents: contents,
    generationConfig: {
      temperature:     0.7,
      maxOutputTokens: 1024,
      topP:            0.9
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
    ]
  };

  /* 5. Call Gemini */
  try {
    const geminiRes = await fetch(GEMINI_URL + '?key=' + apiKey, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(geminiBody)
    });

    if (!geminiRes.ok) {
      const errData = await geminiRes.json().catch(function () { return {}; });
      const errMsg  = (errData.error && errData.error.message) || ('Gemini error ' + geminiRes.status);
      console.error('[StudyMetrics AI] Gemini API error:', errMsg);
      return res.status(502).json({ error: 'AI service error. Please try again.' });
    }

    const data      = await geminiRes.json();
    const candidate = data.candidates && data.candidates[0];

    if (!candidate || !candidate.content || !candidate.content.parts) {
      return res.status(502).json({ error: 'No response from AI. Please try again.' });
    }

    const reply = candidate.content.parts
      .map(function (p) { return p.text || ''; })
      .join('')
      .trim();

    return res.json({ reply: reply });

  } catch (err) {
    console.error('[StudyMetrics AI] Fetch error:', err.message);
    return res.status(502).json({ error: 'Could not reach AI service. Please check your connection.' });
  }
});

/* ── Fallback: serve index.html for unmatched routes ─────────── */
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* ── Start ───────────────────────────────────────────────────── */
app.listen(PORT, function () {
  console.log('');
  console.log('  ┌─────────────────────────────────────────┐');
  console.log('  │  StudyMetrics running on port ' + PORT + '       │');
  console.log('  │  AI endpoint: POST /api/ai               │');
  console.log('  │  Key configured: ' + (process.env.GEMINI_API_KEY ? 'YES ✓' : 'NO — set GEMINI_API_KEY') + '         │');
  console.log('  └─────────────────────────────────────────┘');
  console.log('');
});
