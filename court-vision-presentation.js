(function(){
  'use strict';

  /* ── Data from Coach Feature Explorer ── */
  var MODE_ORDER = ['practice','skill','clinic','eval','scout','showcase','load','remote'];
  var MODES = {
    practice:{icon:'🏐',name:'Practice Mode',tag:'Run the gym, not the clipboard.',
      b:'Tap start, athletes check in, pick today\'s emphasis.',
      d:'Live pass and sideout stats by rotation on the courtside screen; scrimmage rallies auto-tagged as they happen.',
      a:'Report and clip reel land in your inbox before the gym empties.'},
    skill:{icon:'🎯',name:'Skill Session',tag:'The rep is the unit of work.',
      b:'Pick a drill — its delay preset and scoring rubric load themselves.',
      d:'Athlete sees position-augmented replay seconds after each rep; live drill score on the screen.',
      a:'Session report card per athlete with the best and most instructive clips.'},
    clinic:{icon:'🎓',name:'Coaching Clinic',tag:'Teach the drill, show the proof.',
      b:'Queue drills from the library: setup diagram, demo clip, cues, rubric.',
      d:'Demonstrations run with live overlays — coverage polygons, target windows — and you telestrate on delayed video.',
      a:'Exportable clinic packet; attendees leave with the curriculum.'},
    eval:{icon:'📊',name:'Player Evaluation',tag:'Same test, every time, verified.',
      b:'Load the standardized battery and check athletes in.',
      d:'Touch height, serve speed, passing gauntlet, lane execution — measured automatically while evaluators just watch.',
      a:'Longitudinal athlete report; percentile context grows with every event.'},
    scout:{icon:'🔍',name:'Scrimmage & Match Scouting',tag:'Tendencies for both sides of the net.',
      b:'Start capture — no manual charting, no camera operator.',
      d:'Auto rally tagging builds rotation sideout data, hitter tendencies, and serve targets live.',
      a:'Rotation-by-rotation scouting report — yours and theirs.'},
    showcase:{icon:'⭐',name:'Showcase & Recruiting',tag:'Verified numbers, automatic highlights.',
      b:'Athletes check in once at the door.',
      d:'Every measurable is captured under identical, documented conditions.',
      a:'Verified metric sheet plus an auto-built highlight reel per athlete.'},
    load:{icon:'🦵',name:'Jump Load & Readiness',tag:'Intervene at the whisper, not the scream.',
      b:'Nothing to wear, nothing to charge — it rides on tracking you already run.',
      d:'Every jump counted and measured for every athlete, all session long.',
      a:'Load trends and rising-load flags per athlete — before knees complain.'},
    remote:{icon:'☁️',name:'Remote Review',tag:'The gym follows you home.',
      b:'Clips and stats sync to the cloud after sessions.',
      d:'Tag moments and leave timestamped feedback from anywhere.',
      a:'Athletes get homework clips; staff stays aligned between sessions.'}
  };

  var FEATS = [
    {n:'Block Coverage Map',c:'Block',m:['practice','skill','clinic','eval','scout'],
     b:'Projects your block\'s shadow onto the opponent floor at every attack contact.',
     g:'A coverage % for every block, drawn on the replay.',
     d:'Pull every attack against your middle from today: she covers 41% on line sets, but when the set goes fast cross, coverage drops to 24% and the line opens — now footwork has a target.'},
    {n:'Seam Detector',c:'Block',m:['practice','skill','clinic','scout'],
     b:'Measures the gap between blockers\' hands in centimeters and shows the floor zone it exposes.',
     g:'"Close the seam" becomes a number, not a feeling.',
     d:'Your pin and middle averaged a 38 cm seam in rotation 4 — the exposed zone behind it ate six kills this scrimmage, all visible through the same window on replay.'},
    {n:'Block Timing & Penetration',c:'Block',m:['practice','skill','clinic','eval'],
     b:'Timing offset versus attacker contact (ms early or late) and reach over the net (cm), every jump.',
     g:'Separates late hands from short hands instantly.',
     d:'Film says the block looks beaten; data says hands arrive 90 ms early and drift on the way down — the fix is patience, not speed.'},
    {n:'Hitting Lane Report',c:'Attack',m:['practice','skill','clinic','scout'],
     b:'At contact: % of line open, % of cross open, exposed tip zones — given the block and defense actually present.',
     g:'The truth about what your hitters were given.',
     d:'OH1 saw a wide-open line on 9 swings tonight and took 2 of them. That conversation now starts with a picture instead of a memory.'},
    {n:'Read Grade',c:'Attack',m:['practice','skill','clinic','eval','scout'],
     b:'Compares the shot chosen against the best lane available — 0-100 per swing, alternatives drawn on replay.',
     g:'Coach the decision, not just the swing.',
     d:'Read Grade 86 on a kill into a closing seam versus Read Grade 31 on a kill down a defended line — both points tonight, very different futures.'},
    {n:'Execution Grade',c:'Attack',m:['practice','skill','eval'],
     b:'Separate from the read: did the ball go where the swing aimed, at what contact height and speed?',
     g:'Right read with missed execution vs wrong read that got lucky — finally separable.',
     d:'Her reads average 78 but execution into zone 5 sits at 52 with contact 14 cm lower than her line shots — that\'s a toss-and-reach session, not a vision problem.'},
    {n:'Hitter Tendency Heat Maps',c:'Attack',m:['practice','scout','showcase','remote'],
     b:'Shot charts per hitter by set type, rotation, and pass quality — built automatically from every rally.',
     g:'Your scouting report writes itself. So does theirs on you.',
     d:'The opposing outside goes cross 81% of the time out-of-system. Set your block\'s default and make her beat you down the line.'},
    {n:'Auto Pass Ratings (3-2-1-0)',c:'Pass',m:['practice','skill','clinic','eval'],
     b:'Every first contact graded live on the standard scale against your setter\'s target window.',
     g:'Pass charts with zero clipboard time.',
     d:'By the water break: team 2.18, libero 2.40, by rotation and serve type — and you didn\'t write down a single number.'},
    {n:'Live Rotation Pass Stats',c:'Pass',m:['practice','scout'],
     b:'Team and per-passer averages by rotation, serve type, and serve origin — on the courtside screen as it happens.',
     g:'See the leak while you can still fix it.',
     d:'Rotation 2 against floats from zone 1: 1.6 average. Slide your libero one seam over and let the next ten serves answer.'},
    {n:'Target Window & Drift Maps',c:'Pass',m:['practice','skill','eval'],
     b:'Delivery percentage into the setter window, plus the pattern of every miss.',
     g:'Shows the systematic miss your eye averages away.',
     d:'He\'s not a bad passer — he\'s a tight-and-right passer. Every miss leaks the same direction, which means it\'s a platform angle, which means it\'s coachable.'},
    {n:'Reception Formation Conformance',c:'Pass',m:['practice','clinic','scout'],
     b:'Your planned serve-receive shape versus the shape actually on the floor at serve contact, plus who owns seam balls.',
     g:'Proof of whether the system you taught is the system being run.',
     d:'You installed a four-person W on Monday; by Thursday the right seam has drifted 1.1 m. Now you know before the weekend, not after it.'},
    {n:'Set Location & Tempo Chain',c:'Set',m:['practice','skill','eval'],
     b:'Set error to each hitter\'s window in cm, apex height, and the pass-to-set-to-attack timing chain.',
     g:'Offensive speed becomes a measured, trainable number.',
     d:'Your quick tempo runs 1.18 s pass-to-attack; the team that beat you runs 1.02. The gap now has a drill plan.'},
    {n:'Distribution Intelligence',c:'Set',m:['practice','scout','remote'],
     b:'Who gets set, against which block, on which pass quality — and how predictable it becomes under pressure.',
     g:'See your offense the way scouts see it.',
     d:'After 20 points your setter feeds the left pin 74% of the time. Opponents have noticed. Now you have too.'},
    {n:'Serve Speed & Target',c:'Serve',m:['practice','skill','eval','showcase'],
     b:'Speed, flight class, and landing versus the called target zone for every serve.',
     g:'Verified serve numbers without holding a radar gun.',
     d:'Target hit rate on zone 1 calls: 64% at 71 km/h, 38% at 78. Risk-versus-reward is now her decision to own, with data.'},
    {n:'Serve Pressure Index',c:'Serve',m:['practice','eval','scout'],
     b:'Servers graded on effect — passers pulled off the net, out-of-system forced, ace-to-error ratio.',
     g:'Rewards the serve that wrecks an offense, not just the ace.',
     d:'Your lowest-velocity server carries the highest pressure index on the roster. Lineup decision, changed.'},
    {n:'Base-to-Read Conformance',c:'Defense',m:['practice','clinic','eval'],
     b:'Distance from each defender to their system assignment at attack contact, in centimeters.',
     g:'"Be in position" becomes verifiable.',
     d:'Middle-back is 1.4 m off the line assignment on cross sets — the tip keeps landing in the same hole, and now everyone can see exactly why.'},
    {n:'Dig Quality & First Step',c:'Defense',m:['practice','skill','eval'],
     b:'First-step reaction time after attack contact plus dig-to-target grading on the 3-scale.',
     g:'Separates slow feet from wrong reads.',
     d:'Her first step is elite at 0.21 s but dig target sits at 1.3 — the feet are fine; platform direction is the session.'},
    {n:'Drill Builder & Library',c:'Drills',m:['practice','skill','clinic'],
     b:'Draw zones on the court map, set measurable success criteria, attach demo clips and cues — stored, versioned, searchable.',
     g:'Your drill knowledge becomes an asset that outlives the season.',
     d:'Every drill carries its own diagram, demo, and rubric — a new assistant can run Tuesday\'s session exactly the way you would.'},
    {n:'Auto-Scored Drills',c:'Drills',m:['practice','skill','clinic','eval'],
     b:'The system referees your drill\'s criteria live: scoreboard on screen, optional audio cue, rep-by-rep log, 0-100 Drill Score.',
     g:'You coach the rep; the system counts it.',
     d:'Serve-receive triplets: the target window lights green on success, and athletes compete with the screen instead of arguing the count.'},
    {n:'Drill Recommendations',c:'Drills',m:['practice','skill','remote'],
     b:'Measured deficiencies prescribe the next drill at the right difficulty — with the data that triggered it cited.',
     g:'A practice plan that starts from evidence.',
     d:'Low cross-court coverage from your middle auto-suggests the seam-footwork progression and shows the eight swings that justify it.'},
    {n:'Position-Augmented Video Delay',c:'Feedback',m:['practice','skill','clinic'],
     b:'Any feed, delayed 3-60 s on a courtside screen — with skeleton, position trail, target zones, and ball path drawn on the clip.',
     g:'Athletes coach themselves between reps.',
     d:'The blocker lands, walks three steps, and watches her own seam open in slow motion — with the line she should have held drawn on the floor. You never said a word.'},
    {n:'Auto-Clipping',c:'Feedback',m:['practice','skill','eval','scout','showcase','remote'],
     b:'Every rep and rally becomes a clip tagged with athlete, drill, scores, and events — automatically, searchable forever.',
     g:'All of the film, none of the filming.',
     d:'"Show me every rotation-4 sideout from March" is a search, not a Saturday.'},
    {n:'Split-View Compare',c:'Feedback',m:['skill','clinic','remote'],
     b:'This rep beside the athlete\'s personal best or a model demo, time-aligned at the moment of contact.',
     g:'The fastest feel-versus-real conversation in coaching.',
     d:'Tonight\'s approach next to her best jump from October, synced at the plant — the shortened second step is undeniable in one viewing.'},
    {n:'Rotation Analytics',c:'Team',m:['practice','scout','remote'],
     b:'Sideout % and point-score % by rotation, rally length profiles, lineup and substitution impact.',
     g:'Know exactly where your match is leaking points.',
     d:'You\'re +9 in rotation 1 and -11 in rotation 5 across the last four scrimmages. Practice plans itself.'},
    {n:'Jump Count & Height Trends',c:'Load',m:['practice','load','remote'],
     b:'Every jump counted and measured for every athlete, from tracking you\'re already running — nothing to wear or charge.',
     g:'A free vertical-load monitor on the whole roster.',
     d:'Your middle logged 142 jumps Tuesday against a season median of 96 — visible the same night, not after the knee complains.'},
    {n:'Rising-Load Flags',c:'Load',m:['load','practice','remote'],
     b:'Alerts when an athlete\'s jump volume or landing frequency spikes against their own baseline.',
     g:'Intervene at the whisper, not the scream.',
     d:'Week-over-week jump load up 38% for one athlete during a tournament block — the flag arrives while the fix is still a rest day, not a rehab plan.'},
    {n:'Session Load Summary',c:'Load',m:['practice','load'],
     b:'Per-athlete jump and touch totals stamped into every post-practice report.',
     g:'Load awareness with zero extra workflow.',
     d:'The report you already get now ends with who jumped the most — and who quietly didn\'t.'},
    {n:'Verified Combine Metrics',c:'Feedback',m:['eval','showcase'],
     b:'Approach touch, block touch, serve speed, pass average — captured under identical, documented conditions every event.',
     g:'Numbers recruiters can actually trust.',
     d:'Every athlete\'s sheet states how, where, and when it was measured — the same way, every single time.'}
  ];

  var CATS = ['All','Block','Attack','Pass','Set','Serve','Defense','Drills','Feedback','Team','Load'];
  var state = { mode:'practice', cat:'All' };

  /* ── Drill demo definitions ── */
  var DRILLS = [
    {id:'pass',label:'Serve-Receive',title:'Auto-Scored Pass Drill',
     desc:'Target window lights green when the pass lands in the setter zone. Live 3-2-1-0 rating on every rep — athletes compete with the screen.',
     metrics:['Pass: 3','Window: ✓','Drill Score: 87'],
     metricClass:['good','good','good']},
    {id:'block',label:'Block Coverage',title:'Block Coverage Map',
     desc:'The system projects your block shadow onto the opponent floor at contact. Coverage % updates live — footwork targets become visible.',
     metrics:['Coverage: 41%','Seam: 38 cm','Timing: -90 ms'],
     metricClass:['warn','bad','warn']},
    {id:'read',label:'Read Grade',title:'Hitting Lane & Read Grade',
     desc:'Open lanes drawn on replay at contact. Read Grade compares the shot chosen vs the best available option.',
     metrics:['Line open: 78%','Read Grade: 31','Cross taken: ✗'],
     metricClass:['good','bad','bad']},
    {id:'seam',label:'Seam Close',title:'Seam Detector Drill',
     desc:'Gap between blockers measured in centimeters. Exposed floor zone highlighted — "close the seam" becomes a number.',
     metrics:['Seam: 22 cm','Target: <15 cm','Reps: 12/15'],
     metricClass:['warn','','good']},
    {id:'delay',label:'Video Delay',title:'Position-Augmented Delay',
     desc:'3-60 s delayed replay with skeleton overlay, position trails, and target zones. Athletes self-correct between reps.',
     metrics:['Delay: 8 s','Skeleton: on','Zones: on'],
     metricClass:['','','']},
    {id:'serve',label:'Serve Target',title:'Serve Speed & Target',
     desc:'Every serve tracked for speed, flight class, and landing vs called zone. Verified numbers without a radar gun.',
     metrics:['Speed: 71 km/h','Zone 1: ✓','Hit rate: 64%'],
     metricClass:['','good','good']}
  ];

  var activeDrill = 'pass';
  var drillTimer = null;
  var drillFrame = 0;

  function countFor(mode){
    var c = 0;
    for (var i = 0; i < FEATS.length; i++) if (FEATS[i].m.indexOf(mode) > -1) c++;
    return c;
  }

  function featCard(f){
    return '<div class="fcard">' +
      '<div class="fcat">' + f.c + '</div>' +
      '<h3>' + f.n + '</h3>' +
      '<p class="fblurb">' + f.b + '</p>' +
      '<p class="fgives"><b>Gives you</b> — ' + f.g + '</p>' +
      '<div class="fdetail"><b style="color:var(--gold);font-size:10px;letter-spacing:.15em;text-transform:uppercase">In your gym</b><br>' + f.d + '</div>' +
    '</div>';
  }

  function filteredFeats(mode, cat){
    var list = [];
    for (var i = 0; i < FEATS.length; i++){
      var f = FEATS[i];
      if (f.m.indexOf(mode) > -1 && (cat === 'All' || f.c === cat)) list.push(f);
    }
    return list;
  }

  function renderModeTabs(){
    var h = '';
    for (var i = 0; i < MODE_ORDER.length; i++){
      var k = MODE_ORDER[i], md = MODES[k];
      h += '<button class="mode-tab' + (state.mode === k ? ' active' : '') + '" data-mode="' + k + '">' +
        md.icon + ' ' + md.name + ' (' + countFor(k) + ')</button>';
    }
    document.getElementById('modeTabs').innerHTML = h;
  }

  function renderModeBanner(){
    var md = MODES[state.mode];
    document.getElementById('modeBanner').innerHTML =
      '<h2>' + md.icon + ' ' + md.name + '</h2>' +
      '<div class="tag">' + md.tag + '</div>' +
      '<div class="bda">' +
        '<div class="step"><b>Before</b><span>' + md.b + '</span></div>' +
        '<div class="step"><b>During</b><span>' + md.d + '</span></div>' +
        '<div class="step"><b>After</b><span>' + md.a + '</span></div>' +
      '</div>';
  }

  function renderModeFeatures(){
    var list = filteredFeats(state.mode, 'All');
    document.getElementById('modeCount').innerHTML =
      '<b>' + list.length + '</b> features power <b>' + MODES[state.mode].name + '</b> — tap any card for a gym-floor example.';
    var h = '';
    for (var j = 0; j < list.length; j++) h += featCard(list[j]);
    document.getElementById('modeFeatures').innerHTML = h || '<p class="count">No features in this mode.</p>';
  }

  function renderSkillChips(){
    var h = '';
    for (var i = 0; i < CATS.length; i++){
      h += '<button class="fc' + (state.cat === CATS[i] ? ' active' : '') + '" data-cat="' + CATS[i] + '">' + CATS[i] + '</button>';
    }
    document.getElementById('skillChips').innerHTML = h;
  }

  function renderSkillGrid(){
    var list = [];
    for (var i = 0; i < FEATS.length; i++){
      var f = FEATS[i];
      if (state.cat === 'All' || f.c === state.cat) list.push(f);
    }
    document.getElementById('skillCount').innerHTML =
      '<b>' + list.length + '</b> of ' + FEATS.length + ' features' +
      (state.cat === 'All' ? '' : ' in <b>' + state.cat + '</b>') + ' — tap for gym examples.';
    var h = '';
    for (var j = 0; j < list.length; j++) h += featCard(list[j]);
    document.getElementById('skillGrid').innerHTML = h;
  }

  function bindCardToggle(containerId){
    document.getElementById(containerId).addEventListener('click', function(e){
      var card = e.target.closest('.fcard');
      if (card) card.classList.toggle('open');
    });
  }

  /* ── Hero court animation ── */
  function renderHeroCourt(){
    document.getElementById('heroCourt').innerHTML =
      '<svg viewBox="0 0 400 360" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><filter id="glow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
      '<rect width="400" height="360" fill="#0a0e14"/>' +
      '<polygon points="80,60 320,60 320,300 80,300" fill="#11151b" stroke="rgba(245,245,247,.35)" stroke-width="1.5"/>' +
      '<line x1="200" y1="60" x2="200" y2="300" stroke="rgba(245,245,247,.5)" stroke-width="1.2"/>' +
      '<line x1="80" y1="180" x2="320" y2="180" stroke="rgba(245,245,247,.2)" stroke-dasharray="4 4"/>' +
      '<ellipse id="heroTarget" cx="260" cy="200" rx="28" ry="18" fill="rgba(52,199,89,.15)" stroke="#34C759" stroke-width="1.5" opacity=".4">' +
        '<animate attributeName="opacity" values=".25;.7;.25" dur="2s" repeatCount="indefinite"/>' +
      '</ellipse>' +
      '<text x="260" y="204" text-anchor="middle" fill="#34C759" font-size="9" font-weight="700">SETTER WINDOW</text>' +
      '<circle id="heroBall" cx="120" cy="80" r="6" fill="#E8C547" filter="url(#glow)">' +
        '<animate attributeName="cx" values="120;260;260" dur="2.8s" repeatCount="indefinite"/>' +
        '<animate attributeName="cy" values="80;200;200" dur="2.8s" repeatCount="indefinite"/>' +
        '<animate attributeName="opacity" values="0;1;1;0" dur="2.8s" repeatCount="indefinite"/>' +
      '</circle>' +
      '<path d="M120,80 Q190,140 260,200" fill="none" stroke="#E8C547" stroke-width="1.5" stroke-dasharray="4 6" opacity=".5">' +
        '<animate attributeName="stroke-dashoffset" from="40" to="0" dur="2.8s" repeatCount="indefinite"/>' +
      '</path>' +
      '<g opacity=".85">' +
        '<circle cx="240" cy="220" r="5" fill="#f5f5f7"/><text x="252" y="224" fill="#86868b" font-size="9">OH</text>' +
        '<circle cx="280" cy="240" r="5" fill="#f5f5f7"/>' +
        '<circle cx="220" cy="250" r="5" fill="#f5f5f7"/>' +
        '<circle cx="160" cy="120" r="5" fill="#DA7756"/><text x="172" y="124" fill="#DA7756" font-size="9">Server</text>' +
      '</g>' +
      '<rect x="12" y="12" width="110" height="52" rx="8" fill="rgba(0,0,0,.6)" stroke="rgba(255,255,255,.12)"/>' +
      '<text x="22" y="30" fill="#86868b" font-size="9" font-weight="700">LIVE PASS RATING</text>' +
      '<text x="22" y="50" fill="#34C759" font-size="18" font-weight="800">3</text>' +
      '<text x="48" y="50" fill="#86868b" font-size="11">/ window hit</text>' +
      '<rect x="278" y="12" width="110" height="52" rx="8" fill="rgba(0,0,0,.6)" stroke="rgba(255,255,255,.12)"/>' +
      '<text x="288" y="30" fill="#86868b" font-size="9" font-weight="700">TEAM AVG</text>' +
      '<text x="288" y="50" fill="#4FB8C9" font-size="18" font-weight="800">2.18</text>' +
      '</svg>';
  }

  /* ── Drill canvas animations ── */
  function courtBase(){
    return '<rect width="100%" height="100%" fill="#0a0e14"/>' +
      '<polygon points="50,40 350,40 350,260 50,260" fill="#11151b" stroke="rgba(245,245,247,.3)" stroke-width="1.2"/>' +
      '<line x1="200" y1="40" x2="200" y2="260" stroke="rgba(245,245,247,.45)" stroke-width="1"/>';
  }

  function drillSvg(id, frame){
    var f = frame % 120;
    var svg = '<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">' + courtBase();

    if (id === 'pass'){
      var hit = f > 60 && f < 100;
      var bx = f < 60 ? 80 + f * 2.5 : 240;
      var by = f < 60 ? 50 + f * 1.2 : 155;
      svg += '<ellipse cx="240" cy="155" rx="32" ry="20" fill="rgba(52,199,89,' + (hit ? '.35' : '.12') + ')" stroke="' + (hit ? '#34C759' : 'rgba(52,199,89,.4)') + '" stroke-width="1.5"/>' +
        '<text x="240" y="159" text-anchor="middle" fill="#34C759" font-size="8" font-weight="700">TARGET</text>' +
        '<circle cx="' + bx + '" cy="' + by + '" r="5" fill="#E8C547"/>' +
        (hit ? '<text x="280" y="100" fill="#34C759" font-size="22" font-weight="800">3</text>' : '') +
        '<circle cx="230" cy="175" r="4" fill="#f5f5f7"/><circle cx="260" cy="190" r="4" fill="#f5f5f7"/>';
    }

    if (id === 'block'){
      var cov = 0.24 + 0.2 * Math.sin(f / 15);
      svg += '<rect x="210" y="100" width="' + (80 * cov) + '" height="50" fill="rgba(218,119,86,.25)" stroke="#DA7756" stroke-width="1"/>' +
        '<text x="250" y="130" text-anchor="middle" fill="#DA7756" font-size="11" font-weight="700">' + Math.round(cov * 100) + '% COVERED</text>' +
        '<circle cx="195" cy="95" r="5" fill="#f5f5f7"/><circle cx="215" cy="95" r="5" fill="#f5f5f7"/>' +
        '<line x1="195" y1="90" x2="215" y2="90" stroke="#ff6b6b" stroke-width="2"/>' +
        '<text x="205" y="82" text-anchor="middle" fill="#ff6b6b" font-size="8">38cm SEAM</text>' +
        '<path d="M300,200 L' + (240 + 40 * Math.sin(f/20)) + ',120" stroke="#E8C547" stroke-width="1.5" stroke-dasharray="3 4"/>' +
        '<circle cx="300" cy="200" r="4" fill="#E8C547"/>';
    }

    if (id === 'read'){
      var open = f < 70;
      svg += '<rect x="280" y="110" width="55" height="70" fill="rgba(52,199,89,' + (open ? '.3' : '.08') + ')" stroke="#34C759" stroke-width="1.5" stroke-dasharray="' + (open ? '0' : '4 3') + '"/>' +
        '<text x="307" y="150" text-anchor="middle" fill="#34C759" font-size="8">LINE 78%</text>' +
        '<rect x="210" y="130" width="50" height="50" fill="rgba(255,107,107,.15)" stroke="#ff6b6b" stroke-width="1"/>' +
        '<text x="235" y="158" text-anchor="middle" fill="#ff6b6b" font-size="8">DEFENDED</text>' +
        '<line x1="300" y1="200" x2="' + (open ? '307' : '235') + ',155" stroke="#E8C547" stroke-width="2" marker-end="url(#arr)"/>' +
        '<defs><marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#E8C547"/></marker></defs>' +
        '<text x="50" y="30" fill="#ff6b6b" font-size="20" font-weight="800">Read: ' + (open ? '86' : '31') + '</text>';
    }

    if (id === 'seam'){
      var gap = 38 - Math.min(26, f * 0.4);
      svg += '<circle cx="' + (200 - gap/2) + '" cy="95" r="5" fill="#f5f5f7"/>' +
        '<circle cx="' + (200 + gap/2) + '" cy="95" r="5" fill="#f5f5f7"/>' +
        '<line x1="' + (200 - gap/2) + '" y1="88" x2="' + (200 + gap/2) + '" y2="88" stroke="' + (gap < 18 ? '#34C759' : '#ff6b6b') + '" stroke-width="3"/>' +
        '<text x="200" y="78" text-anchor="middle" fill="' + (gap < 18 ? '#34C759' : '#ff6b6b') + '" font-size="10" font-weight="700">' + Math.round(gap) + ' cm</text>' +
        '<rect x="185" y="115" width="30" height="40" fill="rgba(255,107,107,.2)" stroke="#ff6b6b" stroke-width="1" opacity=".7"/>' +
        '<text x="200" y="170" text-anchor="middle" fill="#86868b" font-size="8">EXPOSED ZONE</text>';
    }

    if (id === 'delay'){
      var alpha = 0.4 + 0.3 * Math.sin(f / 10);
      svg += '<circle cx="220" cy="130" r="4" fill="#f5f5f7"/>' +
        '<line x1="220" y1="134" x2="220" y2="160" stroke="#4FB8C9" stroke-width="2" opacity="' + alpha + '"/>' +
        '<line x1="220" y1="145" x2="235" y2="138" stroke="#4FB8C9" stroke-width="2" opacity="' + alpha + '"/>' +
        '<line x1="220" y1="145" x2="205" y2="150" stroke="#4FB8C9" stroke-width="2" opacity="' + alpha + '"/>' +
        '<line x1="220" y1="160" x2="212" y2="185" stroke="#4FB8C9" stroke-width="2" opacity="' + alpha + '"/>' +
        '<line x1="220" y1="160" x2="228" y2="185" stroke="#4FB8C9" stroke-width="2" opacity="' + alpha + '"/>' +
        '<polyline points="220,130 210,120 230,118 220,130" fill="none" stroke="#4FB8C9" stroke-width="1.5" opacity="' + alpha + '"/>' +
        '<rect x="280" y="50" width="100" height="60" rx="6" fill="rgba(0,0,0,.7)" stroke="rgba(255,255,255,.15)"/>' +
        '<text x="290" y="68" fill="#86868b" font-size="8">DELAY 8s</text>' +
        '<text x="290" y="88" fill="#4FB8C9" font-size="9">▶ REPLAY</text>' +
        '<path d="M200,100 Q240,60 280,100" fill="none" stroke="#E8C547" stroke-width="1" stroke-dasharray="3 4" opacity=".6"/>';
    }

    if (id === 'serve'){
      var t = f / 120;
      var sx = 80 + t * 200;
      var sy = 220 - Math.sin(t * Math.PI) * 120;
      svg += '<rect x="260" y="50" width="40" height="30" fill="rgba(232,197,71,.15)" stroke="#E8C547" stroke-width="1"/>' +
        '<text x="280" y="70" text-anchor="middle" fill="#E8C547" font-size="7">ZONE 1</text>' +
        '<circle cx="' + sx + '" cy="' + sy + '" r="5" fill="#E8C547"/>' +
        '<text x="50" y="30" fill="#E8C547" font-size="14" font-weight="700">71 km/h</text>' +
        (t > 0.85 ? '<text x="280" y="100" fill="#34C759" font-size="16" font-weight="800">✓ HIT</text>' : '');
    }

    svg += '</svg>';
    return svg;
  }

  function renderDrillNav(){
    var h = '';
    for (var i = 0; i < DRILLS.length; i++){
      var d = DRILLS[i];
      h += '<button class="drill-btn' + (activeDrill === d.id ? ' active' : '') + '" data-drill="' + d.id + '">' + d.label + '</button>';
    }
    document.getElementById('drillNav').innerHTML = h;
  }

  function renderDrillInfo(){
    var d = null;
    for (var i = 0; i < DRILLS.length; i++) if (DRILLS[i].id === activeDrill) d = DRILLS[i];
    if (!d) return;
    var pills = '';
    for (var j = 0; j < d.metrics.length; j++){
      pills += '<span class="metric-pill' + (d.metricClass[j] ? ' ' + d.metricClass[j] : '') + '">' + d.metrics[j] + '</span>';
    }
    document.getElementById('drillInfo').innerHTML =
      '<h3>' + d.title + '</h3><p>' + d.desc + '</p><div class="metric-pills">' + pills + '</div>';
  }

  function startDrillLoop(){
    if (drillTimer) clearInterval(drillTimer);
    drillFrame = 0;
    function tick(){
      drillFrame++;
      document.getElementById('drillCanvas').innerHTML = drillSvg(activeDrill, drillFrame);
    }
    tick();
    drillTimer = setInterval(tick, 50);
  }

  /* ── Rig SVG (simplified from rendering doc) ── */
  function renderRigSvg(){
    document.getElementById('rigSvg').innerHTML =
      '<svg viewBox="0 0 760 420" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">' +
      '<polygon points="240,130 672,346 456,454 24,238" fill="#11151b" stroke="rgba(255,255,255,0.10)" stroke-width="1.5"/>' +
      '<g id="layer-oh">' +
        '<polygon points="240,130 475,248 259,356 24,238" fill="#DA7756" opacity="0.10"/>' +
        '<polygon points="437,228 672,346 456,454 221,336" fill="#DA7756" opacity="0.10"/>' +
        '<polygon points="437,228 475,248 259,356 221,336" fill="#E8C547" opacity="0.14"/>' +
        '<rect x="229" y="65" width="22" height="14" rx="3.5" fill="#0a0a0a" stroke="#DA7756" stroke-width="2"/>' +
        '<rect x="445" y="173" width="22" height="14" rx="3.5" fill="#0a0a0a" stroke="#DA7756" stroke-width="2"/>' +
        '<text x="258" y="64" font-size="14" font-weight="700" fill="#DA7756">OH-1</text>' +
        '<text x="474" y="172" font-size="14" font-weight="700" fill="#DA7756">OH-2</text>' +
      '</g>' +
      '<g stroke="rgba(245,245,247,0.45)" stroke-width="1.5" fill="none">' +
        '<polygon points="240,130 672,346 456,454 24,238"/>' +
        '<line x1="456" y1="238" x2="240" y2="346"/>' +
      '</g>' +
      '<g id="layer-el">' +
        '<polygon points="79,78 456,189 240,297" fill="#4FB8C9" opacity="0.10"/>' +
        '<polygon points="617,338 456,189 240,297" fill="#4FB8C9" opacity="0.10"/>' +
        '<rect x="68" y="70" width="22" height="14" rx="3.5" fill="#0a0a0a" stroke="#4FB8C9" stroke-width="2"/>' +
        '<rect x="606" y="334" width="22" height="14" rx="3.5" fill="#0a0a0a" stroke="#4FB8C9" stroke-width="2"/>' +
        '<text x="79" y="60" font-size="14" font-weight="700" fill="#4FB8C9" text-anchor="middle">EL-1</text>' +
        '<text x="640" y="352" font-size="14" font-weight="700" fill="#4FB8C9">EL-2</text>' +
      '</g>' +
      '<g id="layer-ball">' +
        '<path d="M540,448 Q400,120 288,202" fill="none" stroke="#E8C547" stroke-width="2.2" stroke-dasharray="2 8"/>' +
        '<circle cx="394" cy="199" r="7" fill="#E8C547"/>' +
        '<text x="24" y="402" font-size="16" font-weight="700" fill="#E8C547">3D BALL TRACK</text>' +
      '</g>' +
      '</svg>';
  }

  function bindRigLegend(){
    var map = { oh:'layer-oh', el:'layer-el', ball:'layer-ball' };
    document.getElementById('rigLegend').addEventListener('click', function(e){
      var btn = e.target.closest('.lg');
      if (!btn) return;
      document.querySelectorAll('#rigLegend .lg').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      var layer = btn.getAttribute('data-layer');
      Object.keys(map).forEach(function(k){
        var el = document.getElementById(map[k]);
        if (!el) return;
        if (layer === 'all' || layer === k) el.classList.remove('fade-layer');
        else el.classList.add('fade-layer');
      });
    });
  }

  /* ── Scroll reveal ── */
  function initReveal(){
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting) en.target.classList.add('visible');
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function(el){ obs.observe(el); });
  }

  /* ── Init ── */
  function init(){
    renderHeroCourt();
    renderModeTabs();
    renderModeBanner();
    renderModeFeatures();
    renderSkillChips();
    renderSkillGrid();
    renderDrillNav();
    renderDrillInfo();
    startDrillLoop();
    renderRigSvg();
    bindRigLegend();
    bindCardToggle('modeFeatures');
    bindCardToggle('skillGrid');
    initReveal();

    document.getElementById('modeTabs').addEventListener('click', function(e){
      var t = e.target.closest('.mode-tab');
      if (!t) return;
      state.mode = t.getAttribute('data-mode');
      renderModeTabs();
      renderModeBanner();
      renderModeFeatures();
    });

    document.getElementById('skillChips').addEventListener('click', function(e){
      var c = e.target.closest('.fc');
      if (!c) return;
      state.cat = c.getAttribute('data-cat');
      renderSkillChips();
      renderSkillGrid();
    });

    document.getElementById('drillNav').addEventListener('click', function(e){
      var b = e.target.closest('.drill-btn');
      if (!b) return;
      activeDrill = b.getAttribute('data-drill');
      renderDrillNav();
      renderDrillInfo();
      startDrillLoop();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
