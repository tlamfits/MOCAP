(function(){
'use strict';

/* ═══════════════════════════════════════════════════════════
   COURT VISION — Premium Canvas Engine & App Logic
   ═══════════════════════════════════════════════════════════ */

var MODE_ORDER = ['practice','skill','clinic','eval','scout','showcase','load','remote'];
var MODES = {
  practice:{icon:'◆',name:'Practice Mode',tag:'Run the gym, not the clipboard.',
    b:'Tap start, athletes check in, pick today\'s emphasis.',
    d:'Live pass and sideout stats by rotation on the courtside screen; scrimmage rallies auto-tagged as they happen.',
    a:'Report and clip reel land in your inbox before the gym empties.'},
  skill:{icon:'◎',name:'Skill Session',tag:'The rep is the unit of work.',
    b:'Pick a drill — its delay preset and scoring rubric load themselves.',
    d:'Athlete sees position-augmented replay seconds after each rep; live drill score on the screen.',
    a:'Session report card per athlete with the best and most instructive clips.'},
  clinic:{icon:'◇',name:'Coaching Clinic',tag:'Teach the drill, show the proof.',
    b:'Queue drills from the library: setup diagram, demo clip, cues, rubric.',
    d:'Demonstrations run with live overlays — coverage polygons, target windows — and you telestrate on delayed video.',
    a:'Exportable clinic packet; attendees leave with the curriculum.'},
  eval:{icon:'▣',name:'Player Evaluation',tag:'Same test, every time, verified.',
    b:'Load the standardized battery and check athletes in.',
    d:'Touch height, serve speed, passing gauntlet, lane execution — measured automatically while evaluators just watch.',
    a:'Longitudinal athlete report; percentile context grows with every event.'},
  scout:{icon:'◈',name:'Scrimmage & Scouting',tag:'Tendencies for both sides of the net.',
    b:'Start capture — no manual charting, no camera operator.',
    d:'Auto rally tagging builds rotation sideout data, hitter tendencies, and serve targets live.',
    a:'Rotation-by-rotation scouting report — yours and theirs.'},
  showcase:{icon:'★',name:'Showcase & Recruiting',tag:'Verified numbers, automatic highlights.',
    b:'Athletes check in once at the door.',
    d:'Every measurable is captured under identical, documented conditions.',
    a:'Verified metric sheet plus an auto-built highlight reel per athlete.'},
  load:{icon:'↑',name:'Jump Load & Readiness',tag:'Intervene at the whisper, not the scream.',
    b:'Nothing to wear, nothing to charge — it rides on tracking you already run.',
    d:'Every jump counted and measured for every athlete, all session long.',
    a:'Load trends and rising-load flags per athlete — before knees complain.'},
  remote:{icon:'☁',name:'Remote Review',tag:'The gym follows you home.',
    b:'Clips and stats sync to the cloud after sessions.',
    d:'Tag moments and leave timestamped feedback from anywhere.',
    a:'Athletes get homework clips; staff stays aligned between sessions.'}
};

var FEATS = [
  {n:'Block Coverage Map',c:'Block',m:['practice','skill','clinic','eval','scout'],b:'Projects your block\'s shadow onto the opponent floor at every attack contact.',g:'A coverage % for every block, drawn on the replay.',d:'Pull every attack against your middle from today: she covers 41% on line sets, but when the set goes fast cross, coverage drops to 24% and the line opens — now footwork has a target.'},
  {n:'Seam Detector',c:'Block',m:['practice','skill','clinic','scout'],b:'Measures the gap between blockers\' hands in centimeters and shows the floor zone it exposes.',g:'"Close the seam" becomes a number, not a feeling.',d:'Your pin and middle averaged a 38 cm seam in rotation 4 — the exposed zone behind it ate six kills this scrimmage.'},
  {n:'Block Timing & Penetration',c:'Block',m:['practice','skill','clinic','eval'],b:'Timing offset versus attacker contact (ms early or late) and reach over the net (cm), every jump.',g:'Separates late hands from short hands instantly.',d:'Film says the block looks beaten; data says hands arrive 90 ms early — the fix is patience, not speed.'},
  {n:'Hitting Lane Report',c:'Attack',m:['practice','skill','clinic','scout'],b:'At contact: % of line open, % of cross open, exposed tip zones.',g:'The truth about what your hitters were given.',d:'OH1 saw a wide-open line on 9 swings tonight and took 2 of them.'},
  {n:'Read Grade',c:'Attack',m:['practice','skill','clinic','eval','scout'],b:'Compares the shot chosen against the best lane available — 0-100 per swing.',g:'Coach the decision, not just the swing.',d:'Read Grade 86 on a kill into a closing seam versus Read Grade 31 on a kill down a defended line.'},
  {n:'Execution Grade',c:'Attack',m:['practice','skill','eval'],b:'Did the ball go where the swing aimed, at what contact height and speed?',g:'Right read with missed execution vs wrong read that got lucky.',d:'Her reads average 78 but execution into zone 5 sits at 52 — that\'s a toss-and-reach session.'},
  {n:'Hitter Tendency Heat Maps',c:'Attack',m:['practice','scout','showcase','remote'],b:'Shot charts per hitter by set type, rotation, and pass quality.',g:'Your scouting report writes itself.',d:'The opposing outside goes cross 81% out-of-system. Set your block\'s default.'},
  {n:'Auto Pass Ratings (3-2-1-0)',c:'Pass',m:['practice','skill','clinic','eval'],b:'Every first contact graded live against your setter\'s target window.',g:'Pass charts with zero clipboard time.',d:'By the water break: team 2.18, libero 2.40 — and you didn\'t write down a single number.'},
  {n:'Live Rotation Pass Stats',c:'Pass',m:['practice','scout'],b:'Team and per-passer averages by rotation on the courtside screen as it happens.',g:'See the leak while you can still fix it.',d:'Rotation 2 against floats from zone 1: 1.6 average. Slide your libero one seam over.'},
  {n:'Target Window & Drift Maps',c:'Pass',m:['practice','skill','eval'],b:'Delivery percentage into the setter window, plus the pattern of every miss.',g:'Shows the systematic miss your eye averages away.',d:'He\'s not a bad passer — he\'s a tight-and-right passer. It\'s coachable.'},
  {n:'Reception Formation Conformance',c:'Pass',m:['practice','clinic','scout'],b:'Planned serve-receive shape versus the shape actually on the floor at serve contact.',g:'Proof of whether the system you taught is being run.',d:'The right seam has drifted 1.1 m by Thursday. Now you know before the weekend.'},
  {n:'Set Location & Tempo Chain',c:'Set',m:['practice','skill','eval'],b:'Set error to each hitter\'s window in cm, apex height, and pass-to-attack timing.',g:'Offensive speed becomes a measured, trainable number.',d:'Your quick tempo runs 1.18 s pass-to-attack; the team that beat you runs 1.02.'},
  {n:'Distribution Intelligence',c:'Set',m:['practice','scout','remote'],b:'Who gets set, against which block, on which pass quality — and how predictable under pressure.',g:'See your offense the way scouts see it.',d:'After 20 points your setter feeds the left pin 74% of the time.'},
  {n:'Serve Speed & Target',c:'Serve',m:['practice','skill','eval','showcase'],b:'Speed, flight class, and landing versus the called target zone for every serve.',g:'Verified serve numbers without holding a radar gun.',d:'Target hit rate on zone 1 calls: 64% at 71 km/h, 38% at 78.'},
  {n:'Serve Pressure Index',c:'Serve',m:['practice','eval','scout'],b:'Servers graded on effect — passers pulled off the net, out-of-system forced.',g:'Rewards the serve that wrecks an offense, not just the ace.',d:'Your lowest-velocity server carries the highest pressure index on the roster.'},
  {n:'Base-to-Read Conformance',c:'Defense',m:['practice','clinic','eval'],b:'Distance from each defender to their system assignment at attack contact.',g:'"Be in position" becomes verifiable.',d:'Middle-back is 1.4 m off the line assignment on cross sets — everyone can see exactly why.'},
  {n:'Dig Quality & First Step',c:'Defense',m:['practice','skill','eval'],b:'First-step reaction time after attack contact plus dig-to-target grading.',g:'Separates slow feet from wrong reads.',d:'Her first step is elite at 0.21 s but dig target sits at 1.3 — platform direction is the session.'},
  {n:'Drill Builder & Library',c:'Drills',m:['practice','skill','clinic'],b:'Draw zones, set criteria, attach demo clips and cues — stored, versioned, searchable.',g:'Your drill knowledge becomes an asset that outlives the season.',d:'A new assistant can run Tuesday\'s session exactly the way you would.'},
  {n:'Auto-Scored Drills',c:'Drills',m:['practice','skill','clinic','eval'],b:'The system referees your drill\'s criteria live: scoreboard, audio cue, rep log, 0-100 Drill Score.',g:'You coach the rep; the system counts it.',d:'Target window lights green on success — athletes compete with the screen.'},
  {n:'Drill Recommendations',c:'Drills',m:['practice','skill','remote'],b:'Measured deficiencies prescribe the next drill with the data that triggered it cited.',g:'A practice plan that starts from evidence.',d:'Low cross-court coverage auto-suggests the seam-footwork progression.'},
  {n:'Position-Augmented Video Delay',c:'Feedback',m:['practice','skill','clinic'],b:'Delayed replay with skeleton, position trail, target zones, and ball path drawn on the clip.',g:'Athletes coach themselves between reps.',d:'The blocker watches her own seam open in slow motion. You never said a word.'},
  {n:'Auto-Clipping',c:'Feedback',m:['practice','skill','eval','scout','showcase','remote'],b:'Every rep and rally becomes a clip tagged with athlete, drill, scores, and events.',g:'All of the film, none of the filming.',d:'"Show me every rotation-4 sideout from March" is a search, not a Saturday.'},
  {n:'Split-View Compare',c:'Feedback',m:['skill','clinic','remote'],b:'This rep beside the athlete\'s personal best or a model demo, time-aligned at contact.',g:'The fastest feel-versus-real conversation in coaching.',d:'Tonight\'s approach next to her best jump from October — undeniable in one viewing.'},
  {n:'Rotation Analytics',c:'Team',m:['practice','scout','remote'],b:'Sideout % and point-score % by rotation, rally length profiles, lineup impact.',g:'Know exactly where your match is leaking points.',d:'You\'re +9 in rotation 1 and -11 in rotation 5 across the last four scrimmages.'},
  {n:'Jump Count & Height Trends',c:'Load',m:['practice','load','remote'],b:'Every jump counted and measured — nothing to wear or charge.',g:'A free vertical-load monitor on the whole roster.',d:'Your middle logged 142 jumps Tuesday against a season median of 96.'},
  {n:'Rising-Load Flags',c:'Load',m:['load','practice','remote'],b:'Alerts when jump volume or landing frequency spikes against baseline.',g:'Intervene at the whisper, not the scream.',d:'Week-over-week jump load up 38% — the flag arrives while the fix is still a rest day.'},
  {n:'Session Load Summary',c:'Load',m:['practice','load'],b:'Per-athlete jump and touch totals in every post-practice report.',g:'Load awareness with zero extra workflow.',d:'The report now ends with who jumped the most — and who quietly didn\'t.'},
  {n:'Verified Combine Metrics',c:'Feedback',m:['eval','showcase'],b:'Approach touch, block touch, serve speed, pass average — identical conditions every event.',g:'Numbers recruiters can actually trust.',d:'Every athlete\'s sheet states how, where, and when it was measured.'}
];

var CATS = ['All','Block','Attack','Pass','Set','Serve','Defense','Drills','Feedback','Team','Load'];

var DRILLS = [
  {id:'pass',label:'Serve-Receive',title:'Auto-Scored Pass Drill',subtitle:'Live 3-2-1-0 · Target window tracking',
   desc:'Every first contact graded against the setter target window in real time. The zone pulses green on success — athletes compete with the screen, not each other\'s opinion.',
   metrics:[{l:'Pass Rating',v:'3',s:'good'},{l:'Window Hit',v:'✓',s:'good'},{l:'Drill Score',v:'87',s:'good'}]},
  {id:'block',label:'Block Coverage',title:'Block Coverage Map',subtitle:'Shadow projection · Seam geometry',
   desc:'The system projects your block\'s shadow onto the opponent floor at contact. Coverage percentage updates live — footwork targets become visible, measurable, coachable.',
   metrics:[{l:'Coverage',v:'41%',s:'warn'},{l:'Seam Width',v:'38 cm',s:'bad'},{l:'Timing',v:'-90 ms',s:'warn'}]},
  {id:'read',label:'Read Grade',title:'Hitting Lane Intelligence',subtitle:'Decision grading · Lane availability',
   desc:'Open lanes rendered as heat zones at contact. Read Grade compares the shot chosen against the best available option — coach perception-action coupling at game speed.',
   metrics:[{l:'Line Open',v:'78%',s:'good'},{l:'Read Grade',v:'31',s:'bad'},{l:'Best Option',v:'Line',s:'good'}]},
  {id:'seam',label:'Seam Close',title:'Seam Detector',subtitle:'Centimeter precision · Exposed zone mapping',
   desc:'Gap between blockers measured in real time. The exposed floor zone highlights where attacks will land — "close the seam" becomes a number athletes can chase.',
   metrics:[{l:'Seam Gap',v:'22 cm',s:'warn'},{l:'Target',v:'<15 cm',s:''},{l:'Reps Hit',v:'12/15',s:'good'}]},
  {id:'delay',label:'Video Delay',title:'Position-Augmented Replay',subtitle:'Skeleton overlay · Self-correction loop',
   desc:'Delayed replay with pose skeleton, movement trails, and target zones burned into the clip. Athletes see exactly what the system saw — and fix it before the next rep.',
   metrics:[{l:'Delay',v:'8.0 s',s:''},{l:'Skeleton',v:'ON',s:'good'},{l:'Zones',v:'ON',s:'good'}]},
  {id:'serve',label:'Serve Target',title:'Serve Speed & Target',subtitle:'3D ball track · Verified metrics',
   desc:'Every serve tracked for velocity, flight class, and landing accuracy versus the called zone. No radar gun. No guesswork. Numbers recruiters trust.',
   metrics:[{l:'Velocity',v:'71 km/h',s:''},{l:'Zone 1',v:'HIT',s:'good'},{l:'Accuracy',v:'64%',s:'good'}]}
];

var state = { mode:'practice', cat:'All', drill:'pass' };

/* ── Canvas Court Engine ── */
function CourtEngine(canvas){
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.dpr = Math.min(window.devicePixelRatio || 1, 2);
  this.t = 0;
  this.drill = 'pass';
  this.particles = [];
  this.trail = [];
  this.resize();
  var self = this;
  window.addEventListener('resize', function(){ self.resize(); });
}

CourtEngine.prototype.resize = function(){
  var rect = this.canvas.getBoundingClientRect();
  this.w = rect.width;
  this.h = rect.height;
  this.canvas.width = this.w * this.dpr;
  this.canvas.height = this.h * this.dpr;
  this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  this.cx = this.w * 0.5;
  this.cy = this.h * 0.52;
  this.cw = this.w * 0.78;
  this.ch = this.h * 0.72;
};

CourtEngine.prototype.courtPos = function(nx, ny){
  var hw = this.cw * (0.55 + ny * 0.45);
  var hh = this.ch * (0.55 + ny * 0.45);
  return { x: this.cx + (nx - 0.5) * hw * 2, y: this.cy - hh * 0.5 + ny * hh };
};

CourtEngine.prototype.lerp = function(a,b,t){ return a + (b-a)*t; };
CourtEngine.prototype.ease = function(t){ return t<0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; };

CourtEngine.prototype.drawFloor = function(){
  var ctx = this.ctx, w = this.w, h = this.h;
  var grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0c1424');
  grad.addColorStop(1, '#060a12');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  var tl = this.courtPos(0, 0), tr = this.courtPos(1, 0);
  var bl = this.courtPos(0, 1), br = this.courtPos(1, 1);
  var wood = ctx.createLinearGradient(tl.x, tl.y, br.x, br.y);
  wood.addColorStop(0, '#1a2840');
  wood.addColorStop(0.5, '#243552');
  wood.addColorStop(1, '#1a2840');
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y); ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(br.x, br.y); ctx.lineTo(bl.x, bl.y);
  ctx.closePath();
  ctx.fillStyle = wood;
  ctx.fill();

  var scanY = (this.t * 0.4) % 1;
  var sp = this.courtPos(0, scanY), ep = this.courtPos(1, scanY);
  ctx.strokeStyle = 'rgba(0,212,255,0.06)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(ep.x, ep.y); ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y); ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(br.x, br.y); ctx.lineTo(bl.x, bl.y); ctx.closePath();
  ctx.stroke();

  var nt = this.courtPos(0.5, 0.48), nb = this.courtPos(0.5, 0.52);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(nt.x, nt.y); ctx.lineTo(nb.x, nb.y); ctx.stroke();

  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  for(var i=1;i<4;i++){
    var a = this.courtPos(i/4, 0), b = this.courtPos(i/4, 1);
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
};

CourtEngine.prototype.drawZone = function(nx, ny, nw, nh, color, pulse, label){
  var p1 = this.courtPos(nx, ny), p2 = this.courtPos(nx+nw, ny);
  var p3 = this.courtPos(nx+nw, ny+nh), p4 = this.courtPos(nx, ny+nh);
  var ctx = this.ctx, a = 0.15 + (pulse ? 0.12*Math.sin(this.t*0.08) : 0);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y);
  ctx.lineTo(p3.x,p3.y); ctx.lineTo(p4.x,p4.y); ctx.closePath();
  ctx.fillStyle = color.replace('ALPHA', a);
  ctx.fill();
  ctx.strokeStyle = color.replace('ALPHA', a + 0.35);
  ctx.lineWidth = 2;
  ctx.shadowColor = color.replace('ALPHA', '0.8');
  ctx.shadowBlur = pulse ? 18 : 8;
  ctx.stroke();
  ctx.shadowBlur = 0;
  if(label){
    var c = this.courtPos(nx+nw/2, ny+nh/2);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '600 11px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, c.x, c.y+4);
  }
  ctx.restore();
};

CourtEngine.prototype.drawPlayer = function(nx, ny, num, team, jump, label){
  var p = this.courtPos(nx, ny - (jump||0)*0.04);
  var ctx = this.ctx;
  var colors = team==='home' ? ['#C8102E','#ff4060'] : ['#00D4FF','#0088cc'];
  var r = 16 + (jump||0)*6;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(p.x, p.y+10, r*0.9, r*0.28, 0, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();

  var g = ctx.createRadialGradient(p.x-r*0.3, p.y-r*0.3, 2, p.x, p.y, r);
  g.addColorStop(0, colors[1]);
  g.addColorStop(0.7, colors[0]);
  g.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI*2);
  ctx.fillStyle = g;
  ctx.shadowColor = colors[0];
  ctx.shadowBlur = 20;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#fff';
  ctx.font = '700 13px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(num, p.x, p.y+5);

  if(label){
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '500 9px "DM Sans", sans-serif';
    ctx.fillText(label, p.x, p.y - r - 6);
  }
  ctx.restore();
};

CourtEngine.prototype.drawBall = function(nx, ny, trail){
  var p = this.courtPos(nx, ny);
  var ctx = this.ctx;
  if(trail){
    for(var i=0;i<trail.length;i++){
      var tp = this.courtPos(trail[i].x, trail[i].y);
      var a = (i/trail.length)*0.5;
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, 4+a*3, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,215,0,'+a+')';
      ctx.fill();
    }
  }
  var g = ctx.createRadialGradient(p.x-2, p.y-2, 1, p.x, p.y, 9);
  g.addColorStop(0, '#fff');
  g.addColorStop(0.4, '#FFD700');
  g.addColorStop(1, '#C8960C');
  ctx.beginPath();
  ctx.arc(p.x, p.y, 8, 0, Math.PI*2);
  ctx.fillStyle = g;
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 22;
  ctx.fill();
  ctx.shadowBlur = 0;
};

