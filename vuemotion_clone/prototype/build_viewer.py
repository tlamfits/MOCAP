#!/usr/bin/env python3
"""Assemble the Pipeline Prototype viewer from prototype_data.json.

Body-only self-contained HTML (Artifact-ready): inlines the pipeline output and
renders the multi-camera reconstruction. Run pipeline_demo.py first.
"""
import json
import pathlib

HERE = pathlib.Path(__file__).parent
data = (HERE / "prototype_data.json").read_text()

STYLE = r"""
<style>
  :root{
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    --mono:ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;
    --ground:#f4f6f9;--panel:#fff;--panel-2:#eef1f6;--line:#d9dee7;
    --ink:#1b2430;--ink-dim:#546173;--ink-faint:#8a95a4;--accent:#e8531f;
    --gt:#8a95a4;--good:#12a069;--warn:#c98a12;--risk:#d23b3b;--recon:#1f9ec9;
  }
  @media (prefers-color-scheme:dark){:root{
    --ground:#0d1014;--panel:#14181e;--panel-2:#1a2029;--line:#262e39;
    --ink:#eef2f6;--ink-dim:#93a1b0;--ink-faint:#5f6c7b;--accent:#ff6a3d;
    --gt:#5f6c7b;--good:#34c98a;--warn:#f2b134;--risk:#ff5470;--recon:#46c3e6;}}
  :root[data-theme="light"]{--ground:#f4f6f9;--panel:#fff;--panel-2:#eef1f6;--line:#d9dee7;
    --ink:#1b2430;--ink-dim:#546173;--ink-faint:#8a95a4;--accent:#e8531f;--gt:#8a95a4;--recon:#1f9ec9;
    --good:#12a069;--warn:#c98a12;--risk:#d23b3b;}
  :root[data-theme="dark"]{--ground:#0d1014;--panel:#14181e;--panel-2:#1a2029;--line:#262e39;
    --ink:#eef2f6;--ink-dim:#93a1b0;--ink-faint:#5f6c7b;--accent:#ff6a3d;--gt:#5f6c7b;--recon:#46c3e6;
    --good:#34c98a;--warn:#f2b134;--risk:#ff5470;}
  *{box-sizing:border-box}html,body{margin:0;height:100%}
  body{background:var(--ground);color:var(--ink);font-family:var(--sans);font-size:14px;line-height:1.45}
  .app{display:grid;grid-template-rows:auto auto 1fr auto;height:100vh}
  .top{display:flex;align-items:center;gap:14px;padding:12px 18px;border-bottom:1px solid var(--line);background:var(--panel)}
  .kx{color:var(--accent);font-family:var(--mono);font-weight:700;font-size:12px;border:1px solid var(--accent);padding:1px 6px;border-radius:5px;letter-spacing:.04em}
  .top b{font-weight:700}.top .sub{color:var(--ink-faint);font-size:12px}
  .top .right{margin-left:auto;font-size:11px;color:var(--ink-faint)}
  /* pipeline strip */
  .pipe{display:flex;gap:0;align-items:stretch;padding:10px 18px;border-bottom:1px solid var(--line);background:var(--panel);overflow-x:auto}
  .stage{display:flex;flex-direction:column;gap:3px;padding:6px 14px;position:relative;white-space:nowrap}
  .stage:not(:last-child)::after{content:"▸";position:absolute;right:-6px;top:50%;transform:translateY(-50%);color:var(--ink-faint)}
  .stage .sn{font-size:12.5px;font-weight:600}
  .stage .st{font-family:var(--mono);font-size:9.5px;letter-spacing:.06em;text-transform:uppercase}
  .st.real{color:var(--good)}.st.faked{color:var(--warn)}.st.stub{color:var(--ink-faint)}
  /* main */
  .main{display:grid;grid-template-columns:1fr 380px;min-height:0}
  .view3d{position:relative;min-width:0;background:radial-gradient(120% 90% at 50% 0%,color-mix(in srgb,var(--panel) 60%,transparent),transparent 70%),var(--ground);display:flex}
  #recon{width:100%;height:100%;display:block;cursor:grab;touch-action:none}
  #recon:active{cursor:grabbing}
  .hud{position:absolute;top:12px;left:14px;display:flex;flex-direction:column;gap:8px}
  .stat{background:color-mix(in srgb,var(--panel) 86%,transparent);border:1px solid var(--line);border-radius:8px;padding:8px 12px;backdrop-filter:blur(4px)}
  .stat .l{font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-faint)}
  .stat .v{font-family:var(--mono);font-size:20px;font-weight:700;font-variant-numeric:tabular-nums}
  .stat .v small{font-size:11px;font-weight:500;color:var(--ink-dim)}
  .legend3{position:absolute;bottom:12px;left:14px;display:flex;gap:14px;font-family:var(--mono);font-size:10px;color:var(--ink-dim);text-transform:uppercase;letter-spacing:.04em}
  .legend3 span{display:inline-flex;align-items:center;gap:5px}.legend3 i{width:14px;height:3px;border-radius:2px}
  .orbit-hint{position:absolute;bottom:12px;right:14px;font-family:var(--mono);font-size:10px;color:var(--ink-faint)}
  .cams{border-left:1px solid var(--line);background:var(--panel);display:flex;flex-direction:column;min-height:0}
  .cams .section-h{font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-faint);padding:12px 14px 6px}
  #cams{flex:1;width:100%;display:block;min-height:0}
  .cams-note{padding:8px 14px 12px;font-size:11.5px;color:var(--ink-faint);line-height:1.55}
  .cams-note b{color:var(--risk)}
  /* transport */
  .transport{border-top:1px solid var(--line);background:var(--panel);padding:10px 16px 12px}
  .trow{display:flex;align-items:center;gap:14px}
  .btn{background:var(--panel-2);border:1px solid var(--line);color:var(--ink);border-radius:7px;height:32px;min-width:34px;padding:0 10px;cursor:pointer;font-family:var(--mono);font-size:13px}
  .btn.play{width:44px}.btn:hover{border-color:var(--ink-faint)}
  input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:3px;background:var(--line);outline:none;flex:1}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--accent);cursor:pointer;border:2px solid var(--panel)}
  #err{width:100%;height:44px;display:block;margin-top:8px}
  .tl-meta{display:flex;justify-content:space-between;font-family:var(--mono);font-size:10px;color:var(--ink-faint);margin-top:2px;text-transform:uppercase;letter-spacing:.05em}
  :focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  @media (prefers-reduced-motion:reduce){*{transition:none!important}}
  @media (max-width:860px){.main{grid-template-columns:1fr;grid-auto-rows:min-content}.view3d{min-height:46vh}.cams{border-left:0;border-top:1px solid var(--line)}#cams{height:40vh}}
</style>
"""

