/*
 * ai-coach.js — StudyMetrics Academic Coach Enhancements
 * Phase 8.3
 *
 * Responsibilities:
 *   - Inject "Coach Mode" topic selector into ai.html
 *   - Provide rich context-aware prompt prefixes
 *   - Detect user country via language/timezone hints
 *   - Suggest contextually relevant StudyMetrics tools
 *   - Surface quick-start coaching prompts by topic
 *
 * Depends on: ai-service.js (window.SMAI), script.js (SM)
 * Only activates on ai.html.
 */
(function () {
  'use strict';

  /* Only run on ai.html */
  var page = location.pathname.split('/').pop() || '';
  if (page !== 'ai.html' && page !== '') return;

  /* ─────────────────────────────────────────────────────────────
     1. COACH TOPICS — each has a label, icon, prompt prefix,
        and contextual tool recommendations
  ───────────────────────────────────────────────────────────── */
  var COACH_TOPICS = [
    {
      id:    'gpa',
      label: 'GPA Improvement',
      icon:  '📈',
      desc:  'Raise your GPA with a personalised plan',
      suggestions: [
        'My GPA is 2.8 and I want to reach 3.5. I have 60 credits remaining. What do I need?',
        'Which courses should I retake to improve my GPA the most?',
        'I failed 2 courses this semester. How do I recover my GPA?',
        'What GPA do I need this semester to graduate with honours?'
      ],
      tools: [
        { name: 'GPA Improvement Planner', url: 'gpa-improvement-planner.html' },
        { name: 'Target GPA Calculator',   url: 'target-gpa.html' },
        { name: 'GPA Calculator',          url: 'gpa.html' },
        { name: 'CGPA Calculator',         url: 'cgpa.html' }
      ]
    },
    {
      id:    'study',
      label: 'Study Planning',
      icon:  '📚',
      desc:  'Build an evidence-based study schedule',
      suggestions: [
        'Create a 4-week study plan for 3 exams: Maths, Biology, and History.',
        'I can study 2 hours a day. How should I split my time across 5 subjects?',
        'What is the best study technique for memorising large amounts of content?',
        'I keep procrastinating — how do I actually start studying?'
      ],
      tools: [
        { name: 'Study Schedule Builder', url: 'study-schedule.html' },
        { name: 'Study Time Calculator',  url: 'study-time.html' },
        { name: 'Pomodoro Timer',         url: 'pomodoro.html' }
      ]
    },
    {
      id:    'exam',
      label: 'Exam Prep',
      icon:  '✍️',
      desc:  'Targeted strategies for upcoming exams',
      suggestions: [
        'My final exam is in 3 days. What should I do right now?',
        'How do I revise effectively for a multiple-choice exam?',
        'Give me a checklist for preparing for my maths final.',
        'I get very anxious in exams. How can I manage it?'
      ],
      tools: [
        { name: 'Final Exam Calculator',    url: 'final-exam-calculator.html' },
        { name: 'Final Grade Calculator',   url: 'final-grade.html' },
        { name: 'Required Marks Calculator', url: 'required-marks.html' },
        { name: 'Grade Predictor',          url: 'grade-predictor.html' }
      ]
    },
    {
      id:    'time',
      label: 'Time Management',
      icon:  '⏱️',
      desc:  'Prioritise tasks and protect study time',
      suggestions: [
        'I work part-time 20 hours a week and take 5 courses. Help me manage my time.',
        'I always run out of time in exams — how do I practise time management?',
        'How should I use Sunday to prepare for a productive study week?',
        'I have 6 deadlines this week. Help me prioritise.'
      ],
      tools: [
        { name: 'Study Schedule Builder', url: 'study-schedule.html' },
        { name: 'Pomodoro Timer',         url: 'pomodoro.html' },
        { name: 'Study Time Calculator',  url: 'study-time.html' }
      ]
    },
    {
      id:    'subject',
      label: 'Subject Strategies',
      icon:  '🎯',
      desc:  'Subject-specific study techniques',
      suggestions: [
        'I struggle with Calculus. What are the best ways to study maths?',
        'How should I study for an essay-based History exam?',
        'Give me a study strategy for Organic Chemistry.',
        'I need to improve my essay writing for my English Literature course.'
      ],
      tools: [
        { name: 'Grade Calculator',         url: 'grade-calculator.html' },
        { name: 'Assignment Weight Calc',   url: 'assignment-weight.html' },
        { name: 'Study Guides',             url: 'study-guides.html' }
      ]
    },
    {
      id:    'country',
      label: 'Country Guidance',
      icon:  '🌍',
      desc:  'Grading systems & academic norms worldwide',
      suggestions: [
        'Explain how the UK degree classification system works (First, 2:1, 2:2).',
        'I have a 7.8 CGPA in India — what is my equivalent GPA in the US?',
        'What GPA do I need to get into a Canadian university for grad school?',
        'How does the Australian grading system (HD, D, C, P) map to GPA?'
      ],
      tools: [
        { name: 'GPA Converter',          url: 'gpa-converter.html' },
        { name: 'Percentage to GPA',      url: 'percentage-to-gpa.html' },
        { name: 'Grading Guide',          url: 'grading-guide.html' },
        { name: 'GPA Help Center',        url: 'gpa-help-center.html' }
      ]
    }
  ];

  /* ─────────────────────────────────────────────────────────────
     2. STATE
  ───────────────────────────────────────────────────────────── */
  var activeTopic = null;

  /* ─────────────────────────────────────────────────────────────
     3. BUILD & INJECT THE COACH TOPIC SELECTOR
     Inserts above the chat-welcome area
  ───────────────────────────────────────────────────────────── */
  function buildTopicSelector() {
    var wrap = document.createElement('div');
    wrap.className = 'coach-topics';
    wrap.setAttribute('role', 'tablist');
    wrap.setAttribute('aria-label', 'Academic coaching topics');

    COACH_TOPICS.forEach(function (topic) {
      var btn = document.createElement('button');
      btn.className = 'coach-topic-btn';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', 'false');
      btn.setAttribute('data-topic', topic.id);
      btn.innerHTML =
        '<span class="coach-topic-icon" aria-hidden="true">' + topic.icon + '</span>' +
        '<span class="coach-topic-label">' + topic.label + '</span>';
      btn.addEventListener('click', function () {
        selectTopic(topic.id, btn);
      });
      wrap.appendChild(btn);
    });

    return wrap;
  }

  function selectTopic(id, clickedBtn) {
    activeTopic = id;
    var topic = COACH_TOPICS.find(function (t) { return t.id === id; });
    if (!topic) return;

    /* Update button states */
    document.querySelectorAll('.coach-topic-btn').forEach(function (b) {
      var active = b.getAttribute('data-topic') === id;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    /* Update suggestion chips */
    updateSuggestions(topic.suggestions);

    /* Update sidebar tool links */
    updateSidebarTools(topic.tools);

    /* Update coach context card */
    updateCoachCard(topic);
  }

  function updateSuggestions(suggestions) {
    var container = document.querySelector('.chat-suggestions');
    if (!container) return;
    container.innerHTML = '';
    suggestions.forEach(function (q) {
      var btn = document.createElement('button');
      btn.className = 'chat-suggestion';
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('data-q', q);
      btn.textContent = q;
      btn.addEventListener('click', function () {
        /* Dispatch to ai-chat.js via custom event */
        document.dispatchEvent(new CustomEvent('smai:send', { detail: { text: q } }));
      });
      container.appendChild(btn);
    });
  }

  function updateSidebarTools(tools) {
    var rail = document.querySelector('.ai-tool-links');
    if (!rail) return;
    var links = rail.querySelectorAll('a.ai-tool-link');
    /* Hide all, then show matched ones */
    links.forEach(function (a) { a.style.display = 'none'; });

    /* Inject fresh links */
    var existing = rail.querySelector('.coach-tool-links');
    if (existing) existing.remove();

    var frag = document.createDocumentFragment();
    var ul = document.createElement('div');
    ul.className = 'coach-tool-links';
    tools.forEach(function (tool) {
      var a = document.createElement('a');
      a.href = tool.url;
      a.className = 'ai-tool-link coach-injected';
      a.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3v18h18"/><polyline points="18 17 13 12 9 16 5 12"/></svg>' +
        tool.name;
      ul.appendChild(a);
    });
    frag.appendChild(ul);

    /* Also show original links again if no tools */
    if (!tools.length) {
      links.forEach(function (a) { a.style.display = ''; });
    }

    rail.appendChild(frag);
  }

  function updateCoachCard(topic) {
    var card = document.getElementById('coach-context-card');
    if (!card) return;
    card.innerHTML =
      '<div class="coach-card-icon">' + topic.icon + '</div>' +
      '<div class="coach-card-body">' +
        '<strong>' + topic.label + '</strong>' +
        '<p>' + topic.desc + '</p>' +
      '</div>';
    card.style.display = 'flex';
  }

  /* ─────────────────────────────────────────────────────────────
     4. INJECT COACH CARD into sidebar (above pro-tip)
  ───────────────────────────────────────────────────────────── */
  function buildCoachCard() {
    var card = document.createElement('div');
    card.id = 'coach-context-card';
    card.className = 'coach-context-card';
    card.style.display = 'none';
    return card;
  }

  /* ─────────────────────────────────────────────────────────────
     5. RESTORE sidebar original links when no topic is selected
  ───────────────────────────────────────────────────────────── */
  function restoreSidebarLinks() {
    var rail = document.querySelector('.ai-tool-links');
    if (!rail) return;
    var injected = rail.querySelector('.coach-tool-links');
    if (injected) injected.remove();
    rail.querySelectorAll('a.ai-tool-link:not(.coach-injected)').forEach(function (a) {
      a.style.display = '';
    });
  }

  /* ─────────────────────────────────────────────────────────────
     6. LISTEN for smai:send events from suggestions
     Passes message to ai-chat.js via shared textarea + click
  ───────────────────────────────────────────────────────────── */
  document.addEventListener('smai:send', function (e) {
    var text = e.detail && e.detail.text;
    if (!text) return;
    var ta  = document.getElementById('chat-textarea');
    var btn = document.getElementById('chat-send-btn');
    if (ta && btn) {
      ta.value = text;
      /* Trigger auto-resize if ai-chat.js set one up */
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      btn.click();
    }
  });

  /* ─────────────────────────────────────────────────────────────
     7. INIT — inject after DOM ready
  ───────────────────────────────────────────────────────────── */
  function init() {
    /* Inject topic selector before the chat window */
    var chatWindow = document.querySelector('.chat-window');
    if (chatWindow) {
      var topicBar = buildTopicSelector();
      chatWindow.parentNode.insertBefore(topicBar, chatWindow);
    }

    /* Inject coach context card in sidebar */
    var rail = document.querySelector('.ai-rail');
    if (rail) {
      var proTip = rail.querySelector('.ai-info-card:last-child');
      var card = buildCoachCard();
      if (proTip) {
        rail.insertBefore(card, proTip);
      } else {
        rail.appendChild(card);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