CourtEngine.prototype.drawArc = function(x1,y1,x2,y2, height){
  var p1 = this.courtPos(x1,y1), p2 = this.courtPos(x2,y2);
  var mx = (p1.x+p2.x)/2, my = (p1.y+p2.y)/2 - (height||40);
  var ctx = this.ctx;
  ctx.save();
  ctx.setLineDash([4,6]);
  ctx.strokeStyle = 'rgba(255,215,0,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p1.x,p1.y);
  ctx.quadraticCurveTo(mx, my, p2.x, p2.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
};

CourtEngine.prototype.drawHUD = function(items, side){
  var ctx = this.ctx, x = side==='right' ? this.w - 175 : 16, y = 16;
  ctx.save();
  ctx.fillStyle = 'rgba(6,10,18,0.82)';
  ctx.strokeStyle = 'rgba(0,212,255,0.25)';
  ctx.lineWidth = 1;
  var h = 28 + items.length * 36;
  roundRect(ctx, x, y, 160, h, 10);
  ctx.fill(); ctx.stroke();
  items.forEach(function(it, i){
    var iy = y + 14 + i*36;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '500 9px "DM Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(it.l, x+12, iy);
    var col = it.s==='good' ? '#34C759' : it.s==='bad' ? '#FF453A' : it.s==='warn' ? '#FFD60A' : '#fff';
    ctx.fillStyle = col;
    ctx.font = '700 18px "Bebas Neue", sans-serif';
    ctx.fillText(it.v, x+12, iy+22);
  });
  ctx.restore();
};

CourtEngine.prototype.drawBanner = function(text, sub){
  var ctx = this.ctx;
  ctx.save();
  ctx.fillStyle = 'rgba(6,10,18,0.75)';
  roundRect(ctx, this.w/2-140, this.h-52, 280, 40, 8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '700 14px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, this.w/2, this.h-30);
  if(sub){
    ctx.fillStyle = 'rgba(0,212,255,0.8)';
    ctx.font = '500 10px "DM Sans", sans-serif';
    ctx.fillText(sub, this.w/2, this.h-16);
  }
  ctx.restore();
};

CourtEngine.prototype.spawnParticles = function(nx, ny, color){
  for(var i=0;i<12;i++){
    this.particles.push({
      x:nx, y:ny,
      vx:(Math.random()-0.5)*0.02,
      vy:(Math.random()-0.5)*0.02,
      life:1,
      color:color||'#FFD700'
    });
  }
};

CourtEngine.prototype.updateParticles = function(){
  this.particles = this.particles.filter(function(p){
    p.x += p.vx; p.y += p.vy; p.life -= 0.025;
    return p.life > 0;
  });
};

CourtEngine.prototype.drawParticles = function(){
  var self = this;
  this.particles.forEach(function(p){
    var pos = self.courtPos(p.x, p.y);
    self.ctx.beginPath();
    self.ctx.arc(pos.x, pos.y, 3*p.life, 0, Math.PI*2);
    self.ctx.fillStyle = p.color.replace(')', ','+p.life+')').replace('rgb','rgba').replace('#FFD700','rgba(255,215,0');
    if(p.color.indexOf('#')===0) self.ctx.fillStyle = 'rgba(255,215,0,'+p.life+')';
    self.ctx.fill();
  });
};

function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

CourtEngine.prototype.renderPass = function(){
  var cycle = 180, f = this.t % cycle;
  var serve = Math.min(1, f/50);
  var pass = Math.max(0, Math.min(1, (f-55)/60));
  var settle = f > 120;

  this.drawZone(0.38, 0.42, 0.24, 0.18, 'rgba(52,199,89,ALPHA)', true, 'SETTER WINDOW');
  this.drawPlayer(0.15, 0.08, '7', 'away', 0, 'SERVER');
  this.drawPlayer(0.42, 0.62, '12', 'home', pass>0.5?0.3:0, 'LIBERO');
  this.drawPlayer(0.55, 0.55, '3', 'home', 0, 'S');
  this.drawPlayer(0.72, 0.48, '10', 'home', 0, 'OH');

  var bx, by;
  if(f < 55){
    bx = this.lerp(0.15, 0.42, this.ease(serve));
    by = this.lerp(0.08, 0.55, this.ease(serve)) - Math.sin(serve*Math.PI)*0.15;
    this.drawArc(0.15, 0.08, bx, by, 50);
  } else if(f < 120){
    bx = this.lerp(0.42, 0.48, this.ease(pass));
    by = this.lerp(0.55, 0.48, this.ease(pass));
  } else {
    bx = 0.48; by = 0.48;
  }
  this.drawBall(bx, by, this.trail);
  if(f===55) this.spawnParticles(0.42, 0.55, '#FFD700');
  if(settle) this.spawnParticles(0.48, 0.48, '#34C759');

  this.trail.push({x:bx,y:by});
  if(this.trail.length>14) this.trail.shift();

  var rating = settle ? '3' : pass > 0.8 ? '2' : '—';
  this.drawHUD([
    {l:'PASS RATING', v:rating, s:settle?'good':''},
    {l:'WINDOW', v:settle?'HIT':'TRACKING', s:settle?'good':''},
    {l:'TEAM AVG', v:'2.18', s:''}
  ]);
  this.drawBanner('AUTO-SCORED SERVE-RECEIVE', 'Rep ' + Math.floor(this.t/180 + 1) + ' · Live grading');
};

CourtEngine.prototype.renderBlock = function(){
  var f = this.t % 200;
  var jump = f > 80 && f < 130 ? Math.sin((f-80)/50*Math.PI)*0.8 : 0;
  var cov = 0.35 + 0.15*Math.sin(this.t*0.03);

  this.drawZone(0.52, 0.28, 0.32*cov, 0.22, 'rgba(200,16,46,ALPHA)', true, Math.round(cov*100)+'% COVERED');
  this.drawZone(0.58, 0.32, 0.08, 0.12, 'rgba(255,69,58,ALPHA)', true, 'SEAM');
  this.drawPlayer(0.48, 0.46, '15', 'home', jump, 'MB');
  this.drawPlayer(0.56, 0.46, '8', 'home', jump, 'PIN');
  this.drawPlayer(0.78, 0.38, '4', 'away', 0.5, 'ATTACKER');

  var ax = 0.78 - (f>100? (f-100)*0.002 : 0);
  var ay = 0.38 + (f>100? (f-100)*0.003 : 0);
  if(f > 90){
    this.drawArc(0.78, 0.32, ax, ay, 35);
    this.drawBall(ax, ay, this.trail);
    this.trail.push({x:ax,y:ay});
    if(this.trail.length>10) this.trail.shift();
  }
  if(f===95) this.spawnParticles(0.56, 0.38, '#C8102E');

  this.drawHUD([
    {l:'COVERAGE', v:Math.round(cov*100)+'%', s:cov>0.4?'good':'warn'},
    {l:'SEAM', v:'38 cm', s:'bad'},
    {l:'TIMING', v:'-90 ms', s:'warn'}
  ]);
  this.drawBanner('BLOCK COVERAGE MAP', 'Shadow projection at contact');
};

CourtEngine.prototype.renderRead = function(){
  var f = this.t % 220;
  var phase = f < 110 ? 'open' : 'closed';

  this.drawZone(0.62, 0.22, 0.28, 0.35, phase==='open'?'rgba(52,199,89,ALPHA)':'rgba(52,199,89,ALPHA)', true, 'LINE · 78% OPEN');
  this.drawZone(0.38, 0.28, 0.22, 0.28, 'rgba(255,69,58,ALPHA)', false, 'CROSS · DEFENDED');
  this.drawPlayer(0.72, 0.42, '11', 'away', 0.4, 'OH1');
  this.drawPlayer(0.50, 0.44, '6', 'home', 0.3, 'BLOCK');
  this.drawPlayer(0.58, 0.44, '2', 'home', 0.3, 'BLOCK');

  if(f > 60){
    var tx = phase==='open' ? 0.72 : 0.48;
    var ty = phase==='open' ? 0.32 : 0.38;
    var prog = Math.min(1, (f-60)/50);
    var bx = this.lerp(0.72, tx, this.ease(prog));
    var by = this.lerp(0.38, ty, this.ease(prog));
    this.drawArc(0.72, 0.38, bx, by, 30);
    this.drawBall(bx, by, this.trail);
    this.trail.push({x:bx,y:by});
    if(this.trail.length>10) this.trail.shift();
    if(f===110) this.spawnParticles(tx, ty, phase==='open'?'#34C759':'#FF453A');
  }

  this.drawHUD([
    {l:'READ GRADE', v: phase==='open'?'86':'31', s:phase==='open'?'good':'bad'},
    {l:'CHOSE', v: phase==='open'?'SEAM':'LINE', s:''},
    {l:'BEST OPTION', v:'CROSS', s:'good'}
  ], 'right');
  this.drawBanner('READ GRADE · PERCEPTION-ACTION', phase==='open' ? 'Elite decision' : 'Line was open — grade 31');
};

CourtEngine.prototype.renderSeam = function(){
  var gap = 38 - Math.min(30, (this.t % 200)*0.2);
  var gx = 0.5;

  this.drawPlayer(gx - gap/800 - 0.02, 0.44, '8', 'home', 0.5+Math.sin(this.t*0.06)*0.2, 'PIN');
  this.drawPlayer(gx + gap/800 + 0.02, 0.44, '15', 'home', 0.5+Math.sin(this.t*0.06+1)*0.2, 'MB');
  this.drawZone(gx-0.04, 0.32, 0.08, 0.18, 'rgba(255,69,58,ALPHA)', true, 'EXPOSED');
  this.drawPlayer(0.74, 0.36, '4', 'away', 0.3, '');

  var col = gap < 18 ? '#34C759' : '#FF453A';
  var ctx = this.ctx;
  var p1 = this.courtPos(gx - gap/800, 0.38);
  var p2 = this.courtPos(gx + gap/800, 0.38);
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 3;
  ctx.shadowColor = col;
  ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  ctx.shadowBlur = 0;
  var mid = this.courtPos(gx, 0.36);
  ctx.fillStyle = col;
  ctx.font = '700 16px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(Math.round(gap)+' cm', mid.x, mid.y);
  ctx.restore();

  this.drawHUD([
    {l:'SEAM GAP', v:Math.round(gap)+' cm', s:gap<18?'good':'bad'},
    {l:'TARGET', v:'<15 cm', s:''},
    {l:'REPS', v:'12/15', s:'good'}
  ]);
  this.drawBanner('SEAM DETECTOR', 'Close the gap · Measure the zone');
};

CourtEngine.prototype.renderDelay = function(){
  var f = this.t % 240;
  this.drawPlayer(0.52, 0.42, '15', 'home', 0.4+Math.sin(this.t*0.05)*0.15, 'MB');

  var p = this.courtPos(0.52, 0.38);
  var ctx = this.ctx;
  ctx.save();
  ctx.strokeStyle = 'rgba(0,212,255,0.7)';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00D4FF';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(p.x, p.y-20, 8, 0, Math.PI*2);
  ctx.moveTo(p.x, p.y-12); ctx.lineTo(p.x, p.y+15);
  ctx.moveTo(p.x, p.y-2); ctx.lineTo(p.x+14, p.y-10);
  ctx.moveTo(p.x, p.y-2); ctx.lineTo(p.x-12, p.y+2);
  ctx.moveTo(p.x, p.y+15); ctx.lineTo(p.x-8, p.y+35);
  ctx.moveTo(p.x, p.y+15); ctx.lineTo(p.x+8, p.y+35);
  ctx.stroke();

  for(var i=0;i<5;i++){
    var trail = this.courtPos(0.52 - i*0.015, 0.42 - i*0.008);
    ctx.globalAlpha = 0.15 - i*0.025;
    ctx.beginPath(); ctx.arc(trail.x, trail.y, 14-i*2, 0, Math.PI*2);
    ctx.fillStyle = '#00D4FF'; ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  this.drawZone(0.48, 0.30, 0.12, 0.20, 'rgba(0,212,255,ALPHA)', true, 'HOLD LINE');
  this.drawHUD([
    {l:'DELAY', v:'8.0 s', s:''},
    {l:'SKELETON', v:'ACTIVE', s:'good'},
    {l:'REPLAY', v: f<120?'▶ LIVE':'▶ REPLAY', s:''}
  ], 'right');
  this.drawBanner('POSITION-AUGMENTED DELAY', 'Athletes self-correct between reps');
};

CourtEngine.prototype.renderServe = function(){
  var f = this.t % 160;
  var prog = Math.min(1, f/90);

  this.drawZone(0.68, 0.06, 0.18, 0.14, 'rgba(255,215,0,ALPHA)', true, 'ZONE 1');
  this.drawPlayer(0.12, 0.88, '9', 'home', 0, 'SERVER');

  var bx = this.lerp(0.12, 0.76, this.ease(prog));
  var by = this.lerp(0.82, 0.12, this.ease(prog)) - Math.sin(prog*Math.PI)*0.25;
  this.drawArc(0.12, 0.85, bx, by, 60);
  this.drawBall(bx, by, this.trail);
  this.trail.push({x:bx,y:by});
  if(this.trail.length>16) this.trail.shift();

  if(f===90){
    this.spawnParticles(0.76, 0.12, '#FFD700');
    this.spawnParticles(0.76, 0.12, '#34C759');
  }

  var hit = f > 88;
  this.drawHUD([
    {l:'VELOCITY', v:'71 km/h', s:''},
    {l:'TARGET', v: hit?'ZONE 1':'IN FLIGHT', s: hit?'good':''},
    {l:'ACCURACY', v:'64%', s:'good'}
  ]);
  this.drawBanner('SERVE SPEED & TARGET', hit ? '✓ VERIFIED HIT · 71 km/h' : 'Tracking trajectory…');
};

CourtEngine.prototype.render = function(){
  this.t++;
  this.trail = this.trail || [];
  if(this.t % 180 === 0) this.trail = [];
  this.drawFloor();
  this.updateParticles();

  switch(this.drill){
    case 'pass': this.renderPass(); break;
    case 'block': this.renderBlock(); break;
    case 'read': this.renderRead(); break;
    case 'seam': this.renderSeam(); break;
    case 'delay': this.renderDelay(); break;
    case 'serve': this.renderServe(); break;
  }
  this.drawParticles();
};

CourtEngine.prototype.setDrill = function(id){
  this.drill = id;
  this.trail = [];
  this.particles = [];
  this.t = 0;
};

/* ── Hero mini engine ── */
function HeroEngine(canvas){
  CourtEngine.call(this, canvas);
}
HeroEngine.prototype = Object.create(CourtEngine.prototype);
HeroEngine.prototype.render = function(){
  this.t++;
  this.drawFloor();
  this.drawZone(0.38, 0.42, 0.24, 0.18, 'rgba(52,199,89,ALPHA)', true, '');
  var positions = [[0.15,0.12,'7'],['0.42','0.58','12'],['0.55','0.52','3'],['0.70','0.45','10'],['0.30','0.35','5'],['0.62','0.38','14']];
  for(var i=0;i<positions.length;i++){
    this.drawPlayer(parseFloat(positions[i][0]), parseFloat(positions[i][1]) + Math.sin(this.t*0.02+i)*0.008, positions[i][2], i<1?'away':'home', 0, '');
  }
  var bx = 0.35 + Math.sin(this.t*0.015)*0.25;
  var by = 0.25 + Math.cos(this.t*0.012)*0.15;
  this.drawBall(bx, by, []);
  this.drawHUD([{l:'LIVE',v:'TRACKING',s:'good'},{l:'PLAYERS',v:'12',s:''},{l:'LATENCY',v:'<0.5s',s:'good'}], 'right');
};

/* ── UI helpers ── */
function countFor(mode){
  var c=0; for(var i=0;i<FEATS.length;i++) if(FEATS[i].m.indexOf(mode)>-1) c++; return c;
}

function featCard(f){
  return '<article class="fcard"><span class="fcat">'+f.c+'</span><h3>'+f.n+'</h3><p class="fblurb">'+f.b+'</p><p class="fgives">'+f.g+'</p><div class="fdetail"><em>In your gym</em>'+f.d+'</div></article>';
}

function filteredFeats(mode, cat){
  var list=[];
  for(var i=0;i<FEATS.length;i++){
    var f=FEATS[i];
    if((!mode || f.m.indexOf(mode)>-1) && (cat==='All'||f.c===cat)) list.push(f);
  }
  return list;
}

var engine, heroEngine, raf;

function renderModeUI(){
  var tabs='';
  for(var i=0;i<MODE_ORDER.length;i++){
    var k=MODE_ORDER[i], md=MODES[k];
    tabs+='<button class="mode-tab'+(state.mode===k?' active':'')+'" data-mode="'+k+'"><span class="mt-icon">'+md.icon+'</span><span class="mt-label">'+md.name+'</span><span class="mt-count">'+countFor(k)+'</span></button>';
  }
  document.getElementById('modeTabs').innerHTML=tabs;
  var md=MODES[state.mode];
  document.getElementById('modeBanner').innerHTML=
    '<div class="mode-head"><span class="mode-icon">'+md.icon+'</span><div><h3>'+md.name+'</h3><p>'+md.tag+'</p></div></div>'+
    '<div class="timeline"><div class="tl-item"><span>Before</span><p>'+md.b+'</p></div><div class="tl-item live"><span>During</span><p>'+md.d+'</p></div><div class="tl-item"><span>After</span><p>'+md.a+'</p></div></div>';
  var list=filteredFeats(state.mode,'All');
  document.getElementById('modeCount').textContent=list.length+' features active in this context';
  var h=''; for(var j=0;j<list.length;j++) h+=featCard(list[j]);
  document.getElementById('modeFeatures').innerHTML=h;
}

function renderSkillUI(){
  var chips='';
  for(var i=0;i<CATS.length;i++) chips+='<button class="fc'+(state.cat===CATS[i]?' active':'')+'" data-cat="'+CATS[i]+'">'+CATS[i]+'</button>';
  document.getElementById('skillChips').innerHTML=chips;
  var list=filteredFeats(null, state.cat);
  document.getElementById('skillCount').textContent=list.length+' of '+FEATS.length+' capabilities';
  var h=''; for(var j=0;j<list.length;j++) h+=featCard(list[j]);
  document.getElementById('skillGrid').innerHTML=h;
}

function renderDrillUI(){
  var nav='', cards='';
  for(var i=0;i<DRILLS.length;i++){
    var d=DRILLS[i];
    nav+='<button class="drill-btn'+(state.drill===d.id?' active':'')+'" data-drill="'+d.id+'">'+d.label+'</button>';
    cards+='<div class="drill-card'+(state.drill===d.id?' active':'')+'" data-drill="'+d.id+'"><h4>'+d.title+'</h4><p class="drill-sub">'+d.subtitle+'</p><p>'+d.desc+'</p><div class="metric-row">';
    for(var j=0;j<d.metrics.length;j++){
      var m=d.metrics[j];
      cards+='<div class="metric '+(m.s||'')+'"><span>'+m.l+'</span><b>'+m.v+'</b></div>';
    }
    cards+='</div></div>';
  }
  document.getElementById('drillNav').innerHTML=nav;
  document.getElementById('drillCards').innerHTML=cards;
  if(engine) engine.setDrill(state.drill);
}

function bindCards(id){
  document.getElementById(id).addEventListener('click',function(e){
    var c=e.target.closest('.fcard'); if(c) c.classList.toggle('open');
  });
}

function initReveal(){
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(en){ if(en.isIntersecting) en.target.classList.add('visible'); });
  },{threshold:0.1,rootMargin:'0px 0px -30px 0px'});
  document.querySelectorAll('.reveal').forEach(function(el){ obs.observe(el); });
}

