#!/usr/bin/env python3
"""Assemble the Sprint Timing — Video Analysis viewer.

Runs the real sprint-timing analysis on a synthetic COM trace (stands in for the
COM tracked from an uploaded clip), embeds the result, and renders a body-only
self-contained HTML: a tracked runner ("video" panel) with virtual split gates,
plus live velocity-time and acceleration-time charts and split/Vmax tiles.
"""
import json
import pathlib

from vuemotion_clone.movement import sprint_timing as S

HERE = pathlib.Path(__file__).parent

# analyse a realistic 40 m sprint (COM trace stands in for video tracking)
t, x, gt = S.synth_sprint(vmax=9.6, tau=1.15, fps=120, dist=40, noise_m=0.012)
r = S.analyze(t, x, fps=120)

# downsample series for a compact, animation-friendly payload (~30 fps)
step = max(1, len(t) // 160)
ser = {k: r["series"][k][::step] for k in ("t", "x", "v", "a")}
DATA = {
    "fps": 30,
    "stride": 2.05,
    "series": ser,
    "model": {"t": r["model"]["model_t"], "v": r["model"]["model_v"], "a": r["model"]["model_a"]},
    "splits": {str(int(k)): round(v, 3) for k, v in r["splits"].items()},
    "summary": {
        "vmax": round(r["vmax_model"], 2), "tau": round(r["model"]["tau"], 2),
        "a0": round(r["a0_model"], 2), "t_to_vmax": round(r["t_to_vmax_s"], 2),
        "power": round(r["max_rel_power"], 0), "distance": round(r["distance_m"], 1),
        "duration": round(r["duration_s"], 2),
    },
}

STYLE = r"""
<style>
  :root{
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    --mono:ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;
    --ground:#f4f6f9;--panel:#fff;--panel-2:#eef1f6;--line:#d9dee7;
    --ink:#1b2430;--ink-dim:#546173;--ink-faint:#8a95a4;--accent:#e8531f;
    --vel:#1f9ec9;--acc:#12a069;--gate:#c98a12;--grid:#e6eaf0;
  }
  @media (prefers-color-scheme:dark){:root{
    --ground:#0d1014;--panel:#14181e;--panel-2:#1a2029;--line:#262e39;
    --ink:#eef2f6;--ink-dim:#93a1b0;--ink-faint:#5f6c7b;--accent:#ff6a3d;
    --vel:#46c3e6;--acc:#34c98a;--gate:#f2b134;--grid:#20272f;}}
  :root[data-theme="light"]{--ground:#f4f6f9;--panel:#fff;--panel-2:#eef1f6;--line:#d9dee7;
    --ink:#1b2430;--ink-dim:#546173;--ink-faint:#8a95a4;--accent:#e8531f;--vel:#1f9ec9;--acc:#12a069;--gate:#c98a12;--grid:#e6eaf0;}
  :root[data-theme="dark"]{--ground:#0d1014;--panel:#14181e;--panel-2:#1a2029;--line:#262e39;
    --ink:#eef2f6;--ink-dim:#93a1b0;--ink-faint:#5f6c7b;--accent:#ff6a3d;--vel:#46c3e6;--acc:#34c98a;--gate:#f2b134;--grid:#20272f;}
  *{box-sizing:border-box}html,body{margin:0;height:100%}
  body{background:var(--ground);color:var(--ink);font-family:var(--sans);font-size:14px}
  .app{display:grid;grid-template-rows:auto 1fr auto;height:100vh}
  .top{display:flex;align-items:center;gap:12px;padding:12px 18px;border-bottom:1px solid var(--line);background:var(--panel)}
  .kx{color:var(--accent);font-family:var(--mono);font-weight:700;font-size:12px;border:1px solid var(--accent);padding:1px 6px;border-radius:5px}
  .top b{font-weight:700}.top .sub{color:var(--ink-faint);font-size:12px}
  .top .src{margin-left:auto;font-size:11px;color:var(--ink-faint);font-family:var(--mono)}
  .main{display:grid;grid-template-columns:1.15fr 1fr;min-height:0}
  .vid{position:relative;min-width:0;background:var(--ground);display:flex;border-right:1px solid var(--line)}
  #stage{width:100%;height:100%;display:block}
  .badge{position:absolute;top:12px;left:14px;display:flex;gap:8px;align-items:center;font-family:var(--mono);font-size:10px;color:var(--ink-dim);background:color-mix(in srgb,var(--panel) 80%,transparent);border:1px solid var(--line);border-radius:6px;padding:4px 9px}
  .rec{width:7px;height:7px;border-radius:50%;background:var(--accent)}
  .right{min-width:0;display:flex;flex-direction:column;overflow-y:auto;background:var(--panel)}
  .tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border-bottom:1px solid var(--line)}
  .tile{background:var(--panel);padding:10px 12px}
  .tile .l{font-family:var(--mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-faint)}
  .tile .v{font-family:var(--mono);font-size:19px;font-weight:700;font-variant-numeric:tabular-nums}
  .tile .v small{font-size:11px;font-weight:500;color:var(--ink-dim)}
  .chartwrap{padding:12px 14px 6px}
  .chartwrap h3{margin:0 0 2px;font-size:12px;font-weight:600;display:flex;justify-content:space-between;align-items:baseline}
  .chartwrap h3 .now{font-family:var(--mono);font-weight:700}
  .chartwrap .cap{font-family:var(--mono);font-size:9.5px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.06em}
  canvas.chart{width:100%;height:120px;display:block}
  .legend{display:flex;gap:14px;font-family:var(--mono);font-size:10px;color:var(--ink-dim);padding:2px 0 0}
  .legend span{display:inline-flex;align-items:center;gap:5px}.legend i{width:14px;height:2px;display:inline-block}
  .splits{padding:10px 14px 14px}
  .splits table{width:100%;border-collapse:collapse;font-family:var(--mono);font-size:12px}
  .splits th{text-align:left;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-faint);font-weight:600;padding-bottom:4px}
  .splits td{padding:3px 0;font-variant-numeric:tabular-nums;border-top:1px solid var(--line)}
  .splits td.d{color:var(--ink-dim)}.splits td.hit{color:var(--gate);font-weight:700}
  .transport{border-top:1px solid var(--line);background:var(--panel);padding:10px 16px;display:flex;align-items:center;gap:14px}
  .btn{background:var(--panel-2);border:1px solid var(--line);color:var(--ink);border-radius:7px;height:32px;min-width:40px;cursor:pointer;font-family:var(--mono)}
  .btn.play{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:700}
  input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:3px;background:var(--line);outline:none;flex:1}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--accent);border:2px solid var(--panel);cursor:pointer}
  .flab{font-family:var(--mono);font-size:11px;color:var(--ink-faint);white-space:nowrap}
  @media (prefers-reduced-motion:reduce){*{transition:none!important}}
  @media (max-width:820px){.main{grid-template-columns:1fr;grid-auto-rows:min-content}.vid{border-right:0;border-bottom:1px solid var(--line);min-height:44vh}}
</style>
"""

MARKUP = r"""
<div class="app">
  <div class="top">
    <span class="kx">FITS·CV</span><b>Sprint Timing</b><span class="sub">acceleration profile from tracked COM · 40 m</span>
    <span class="src">source ▸ analyze_video.py (RTMPose/MediaPipe)</span>
  </div>
  <div class="main">
    <div class="vid">
      <canvas id="stage"></canvas>
      <div class="badge"><span class="rec"></span> tracked pose overlay · virtual gates</div>
    </div>
    <aside class="right">
      <div class="tiles">
        <div class="tile"><div class="l">Max velocity</div><div class="v" id="tVmax">–</div></div>
        <div class="tile"><div class="l">Time → Vmax</div><div class="v" id="tTv">–</div></div>
        <div class="tile"><div class="l">Initial accel</div><div class="v" id="tA0">–</div></div>
        <div class="tile"><div class="l">Max power</div><div class="v" id="tPow">–</div></div>
      </div>
      <div class="chartwrap">
        <h3><span>Velocity–time <span class="cap">m/s</span></span><span class="now" id="vNow" style="color:var(--vel)"></span></h3>
        <canvas class="chart" id="vChart"></canvas>
        <div class="legend"><span><i style="background:var(--vel)"></i>tracked</span><span><i style="background:var(--ink-faint)"></i>model fit v = Vmax(1−e^(−t/τ))</span></div>
      </div>
      <div class="chartwrap">
        <h3><span>Acceleration–time <span class="cap">m/s²</span></span><span class="now" id="aNow" style="color:var(--acc)"></span></h3>
        <canvas class="chart" id="aChart"></canvas>
      </div>
      <div class="splits">
        <table><thead><tr><th>Split</th><th>Time</th><th>Avg v</th></tr></thead><tbody id="splitBody"></tbody></table>
      </div>
    </aside>
  </div>
  <div class="transport">
    <button class="btn" id="restart">⤒</button>
    <button class="btn play" id="play">▶</button>
    <input type="range" id="scrub" min="0" value="0">
    <span class="flab" id="flab"></span>
  </div>
</div>
"""

JS = r"""
<script>
(function(){
  "use strict";
  var D=window.TIMING, S=D.series, N=S.t.length, dur=S.t[N-1];
  var st={i:0,playing:false,last:0};
  function tok(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
  function $(id){return document.getElementById(id);}
  $("scrub").max=N-1;
  $("tVmax").innerHTML=D.summary.vmax+'<small> m/s</small>';
  $("tTv").innerHTML=D.summary.t_to_vmax+'<small> s</small>';
  $("tA0").innerHTML=D.summary.a0+'<small> m/s²</small>';
  $("tPow").innerHTML=D.summary.power+'<small> W/kg</small>';
  // split table
  var splitDists=Object.keys(D.splits).map(Number).sort(function(a,b){return a-b;});
  splitDists.forEach(function(d){
    var tr=document.createElement("tr"); tr.dataset.d=d;
    tr.innerHTML='<td class="d">'+d+' m</td><td class="tm">'+D.splits[d].toFixed(2)+' s</td><td class="av">'+(d/D.splits[d]).toFixed(2)+' m/s</td>';
    $("splitBody").appendChild(tr);
  });

  function line(cvs, xs, ys, color, opts){
    opts=opts||{}; var ctx=cvs.getContext("2d"),dpr=Math.min(2,devicePixelRatio||1);
    var W=cvs.clientWidth,H=cvs.clientHeight; if(cvs.width!==W*dpr){cvs.width=W*dpr;cvs.height=H*dpr;}
    ctx.setTransform(dpr,0,0,dpr,0,0);
    if(!opts.keep) ctx.clearRect(0,0,W,H);
    var pad=6, x0=Math.min.apply(null,xs),x1=Math.max.apply(null,xs);
    var y1=opts.ymax!=null?opts.ymax:Math.max.apply(null,ys), y0=opts.ymin!=null?opts.ymin:0;
    var SX=function(x){return pad+(x-x0)/(x1-x0)*(W-2*pad);};
    var SY=function(y){return H-pad-(y-y0)/(y1-y0)*(H-2*pad);};
    if(opts.grid){ ctx.strokeStyle=tok("--grid"); ctx.lineWidth=1;
      for(var g=1;g<=3;g++){var yy=H-pad-(g/4)*(H-2*pad); ctx.beginPath();ctx.moveTo(pad,yy);ctx.lineTo(W-pad,yy);ctx.stroke();} }
    var upto=opts.upto!=null?opts.upto:xs.length;
    if(opts.area){ ctx.beginPath(); ctx.moveTo(SX(xs[0]),SY(y0));
      for(var i=0;i<upto;i++) ctx.lineTo(SX(xs[i]),SY(ys[i]));
      ctx.lineTo(SX(xs[Math.max(0,upto-1)]),SY(y0)); ctx.closePath();
      ctx.fillStyle="color-mix(in srgb,"+color+" 15%,transparent)"; ctx.fill(); }
    ctx.beginPath(); for(var j=0;j<upto;j++){var px=SX(xs[j]),py=SY(ys[j]); j?ctx.lineTo(px,py):ctx.moveTo(px,py);}
    ctx.strokeStyle=color; ctx.lineWidth=opts.w||2; ctx.setLineDash(opts.dash||[]); ctx.stroke(); ctx.setLineDash([]);
    if(opts.dot && upto>0){var ex=SX(xs[upto-1]),ey=SY(ys[upto-1]); ctx.fillStyle=color; ctx.beginPath();ctx.arc(ex,ey,3.5,0,7);ctx.fill();
      ctx.strokeStyle=tok("--panel");ctx.lineWidth=2;ctx.stroke();}
    return {SX:SX,SY:SY};
  }

  function drawStage(){
    var c=$("stage"),ctx=c.getContext("2d"),dpr=Math.min(2,devicePixelRatio||1);
    var W=c.clientWidth,H=c.clientHeight; if(c.width!==W*dpr){c.width=W*dpr;c.height=H*dpr;}
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,H);
    var comX=S.x[st.i], v=S.v[st.i];
    var ppm=W/12; // px per metre (12 m window)
    var camX=comX-3; var groundY=H*0.82;
    function wx(m){return (m-camX)*ppm;}
    // ground + distance ticks
    ctx.strokeStyle=tok("--line"); ctx.lineWidth=1; ctx.beginPath();ctx.moveTo(0,groundY);ctx.lineTo(W,groundY);ctx.stroke();
    ctx.fillStyle=tok("--ink-faint"); ctx.font="10px "+tok("--mono");
    for(var m=Math.floor(camX);m<camX+13;m++){var sx=wx(m); if(sx<-10||sx>W+10)continue;
      ctx.strokeStyle=tok("--line");ctx.beginPath();ctx.moveTo(sx,groundY);ctx.lineTo(sx,groundY+5);ctx.stroke();
      if(m%5===0&&m>=0){ctx.fillText(m+"m",sx+2,groundY+15);} }
    // virtual split gates
    splitDists.forEach(function(d){var sx=wx(d); if(sx<-10||sx>W+10)return; var hit=S.t[st.i]>=D.splits[d];
      ctx.strokeStyle=hit?tok("--gate"):tok("--line"); ctx.lineWidth=hit?2:1; ctx.setLineDash(hit?[]:[4,4]);
      ctx.beginPath();ctx.moveTo(sx,groundY-H*0.5);ctx.lineTo(sx,groundY);ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=hit?tok("--gate"):tok("--ink-faint"); ctx.font=(hit?"600 ":"")+"10px "+tok("--mono");
      ctx.fillText(d+"m"+(hit?" · "+D.splits[d].toFixed(2)+"s":""), sx+3, groundY-H*0.5+11); });
    // runner (rendered stand-in for the uploaded clip; skeleton = tracked pose)
    drawRunner(ctx, wx(comX), groundY, comX, ppm);
    // velocity chip
    ctx.fillStyle=tok("--vel"); ctx.font="700 13px "+tok("--mono");
    ctx.fillText(v.toFixed(2)+" m/s", wx(comX)-24, groundY-H*0.55);
  }
  function drawRunner(ctx, hipX, groundY, comX, ppm){
    var hipY=groundY-1.0*ppm, ph=comX/D.stride*2*Math.PI;
    var Ls={thigh:0.45*ppm,shank:0.43*ppm,trunk:0.5*ppm,uarm:0.30*ppm,farm:0.28*ppm};
    function leg(sign){var sw=0.5*Math.sin(ph+(sign>0?0:Math.PI)); var kb=0.7+0.6*Math.max(0,Math.sin(ph+(sign>0?0:Math.PI)+0.6));
      var kx=hipX+Math.sin(sw)*Ls.thigh, ky=hipY+Math.cos(sw)*Ls.thigh;
      var ax=kx+Math.sin(sw-kb)*Ls.shank, ay=ky+Math.cos(sw-kb)*Ls.shank;
      return [[hipX,hipY],[kx,ky],[ax,ay]]; }
    function arm(sign){var sw=0.6*Math.sin(ph+(sign>0?Math.PI:0)); var neck=[hipX+Math.sin(0.15)*Ls.trunk*0.1, hipY-Ls.trunk];
      var ex=neck[0]+Math.sin(sw+0.3)*Ls.uarm, ey=neck[1]+Math.cos(sw+0.3)*Ls.uarm;
      var wx2=ex+Math.sin(sw-0.8)*Ls.farm, wy=ey+Math.cos(sw-0.8)*Ls.farm; return [neck,[ex,ey],[wx2,wy]]; }
    var neck=[hipX+0.05*ppm, hipY-Ls.trunk], head=[neck[0]+0.04*ppm,neck[1]-0.22*ppm];
    function chain(pts,w,alpha){ctx.globalAlpha=alpha;ctx.strokeStyle=tok("--accent");ctx.lineWidth=w;ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(var i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.stroke();ctx.globalAlpha=1;}
    chain(leg(-1),5,0.5); chain(arm(-1),4,0.5);
    ctx.strokeStyle=tok("--accent");ctx.lineWidth=6;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(hipX,hipY);ctx.lineTo(neck[0],neck[1]);ctx.stroke();
    chain(leg(1),6,1); chain(arm(1),5,1);
    ctx.fillStyle=tok("--accent");ctx.beginPath();ctx.arc(head[0],head[1],9,0,7);ctx.fill();
    // joints
    [[hipX,hipY],neck].concat(leg(1)).concat(arm(1)).forEach(function(p){ctx.fillStyle=tok("--panel");ctx.strokeStyle=tok("--accent");ctx.lineWidth=2;ctx.beginPath();ctx.arc(p[0],p[1],3,0,7);ctx.fill();ctx.stroke();});
  }

  function drawCharts(){
    var vmax=Math.max.apply(null,S.v)*1.1, amax=Math.max.apply(null,S.a)*1.1;
    // velocity: model fit (full, dashed) then tracked up to now (area+line+dot)
    line($("vChart"), D.model.t, D.model.v, tok("--ink-faint"), {ymax:vmax, grid:true, w:1.5, dash:[5,4]});
    line($("vChart"), S.t, S.v, tok("--vel"), {ymax:vmax, area:true, dot:true, upto:st.i+1, keep:true});
    line($("aChart"), S.t, S.a, tok("--acc"), {ymax:amax, ymin:0, grid:true, area:true, dot:true, upto:st.i+1});
    $("vNow").textContent=S.v[st.i].toFixed(2)+" m/s";
    $("aNow").textContent=S.a[st.i].toFixed(2)+" m/s²";
  }
  function refresh(){
    drawStage(); drawCharts(); $("scrub").value=st.i;
    $("flab").textContent="t "+S.t[st.i].toFixed(2)+"s · "+S.x[st.i].toFixed(1)+" m";
    splitDists.forEach(function(d){var tr=document.querySelector('tr[data-d="'+d+'"]'); if(tr) tr.querySelector(".tm").className="tm"+(S.t[st.i]>=D.splits[d]?" hit":"");
      if(tr) tr.querySelector(".tm").classList.toggle("hit", S.t[st.i]>=D.splits[d]); });
  }
  function tick(ts){
    if(st.playing){ if(!st.last)st.last=ts; if(ts-st.last>1000/D.fps){ st.i++; st.last=ts; if(st.i>=N-1){st.i=N-1;setPlay(false);} } }
    else st.last=0;
    refresh(); requestAnimationFrame(tick);
  }
  function setPlay(p){st.playing=p; if(p&&st.i>=N-1)st.i=0; $("play").textContent=p?"❚❚":"▶"; st.last=0;}
  $("play").addEventListener("click",function(){setPlay(!st.playing);});
  $("restart").addEventListener("click",function(){setPlay(false);st.i=0;refresh();});
  $("scrub").addEventListener("input",function(e){setPlay(false);st.i=+e.target.value;refresh();});
  addEventListener("resize",refresh);
  refresh(); requestAnimationFrame(tick);
})();
</script>
"""

html = STYLE + MARKUP + "\n<script>window.TIMING=" + json.dumps(DATA) + ";</script>\n" + JS
(HERE / "timing-viewer.html").write_text(html)
print("wrote timing-viewer.html", len(html) // 1024, "KB")
print("summary:", DATA["summary"])
print("splits:", DATA["splits"])