MARKUP = r"""
<div class="app">
  <div class="top">
    <span class="kx">FITS·CV</span><b>Pipeline Prototype</b>
    <span class="sub">multi-camera 3D reconstruction · broad jump</span>
    <span class="right">synthetic take · real triangulation code</span>
  </div>

  <div class="pipe" id="pipe"></div>

  <div class="main">
    <div class="view3d">
      <canvas id="recon"></canvas>
      <div class="hud">
        <div class="stat"><div class="l">Mean recon error</div><div class="v" id="sMean">–<small> mm</small></div></div>
        <div class="stat"><div class="l">This frame</div><div class="v" id="sFrame">–<small> mm</small></div></div>
        <div class="stat"><div class="l">Knee angle RMSE</div><div class="v" id="sKnee">–<small> °</small></div></div>
      </div>
      <div class="legend3">
        <span><i style="background:var(--recon)"></i>reconstructed</span>
        <span><i style="background:var(--gt)"></i>ground truth</span>
      </div>
      <div class="orbit-hint">drag to orbit</div>
    </div>
    <aside class="cams">
      <div class="section-h">Camera views · 2D keypoints in</div>
      <canvas id="cams"></canvas>
      <div class="cams-note">Four calibrated views feed the triangulator. From <b>f45–60</b> camera 1's right-knee
        detection is corrupted — watch RANSAC reject that view while the 3D stays locked on.</div>
    </aside>
  </div>

  <div class="transport">
    <div class="trow">
      <button class="btn" id="restart" title="Restart">⤒</button>
      <button class="btn play" id="play" aria-label="Play">▶</button>
      <input type="range" id="scrub" min="0" value="0" aria-label="Scrub frames">
      <span id="fLab" style="font-family:var(--mono);font-size:11px;color:var(--ink-faint);white-space:nowrap"></span>
    </div>
    <canvas id="err"></canvas>
    <div class="tl-meta"><span>per-frame 3D reconstruction error (mm)</span><span id="phaseLab"></span></div>
  </div>
</div>
"""

