/* StudyMetrics v2 — shared app shell injector (one reusable component for all pages) */
(function(){
  "use strict";
  /* Remove the legacy purple "premium" skin site-wide → unified gold design.
     premium.js adds body.premium unconditionally; we strip it the moment it appears. */
  function killPremium(){
    var b=document.body; if(b && b.classList.contains("premium")) b.classList.remove("premium");
  }
  if(document.body){
    killPremium();
    try{
      var mo=new MutationObserver(killPremium);
      mo.observe(document.body,{attributes:true,attributeFilter:["class"]});
    }catch(e){}
  }else{
    document.addEventListener("DOMContentLoaded",function(){
      killPremium();
      try{ new MutationObserver(killPremium).observe(document.body,{attributes:true,attributeFilter:["class"]}); }catch(e){}
    });
  }
  function ready(fn){ if(document.body){fn();} else {document.addEventListener("DOMContentLoaded",fn);} }
  ready(function(){
    var body=document.body;
    if(!body) return;
    body.classList.add("sm2");
    // If a page already ships the shell (home/dashboard), don't double-inject.
    if(document.querySelector(".sm2-side")){ wireTheme(); return; }
    body.classList.add("sm2-shell");

    var SIDEBAR="<aside class=\"sm2-side\">\n    <a href=\"index.html\" class=\"sm2-brand\">\n      <span class=\"sm2-logo\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\"><path d=\"M12 2.6 4 6.4v5.4c0 4.6 3.3 8.2 8 9.6 4.7-1.4 8-5 8-9.6V6.4L12 2.6Z\" stroke=\"#e6bd63\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/><path d=\"m8.4 12.2 2.6 2.6 4.6-5.2\" stroke=\"#e6bd63\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>\n      </span>StudyMetrics\n    </a>\n    <nav class=\"sm2-nav\" aria-label=\"Primary\">\n      <a href=\"index.html\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M3 10.5 12 3l9 7.5\"/><path d=\"M5 9.5V21h14V9.5\"/><path d=\"M9.5 21v-6h5v6\"/></svg> Home</a>\n      <a href=\"index.html#tools\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3\" y=\"3\" width=\"7.5\" height=\"7.5\" rx=\"2\"/><rect x=\"13.5\" y=\"3\" width=\"7.5\" height=\"7.5\" rx=\"2\"/><rect x=\"3\" y=\"13.5\" width=\"7.5\" height=\"7.5\" rx=\"2\"/><rect x=\"13.5\" y=\"13.5\" width=\"7.5\" height=\"7.5\" rx=\"2\"/></svg> All Calculators</a>\n      <a href=\"dashboard.html\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3\" y=\"3\" width=\"8\" height=\"10\" rx=\"2\"/><rect x=\"3\" y=\"16\" width=\"8\" height=\"5\" rx=\"2\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"5\" rx=\"2\"/><rect x=\"14\" y=\"11\" width=\"7\" height=\"10\" rx=\"2\"/></svg> Dashboard</a>\n      <a href=\"ai.html\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 3v3M12 18v3M4.9 7l2.1 1.2M17 15.8 19.1 17M4.9 17 7 15.8M17 8.2 19.1 7\"/><circle cx=\"12\" cy=\"12\" r=\"3.4\"/></svg> AI Tutor <span class=\"sm2-badge\">NEW</span></a>\n      <a href=\"study-schedule.html\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3.5\" y=\"4.5\" width=\"17\" height=\"16\" rx=\"3\"/><path d=\"M3.5 9h17M8 3v3M16 3v3M8 13h4M8 16.5h6\"/></svg> Study Planner</a>\n      <a href=\"academic-resources.html\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M5 3.5h9l5 5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z\"/><path d=\"M14 3.5V9h5M8 13h8M8 16.5h5\"/></svg> Notes</a>\n      <a href=\"flashcards.html\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3\" y=\"6\" width=\"14\" height=\"12\" rx=\"2.5\"/><path d=\"M7 3.5h11a2.5 2.5 0 0 1 2.5 2.5v9\"/></svg> Flashcards</a>\n      <a href=\"grading-guide.html\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3Z\"/></svg> Countries &amp; Grades</a>\n      <a href=\"study-guides.html\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M4 5.5A2 2 0 0 1 6 3.5h13v14H6a2 2 0 0 0-2 2V5.5Z\"/><path d=\"M4 19.5a2 2 0 0 1 2-2h13v3H6a2 2 0 0 1-2-1Z\"/></svg> Resources</a>\n      <a href=\"gpa-improvement-planner.html\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><circle cx=\"12\" cy=\"12\" r=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/></svg> Goals</a>\n      <div class=\"sm2-nav-sep\"></div>\n      <a href=\"dashboard.html#favorites\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 3.5 14.6 9l6 .8-4.4 4.2 1.1 6L12 17.2 6.7 20l1.1-6L3.4 9.8 9.4 9 12 3.5Z\"/></svg> Favorites</a>\n      <a href=\"dashboard.html#recent\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7.5V12l3 2\"/></svg> Recent</a>\n    </nav>\n    <div class=\"sm2-side-ai\">\n      <h4>AI Tutor <svg viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden=\"true\" style=\"width:14px;height:14px;display:inline;color:var(--gold-strong)\"><path d=\"M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z\"/></svg></h4>\n      <p>Ask anything about academics. Get instant answers.</p>\n      <a href=\"ai.html\" class=\"sm2-btn sm2-btn-primary\">Ask AI</a>\n    </div>\n    <div class=\"sm2-side-foot\">\n      <img src=\"images/avatar.svg\" alt=\"Profile\">\n      <span class=\"nm\">Profile</span>\n      <button class=\"sm2-icon-btn sm-theme-toggle\" aria-label=\"Toggle theme\" title=\"Toggle theme\"><svg class=\"sm-theme-icon-svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z\"/></svg></button>\n      <a href=\"dashboard.html\" class=\"sm2-icon-btn\" aria-label=\"Settings\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"3.2\"/><path d=\"M19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1A2 2 0 1 1 6.9 3.6l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8Z\"/></svg></a>\n    </div>\n  </aside>";
    var TOPBAR="<header class=\"sm2-top\">\n      <button class=\"sm2-icon-btn sm2-hamburger\" onclick=\"document.body.classList.toggle('nav-open')\" aria-label=\"Menu\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M4 6h16M4 12h16M4 18h16\"/></svg></button>\n      <div class=\"sm2-search\">\n        <svg class=\"s\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" aria-hidden=\"true\"><circle cx=\"11\" cy=\"11\" r=\"7\"/><path d=\"m20 20-3.2-3.2\"/></svg>\n        <input type=\"search\" id=\"sm2Search\" placeholder=\"Search calculators or tools\u2026\" aria-label=\"Search\">\n        <span class=\"sm2-kbd\">\u2318K</span>\n      </div>\n      <nav class=\"sm2-top-nav\" aria-label=\"Secondary\">\n        <a href=\"index.html#tools\">Calculators</a>\n        <a href=\"dashboard.html\">Dashboard</a>\n        <a href=\"ai.html\">AI Tutor</a>\n        <a href=\"academic-resources.html\">Resources</a>\n      </nav>\n      <div class=\"sm2-top-tools\">\n        <button class=\"sm2-icon-btn\" style=\"position:relative\" aria-label=\"Notifications\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5Z\"/><path d=\"M10 20a2 2 0 0 0 4 0\"/></svg><span class=\"sm2-dot\"></span></button>\n        <button class=\"sm2-icon-btn sm-theme-toggle\" aria-label=\"Toggle theme\"><svg class=\"sm-theme-icon-svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19\"/></svg></button>\n        <img class=\"sm2-avatar\" src=\"images/avatar.svg\" alt=\"Profile\">\n      </div>\n    </header>";
    var BOTTOM="<nav class=\"sm2-bottomnav\" aria-label=\"Mobile\">\n  <a href=\"index.html\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M3 10.5 12 3l9 7.5\"/><path d=\"M5 9.5V21h14V9.5\"/><path d=\"M9.5 21v-6h5v6\"/></svg><span>Home</span></a>\n  <a href=\"index.html#tools\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3\" y=\"3\" width=\"7.5\" height=\"7.5\" rx=\"2\"/><rect x=\"13.5\" y=\"3\" width=\"7.5\" height=\"7.5\" rx=\"2\"/><rect x=\"3\" y=\"13.5\" width=\"7.5\" height=\"7.5\" rx=\"2\"/><rect x=\"13.5\" y=\"13.5\" width=\"7.5\" height=\"7.5\" rx=\"2\"/></svg><span>Calculators</span></a>\n  <a href=\"ai.html\" class=\"ai\"><span class=\"b\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 3v3M12 18v3M4.9 7l2.1 1.2M17 15.8 19.1 17M4.9 17 7 15.8M17 8.2 19.1 7\"/><circle cx=\"12\" cy=\"12\" r=\"3.4\"/></svg>W</span><span>AI</span></a>\n  <a href=\"dashboard.html\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3\" y=\"3\" width=\"8\" height=\"10\" rx=\"2\"/><rect x=\"3\" y=\"16\" width=\"8\" height=\"5\" rx=\"2\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"5\" rx=\"2\"/><rect x=\"14\" y=\"11\" width=\"7\" height=\"10\" rx=\"2\"/></svg><span>Dashboard</span></a>\n  <a href=\"dashboard.html\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"8\" r=\"3.5\"/><path d=\"M4.5 20a7.5 7.5 0 0 1 15 0\"/></svg><span>Profile</span></a>\n</nav>";
    var SCRIM='<div class="sm2-scrim" onclick="document.body.classList.remove(\'nav-open\')"></div>';

    // inject
    body.insertAdjacentHTML("afterbegin", SCRIM + SIDEBAR + TOPBAR + BOTTOM);

    // active states based on current file
    var file=(location.pathname.split("/").pop()||"index.html").toLowerCase();
    if(file==="") file="index.html";
    var CALC=["gpa.html","cgpa.html","semester-gpa.html","gpa-converter.html","target-gpa.html","gpa-improvement-planner.html","percentage-to-gpa.html","gpa-to-percentage.html","grade-calculator.html","final-exam-calculator.html","final-grade.html","required-marks.html","grade-predictor.html","assignment-weight.html","class-average.html","percentage-calculator.html","attendance-calculator.html","attendance-percentage.html","attendance-goal.html","study-time.html","pomodoro.html","credit-hour-planner.html","scientific-calculator.html","basic-calculator.html","word-counter.html"];
    var GRADES=["grading-guide.html","grading-system-usa.html","grading-system-uk.html","grading-system-canada.html","grading-system-australia.html","grading-system-india.html","grading-system-pakistan.html","admission-gpa-guide-usa.html","admission-gpa-guide-uk.html","gpa-help-center.html"];
    var RES=["academic-resources.html","study-guides.html","blog.html","grading-guide.html","guide-attendance-rules-explained.html","guide-final-exam-prep-checklist.html","guide-gpa-scale-explained.html","guide-how-to-raise-your-gpa.html"];
    function mark(href){
      var links=document.querySelectorAll(".sm2-side .sm2-nav a, .sm2-bottomnav a");
      links.forEach(function(a){
        var h=(a.getAttribute("href")||"").split("#")[0].toLowerCase();
        if(h===href){ a.classList.add("active"); }
      });
    }
    var target="index.html";
    if(file==="dashboard.html") target="dashboard.html";
    else if(file==="ai.html") target="ai.html";
    else if(file==="study-schedule.html") target="study-schedule.html";
    else if(CALC.indexOf(file)>-1) target="index.html#tools";
    else if(GRADES.indexOf(file)>-1) target="grading-guide.html";
    else if(file==="notes.html") target="notes.html";
    else if(file==="flashcards.html") target="flashcards.html";
    else if(RES.indexOf(file)>-1) target="academic-resources.html";
    else target="index.html";
    // match against hrefs (strip hash)
    var links=document.querySelectorAll(".sm2-side .sm2-nav a, .sm2-bottomnav a");
    var tfile=target.split("#")[0];
    var matched=false;
    links.forEach(function(a){
      var h=(a.getAttribute("href")||"").toLowerCase();
      if(h===target){a.classList.add("active");matched=true;}
    });
    if(!matched){ links.forEach(function(a){
      var h=(a.getAttribute("href")||"").split("#")[0].toLowerCase();
      if(h===tfile){a.classList.add("active");}
    });}
    wireTheme();
    // inject sm-v2-features if not already loaded
    if(!window.SM2Features){
      var scr=document.createElement('script');
      scr.src='js/sm-v2-features.js';
      scr.defer=true;
      document.head.appendChild(scr);
    }
  });

  function wireTheme(){
    // ensure theme buttons work even if personalization.js hasn't bound them
    document.querySelectorAll(".sm-theme-toggle").forEach(function(btn){
      if(btn.__smBound) return; btn.__smBound=true;
      btn.addEventListener("click",function(){
        var h=document.documentElement;
        var n=h.getAttribute("data-theme")==="dark"?"light":"dark";
        h.setAttribute("data-theme",n);
        try{localStorage.setItem("sm_theme",n);}catch(e){}
      });
    });
  }
})();