function initCounters(){
  document.querySelectorAll('[data-count]').forEach(function(el){
    var target=parseInt(el.getAttribute('data-count'),10);
    var obs=new IntersectionObserver(function(entries){
      if(!entries[0].isIntersecting) return;
      var cur=0, step=Math.ceil(target/40);
      var iv=setInterval(function(){
        cur+=step; if(cur>=target){cur=target;clearInterval(iv);}
        el.textContent=cur;
      },30);
      obs.disconnect();
    },{threshold:0.5});
    obs.observe(el);
  });
}

function initRig(){
  document.getElementById('rigLegend').addEventListener('click',function(e){
    var btn=e.target.closest('.lg'); if(!btn) return;
    document.querySelectorAll('#rigLegend .lg').forEach(function(b){b.classList.remove('active');});
    btn.classList.add('active');
    var layer=btn.getAttribute('data-layer');
    ['layer-oh','layer-el','layer-ball'].forEach(function(id){
      var el=document.getElementById(id);
      if(!el) return;
      if(layer==='all'||layer===id.replace('layer-','')) el.classList.remove('fade-layer');
      else el.classList.add('fade-layer');
    });
  });
  document.getElementById('rigSvg').innerHTML=
    '<svg viewBox="0 0 760 400" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">'+
    '<defs><filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>'+
    '<polygon points="240,120 672,320 456,380 24,180" fill="#11151b" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>'+
    '<g id="layer-oh"><polygon points="240,120 475,230 259,320 24,180" fill="#C8102E" opacity="0.12"/>'+
    '<polygon points="437,210 672,320 456,380 221,290" fill="#C8102E" opacity="0.12"/>'+
    '<polygon points="437,210 475,230 259,320 221,290" fill="#FFD700" opacity="0.14"/>'+
    '<rect x="229" y="55" width="22" height="14" rx="3" fill="#060a12" stroke="#C8102E" stroke-width="2" filter="url(#glow)"/>'+
    '<rect x="445" y="163" width="22" height="14" rx="3" fill="#060a12" stroke="#C8102E" stroke-width="2" filter="url(#glow)"/>'+
    '<text x="258" y="52" font-size="14" font-weight="700" fill="#C8102E">OH-1</text><text x="474" y="160" font-size="14" font-weight="700" fill="#C8102E">OH-2</text></g>'+
    '<g stroke="rgba(245,245,247,0.4)" stroke-width="1.5" fill="none"><polygon points="240,120 672,320 456,380 24,180"/><line x1="456" y1="240" x2="240" y2="320"/></g>'+
    '<g id="layer-el"><polygon points="79,68 456,169 240,267" fill="#00D4FF" opacity="0.1"/>'+
    '<polygon points="617,328 456,169 240,267" fill="#00D4FF" opacity="0.1"/>'+
    '<rect x="68" y="60" width="22" height="14" rx="3" fill="#060a12" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>'+
    '<rect x="606" y="314" width="22" height="14" rx="3" fill="#060a12" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>'+
    '<text x="79" y="52" font-size="14" font-weight="700" fill="#00D4FF" text-anchor="middle">EL-1</text><text x="640" y="332" font-size="14" font-weight="700" fill="#00D4FF">EL-2</text></g>'+
    '<g id="layer-ball"><path d="M540,368 Q400,100 288,182" fill="none" stroke="#FFD700" stroke-width="2.2" stroke-dasharray="2 8"/>'+
    '<circle cx="394" cy="179" r="7" fill="#FFD700" filter="url(#glow)"/></g></svg>';
}