JS = r"""
<script>
(function(){
  "use strict";
  var P = window.PROTO, F = P.frames, N = F.length;
  var idx = {}; P.keypoints.forEach(function(k,i){idx[k]=i;});
  var st = {frame:0, playing:false, az:0.6, el:0.15, last:0, acc:0};
  function tok(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
  function $(id){return document.getElementById(id);}

  // pipeline strip
  var STAGES = [
    {n:"Capture", s:"rig · TBD", c:"stub"},
    {n:"2D pose", s:"faked · RTMPose", c:"faked"},
    {n:"Triangulate", s:"real · DLT+RANSAC", c:"real"},
    {n:"Marker aug", s:"stub", c:"stub"},
    {n:"OpenSim IK", s:"stub", c:"stub"},
    {n:"Angles", s:"real · studio", c:"real"}
  ];
  STAGES.forEach(function(s){
    var d=document.createElement("div"); d.className="stage";
    d.innerHTML='<span class="sn">'+s.n+'</span><span class="st '+s.c+'">'+s.s+'</span>';
    $("pipe").appendChild(d);
  });

  $("sMean").innerHTML = P.accuracy.mean_mm.toFixed(1)+'<small> mm</small>';
  $("sKnee").innerHTML = P.accuracy.knee_rmse_deg.toFixed(2)+'<small> °</small>';
  $("scrub").max = N-1;

  // frame mean error
  var frameMean = F.map(function(fr){var e=fr.err_mm.filter(function(x){return isFinite(x);}); return e.reduce(function(a,b){return a+b;},0)/e.length;});

  // ---- 3D projection ----
  function rot(p){
    var ca=Math.cos(st.az), sa=Math.sin(st.az), ce=Math.cos(st.el), se=Math.sin(st.el);
    var x=p[0]-1.0, y=p[1]-0.9, z=p[2];
    var x1=x*ca+z*sa, z1=-x*sa+z*ca;
    var y1=y*ce-z1*se, z2=y*se+z1*ce;
    return [x1,y1,z2];
  }
  function draw3d(){
    var c=$("recon"),ctx=c.getContext("2d"),dpr=Math.min(2,devicePixelRatio||1);
    var W=c.clientWidth,H=c.clientHeight; if(c.width!==W*dpr){c.width=W*dpr;c.height=H*dpr;}
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,H);
    var s=Math.min(W,H)*0.30, cx=W*0.5, cy=H*0.54;
    function pt(P3){var r=rot(P3);return [cx+r[0]*s, cy-r[1]*s];}
    // floor grid (y=0 plane)
    ctx.strokeStyle=tok("--line"); ctx.lineWidth=1;
    for(var g=-1;g<=3;g++){
      var a=pt([g*1.0,0,-1.2]),b=pt([g*1.0,0,1.2]); ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
      var d=pt([-1,0,g*0.6]),e=pt([3,0,g*0.6]); ctx.beginPath();ctx.moveTo(d[0],d[1]);ctx.lineTo(e[0],e[1]);ctx.stroke();
    }
    var fr=F[st.frame];
    function skel(pts,color,w,alpha){
      ctx.globalAlpha=alpha; ctx.strokeStyle=color; ctx.lineWidth=w; ctx.lineCap="round";
      P.edges.forEach(function(ed){
        var a=pt(pts[idx[ed[0]]]),b=pt(pts[idx[ed[1]]]);
        ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
      });
      ctx.globalAlpha=1;
    }
    skel(fr.gt, tok("--gt"), 5, 0.5);      // ground truth ghost
    skel(fr.recon, tok("--recon"), 4, 1);  // reconstruction
    // joints coloured by error
    fr.recon.forEach(function(p,i){
      var pp=pt(p), e=fr.err_mm[i];
      ctx.fillStyle = e>20?tok("--risk"):e>10?tok("--warn"):tok("--recon");
      ctx.beginPath();ctx.arc(pp[0],pp[1],3,0,7);ctx.fill();
    });
    $("sFrame").innerHTML = frameMean[st.frame].toFixed(1)+'<small> mm</small>';
  }

  // ---- camera views ----
  function drawCams(){
    var c=$("cams"),ctx=c.getContext("2d"),dpr=Math.min(2,devicePixelRatio||1);
    var W=c.clientWidth,H=c.clientHeight; if(c.width!==W*dpr){c.width=W*dpr;c.height=H*dpr;}
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,H);
    var cols=2,rows=2,pad=8,pw=(W-pad*3)/cols,ph=(H-pad*3)/rows;
    var fr=F[st.frame], corrupt=(st.frame>=45&&st.frame<=60);
    for(var ci=0;ci<P.n_cams;ci++){
      var col=ci%2,row=Math.floor(ci/2), ox=pad+col*(pw+pad), oy=pad+row*(ph+pad);
      var bad=(ci===1&&corrupt);
      ctx.fillStyle=tok("--panel-2"); ctx.strokeStyle=bad?tok("--risk"):tok("--line"); ctx.lineWidth=bad?2:1;
      rr(ctx,ox,oy,pw,ph,7); ctx.fill(); ctx.stroke();
      ctx.save(); rr(ctx,ox,oy,pw,ph,7); ctx.clip();
      var pts=fr.cams[ci], sc=Math.min(pw/1920,ph/1080)*0.92;
      var offx=ox+pw/2-960*sc, offy=oy+ph/2-540*sc;
      function q(p){return [offx+p[0]*sc, offy+p[1]*sc];}
      ctx.strokeStyle=bad?tok("--risk"):tok("--recon"); ctx.lineWidth=1.5; ctx.globalAlpha=bad?0.9:0.85;
      P.edges.forEach(function(ed){var a=q(pts[idx[ed[0]]]),b=q(pts[idx[ed[1]]]);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();});
      ctx.globalAlpha=1;
      pts.forEach(function(p){var pp=q(p);ctx.fillStyle=tok("--ink-dim");ctx.beginPath();ctx.arc(pp[0],pp[1],1.6,0,7);ctx.fill();});
      ctx.restore();
      ctx.fillStyle=bad?tok("--risk"):tok("--ink-faint"); ctx.font="10px "+tok("--mono");
      ctx.fillText("cam "+ci+(bad?"  ⚠ corrupted":""), ox+8, oy+14);
    }
  }
  function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}

  // ---- error sparkline ----
  function drawErr(){
    var c=$("err"),ctx=c.getContext("2d"),dpr=Math.min(2,devicePixelRatio||1);
    var W=c.clientWidth,H=c.clientHeight; if(c.width!==W*dpr){c.width=W*dpr;c.height=H*dpr;}
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,H);
    var mx=Math.max.apply(null,frameMean)*1.15, base=H-6;
    // area
    ctx.beginPath(); ctx.moveTo(0,base);
    frameMean.forEach(function(v,i){var x=i/(N-1)*W,y=base-(v/mx)*(H-12);ctx.lineTo(x,y);});
    ctx.lineTo(W,base); ctx.closePath(); ctx.fillStyle="color-mix(in srgb,"+tok("--recon")+" 18%,transparent)"; ctx.fill();
    ctx.beginPath(); frameMean.forEach(function(v,i){var x=i/(N-1)*W,y=base-(v/mx)*(H-12);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
    ctx.strokeStyle=tok("--recon"); ctx.lineWidth=1.5; ctx.stroke();
    // corrupt window shading
    ctx.fillStyle="color-mix(in srgb,"+tok("--risk")+" 12%,transparent)";
    ctx.fillRect(45/(N-1)*W,0,(60-45)/(N-1)*W,H);
    // playhead
    var px=st.frame/(N-1)*W; ctx.strokeStyle=tok("--ink"); ctx.lineWidth=1; ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px,H);ctx.stroke();
  }

  function curPhase(){var p=null;P.phases.forEach(function(ph){if(st.frame>=ph.frame)p=ph;});return p;}
  function refresh(){
    draw3d(); drawCams(); drawErr();
    $("scrub").value=st.frame;
    $("fLab").textContent="f "+st.frame+" / "+(N-1)+"  ·  "+(st.frame/P.fps*1000).toFixed(0)+" ms";
    var ph=curPhase(); $("phaseLab").textContent=ph?ph.name:"";
  }

  function tick(ts){
    if(st.playing){ if(!st.last)st.last=ts; st.acc+=(ts-st.last)/1000*P.fps; st.last=ts;
      if(st.acc>=1){st.frame+=Math.floor(st.acc);st.acc%=1; if(st.frame>=N-1){st.frame=N-1;setPlay(false);}}
    } else st.last=0;
    st.az+=st.playing?0.0015:0; // gentle idle orbit while playing
    refresh(); requestAnimationFrame(tick);
  }
  function setPlay(p){st.playing=p;if(p&&st.frame>=N-1)st.frame=0;$("play").textContent=p?"❚❚":"▶";st.last=0;}

  // orbit drag
  var drag=null;
  $("recon").addEventListener("pointerdown",function(e){drag={x:e.clientX,y:e.clientY,az:st.az,el:st.el};$("recon").setPointerCapture(e.pointerId);});
  $("recon").addEventListener("pointermove",function(e){if(!drag)return;st.az=drag.az+(e.clientX-drag.x)*0.008;st.el=Math.max(-0.6,Math.min(0.9,drag.el-(e.clientY-drag.y)*0.006));refresh();});
  $("recon").addEventListener("pointerup",function(){drag=null;});
  $("play").addEventListener("click",function(){setPlay(!st.playing);});
  $("restart").addEventListener("click",function(){setPlay(false);st.frame=0;refresh();});
  $("scrub").addEventListener("input",function(e){setPlay(false);st.frame=+e.target.value;refresh();});
  addEventListener("resize",refresh);

  refresh(); requestAnimationFrame(tick);
})();
</script>
"""

html = STYLE + MARKUP + "\n<script>window.PROTO=" + data + ";</script>\n" + JS
(HERE / "pipeline-viewer.html").write_text(html)
print("wrote pipeline-viewer.html", len(html) // 1024, "KB")
