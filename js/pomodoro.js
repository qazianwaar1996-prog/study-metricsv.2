(function(){
"use strict";
var $=SM.$;
var state={running:false,phase:'focus',round:1,maxRounds:4,remaining:25*60,completedSessions:0,focusMinutes:0};
var ticker=null;

function pad(n){return String(n).padStart(2,'0');}
function fmt(s){return pad(Math.floor(s/60))+':'+pad(s%60);}

function getFocusSec(){return (parseInt(($('#pomFocus')||{}).value)||25)*60;}
function getShortSec(){return (parseInt(($('#pomShort')||{}).value)||5)*60;}
function getLongSec(){return (parseInt(($('#pomLong')||{}).value)||15)*60;}

function updateDisplay(){
  var d=$('#pomDisplay'),l=$('#pomLabel'),r=$('#pomRound');
  if(d) d.textContent=fmt(state.remaining);
  if(l) l.textContent=state.phase==='focus'?'Focus Session':state.phase==='short'?'Short Break':'Long Break';
  if(r) r.textContent='Round '+state.round+' of '+state.maxRounds;
  document.title=fmt(state.remaining)+' — '+( state.phase==='focus'?'Focus':'Break')+' · Study Metrics';
  var sc=$('#pomCompleted'),ft=$('#pomFocusTime');
  if(sc) sc.textContent=state.completedSessions;
  if(ft) ft.textContent=state.focusMinutes;
  var start=$('#pomStart'),pause=$('#pomPause');
  if(start){start.disabled=state.running;start.innerHTML=(state.running?'Running…':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start');}
  if(pause) pause.disabled=!state.running;
}

function nextPhase(){
  if(state.phase==='focus'){
    state.completedSessions++;
    state.focusMinutes+=Math.round(getFocusSec()/60);
    if(state.round>=state.maxRounds){state.phase='long';state.remaining=getLongSec();}
    else{state.phase='short';state.remaining=getShortSec();}
  } else {
    if(state.phase==='long'){state.round=1;}else{state.round++;}
    state.phase='focus'; state.remaining=getFocusSec();
  }
  // Notify
  if('Notification' in window && Notification.permission==='granted'){
    new Notification('Study Metrics',{body:state.phase==='focus'?'Break over! Time to focus.':'Focus session done! Take a break.',icon:'images/favicon.svg'});
  }
  updateDisplay();
}

function tick(){
  if(state.remaining<=0){stop();nextPhase();return;}
  state.remaining--;
  updateDisplay();
}

function start(){
  if(state.running) return;
  state.running=true;
  if('Notification' in window && Notification.permission==='default') Notification.requestPermission();
  ticker=setInterval(tick,1000);
  updateDisplay();
}

function stop(){
  state.running=false;
  clearInterval(ticker); ticker=null;
  updateDisplay();
}

function reset(){
  stop();
  state.phase='focus'; state.round=1; state.remaining=getFocusSec();
  updateDisplay();
  document.title='Study Metrics';
}

document.addEventListener('DOMContentLoaded',function(){
  state.remaining=getFocusSec();
  updateDisplay();
  var s=$('#pomStart'),p=$('#pomPause'),r=$('#pomReset');
  if(s) s.onclick=start;
  if(p) p.onclick=stop;
  if(r) r.onclick=reset;
  ['#pomFocus','#pomShort','#pomLong'].forEach(function(sel){
    var el=$(sel); if(!el) return;
    el.addEventListener('change',function(){if(!state.running) reset();});
  });
  // Keyboard: Space = start/pause
  document.addEventListener('keydown',function(e){
    if(e.target.tagName==='INPUT') return;
    if(e.code==='Space'){e.preventDefault();state.running?stop():start();}
    if(e.code==='KeyR') reset();
  });
});

// Clean up on page hide
window.addEventListener('pagehide',function(){clearInterval(ticker);document.title='Study Metrics';});
})();