function loop(){
  if(engine) engine.render();
  if(heroEngine) heroEngine.render();
  raf=requestAnimationFrame(loop);
}

function init(){
  var canvas=document.getElementById('drillCanvas');
  var heroCanvas=document.getElementById('heroCanvas');
  if(canvas){ engine=new CourtEngine(canvas); engine.setDrill(state.drill); }
  if(heroCanvas){ heroEngine=new HeroEngine(heroCanvas); }
  renderModeUI(); renderSkillUI(); renderDrillUI(); initRig(); initReveal(); initCounters();
  bindCards('modeFeatures'); bindCards('skillGrid');
  loop();

  document.getElementById('modeTabs').addEventListener('click',function(e){
    var t=e.target.closest('.mode-tab'); if(!t) return;
    state.mode=t.getAttribute('data-mode'); renderModeUI();
  });
  document.getElementById('skillChips').addEventListener('click',function(e){
    var c=e.target.closest('.fc'); if(!c) return;
    state.cat=c.getAttribute('data-cat'); renderSkillUI();
  });
  document.getElementById('drillNav').addEventListener('click',function(e){
    var b=e.target.closest('.drill-btn'); if(!b) return;
    state.drill=b.getAttribute('data-drill'); renderDrillUI();
    document.querySelectorAll('.drill-card').forEach(function(c){
      c.classList.toggle('active', c.getAttribute('data-drill')===state.drill);
    });
  });
  document.getElementById('drillCards').addEventListener('click',function(e){
    var card=e.target.closest('.drill-card'); if(!card) return;
    state.drill=card.getAttribute('data-drill'); renderDrillUI();
    document.querySelectorAll('.drill-btn').forEach(function(b){
      b.classList.toggle('active', b.getAttribute('data-drill')===state.drill);
    });
  });

  var nav=document.querySelector('nav');
  window.addEventListener('scroll',function(){
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
else init();
})();
