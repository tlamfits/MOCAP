#!/usr/bin/env python3
"""Assemble the self-contained Movement Keyframe Studio from engine.js + app.js.

Outputs `keyframe-studio.html` as body-only content (style + markup + inlined
scripts) so it drops straight into the Artifact publisher, and also opens
standalone in a browser.
"""
import pathlib

HERE = pathlib.Path(__file__).parent
engine = (HERE / "engine.js").read_text()
app = (HERE / "app.js").read_text()

STYLE = r"""
<style>
  :root{
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    --mono:ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;
    /* light base */
    --ground:#f4f6f9; --panel:#ffffff; --panel-2:#eef1f6; --line:#d9dee7;
    --ink:#1b2430; --ink-dim:#54617340; --ink-dim:#546173; --ink-faint:#8a95a4;
    --accent:#e8531f;
    --c-approach:#7a8797; --c-loading:#4a63d8; --c-prop:#12a069;
    --c-flight:#1f9ec9; --c-landing:#cf3d84; --c-plant:#c98a12; --c-release:#c0392b;
    --good:#12a069; --warn:#c98a12; --risk:#d23b3b;
  }
  @media (prefers-color-scheme:dark){
    :root{
      --ground:#0d1014; --panel:#14181e; --panel-2:#1a2029; --line:#262e39;
      --ink:#eef2f6; --ink-dim:#93a1b0; --ink-faint:#5f6c7b; --accent:#ff6a3d;
      --c-approach:#9aa7b4; --c-loading:#6c8cff; --c-prop:#34c98a;
      --c-flight:#46c3e6; --c-landing:#e85d9a; --c-plant:#f2b134; --c-release:#ff6b5a;
      --good:#34c98a; --warn:#f2b134; --risk:#ff5470;
    }
  }
  :root[data-theme="light"]{
    --ground:#f4f6f9; --panel:#ffffff; --panel-2:#eef1f6; --line:#d9dee7;
    --ink:#1b2430; --ink-dim:#546173; --ink-faint:#8a95a4; --accent:#e8531f;
    --c-approach:#7a8797; --c-loading:#4a63d8; --c-prop:#12a069;
    --c-flight:#1f9ec9; --c-landing:#cf3d84; --c-plant:#c98a12; --c-release:#c0392b;
    --good:#12a069; --warn:#c98a12; --risk:#d23b3b;
  }
  :root[data-theme="dark"]{
    --ground:#0d1014; --panel:#14181e; --panel-2:#1a2029; --line:#262e39;
    --ink:#eef2f6; --ink-dim:#93a1b0; --ink-faint:#5f6c7b; --accent:#ff6a3d;
    --c-approach:#9aa7b4; --c-loading:#6c8cff; --c-prop:#34c98a;
    --c-flight:#46c3e6; --c-landing:#e85d9a; --c-plant:#f2b134; --c-release:#ff6b5a;
    --good:#34c98a; --warn:#f2b134; --risk:#ff5470;
  }
  *{box-sizing:border-box}
  html,body{margin:0;height:100%}
  body{background:var(--ground);color:var(--ink);font-family:var(--sans);
    font-size:14px;line-height:1.45;-webkit-font-smoothing:antialiased}
  .app{display:grid;grid-template-rows:auto 1fr auto;height:100vh;min-height:0}
  /* topbar */
  .topbar{display:flex;align-items:center;gap:18px;padding:12px 18px;border-bottom:1px solid var(--line);background:var(--panel)}
  .brand{display:flex;align-items:baseline;gap:9px;white-space:nowrap}
  .brand b{font-weight:700;letter-spacing:-.01em}
  .brand .kx{color:var(--accent);font-family:var(--mono);font-weight:700;font-size:12px;
    border:1px solid var(--accent);padding:1px 6px;border-radius:5px;letter-spacing:.04em}
  .tb-title{min-width:0}
  .tb-title h1{margin:0;font-size:16px;font-weight:650;letter-spacing:-.01em;text-wrap:balance}
  .tb-title p{margin:0;color:var(--ink-faint);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .tb-right{margin-left:auto;display:flex;align-items:center;gap:12px}
  .viewtag{font-family:var(--mono);font-size:11px;color:var(--ink-dim);
    background:var(--panel-2);border:1px solid var(--line);padding:3px 9px;border-radius:6px;text-transform:uppercase;letter-spacing:.05em}
  .ref{font-size:11px;color:var(--ink-faint)}
  .ref b{color:var(--ink-dim)}
  /* stage */
  .stage{display:grid;grid-template-columns:216px 1fr 302px;min-height:0;overflow:hidden}
  .rail{background:var(--panel);overflow-y:auto;min-height:0}
  .rail.left{border-right:1px solid var(--line)}
  .rail.right{border-left:1px solid var(--line);display:flex;flex-direction:column}
  .section-h{font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;
    color:var(--ink-faint);padding:14px 14px 7px}
  /* movement list */
  .rail-actions{padding:12px 8px 4px}
  .btn.wide{width:100%;justify-content:flex-start;height:36px;font-family:var(--sans);font-size:13px;font-weight:550}
  .btn.wide:hover{border-color:var(--accent);color:var(--accent)}
  #mvList{display:flex;flex-direction:column;padding:0 8px 10px}
  .mv-item{display:flex;justify-content:space-between;align-items:center;gap:8px;
    text-align:left;width:100%;background:transparent;border:1px solid transparent;border-radius:8px;
    padding:8px 10px;color:var(--ink);cursor:pointer;font-family:inherit;font-size:13px}
  .mv-item:hover{background:var(--panel-2)}
  .mv-item.active{background:var(--panel-2);border-color:var(--line)}
  .mv-item.active .mv-name{color:var(--accent)}
  .mv-item.captured{border-color:color-mix(in srgb,var(--accent) 40%,var(--line));margin-bottom:6px}
  .mv-item.captured .mv-name{color:var(--accent)}
  .mv-item.captured .mv-sub{color:var(--accent)}
  .mv-name{font-weight:550}
  .mv-sub{font-family:var(--mono);font-size:10px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.05em}
  .meta{padding:8px 14px 16px;color:var(--ink-faint);font-size:11.5px;line-height:1.6}
  .meta code{font-family:var(--mono);color:var(--ink-dim)}
  /* center viewport */
  .center{position:relative;min-width:0;min-height:0;background:
    radial-gradient(120% 90% at 50% 8%, color-mix(in srgb,var(--panel) 65%, transparent), transparent 70%),var(--ground);
    display:flex}
  #view{width:100%;height:100%;display:block;touch-action:none}
  .legend{position:absolute;left:14px;bottom:12px;display:flex;flex-wrap:wrap;gap:6px 12px;max-width:70%}
  .legend span{display:inline-flex;align-items:center;gap:5px;font-family:var(--mono);font-size:10px;color:var(--ink-dim);text-transform:uppercase;letter-spacing:.04em}
  .legend i{width:8px;height:8px;border-radius:2px;display:inline-block}
  /* right rail panels */
  .angles{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
  .ang{background:var(--panel);padding:9px 12px}
  .ang .l{font-family:var(--mono);font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-faint)}
  .ang .v{font-family:var(--mono);font-size:18px;font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums}
  .ang.full{grid-column:1/3;display:flex;align-items:center;justify-content:space-between}
  .chip{font-family:var(--mono);font-size:11px;padding:2px 9px;border-radius:20px;font-weight:600}
  .chip.grd{background:color-mix(in srgb,var(--c-plant) 22%,transparent);color:var(--c-plant)}
  .chip.air{background:color-mix(in srgb,var(--c-flight) 22%,transparent);color:var(--c-flight)}
  #metrics{padding:4px 0}
  .metric{display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding:7px 14px;border-bottom:1px solid var(--line)}
  .metric .mlab{color:var(--ink-dim);font-size:12.5px}
  .metric .mval{font-family:var(--mono);font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
  .warn-dot{color:var(--warn);cursor:help}
  /* keyframes */
  .kf-wrap{margin-top:auto;border-top:1px solid var(--line);display:flex;flex-direction:column;min-height:0}
  #keyList{overflow-y:auto;max-height:26vh;padding:6px 8px;display:flex;flex-direction:column;gap:3px}
  .kf{display:flex;align-items:center;gap:8px;text-align:left;width:100%;background:transparent;border:1px solid transparent;
    border-radius:7px;padding:6px 9px;cursor:pointer;font-family:inherit;color:var(--ink)}
  .kf:hover{background:var(--panel-2)}
  .kf.sel{background:var(--panel-2);border-color:var(--accent)}
  .kf-dot{width:7px;height:7px;border-radius:50%;flex:none}
  .kf-name{font-size:12.5px;font-weight:550}
  .kf-meta{margin-left:auto;font-family:var(--mono);font-size:10px;color:var(--ink-faint);white-space:nowrap}
  .kf-tools{display:flex;gap:6px;padding:8px 12px;flex-wrap:wrap;align-items:center}
  .kf-tools input{flex:1;min-width:90px;background:var(--panel-2);border:1px solid var(--line);color:var(--ink);
    border-radius:6px;padding:5px 8px;font-family:var(--mono);font-size:11px}
  #exportArea{display:none;width:calc(100% - 24px);margin:0 12px 12px;height:96px;background:var(--panel-2);
    color:var(--ink-dim);border:1px solid var(--line);border-radius:6px;font-family:var(--mono);font-size:10px;padding:8px;resize:vertical}
  /* transport */
  .transport{border-top:1px solid var(--line);background:var(--panel);padding:10px 16px 12px}
  .transport-row{display:flex;align-items:center;gap:14px}
  .tbtns{display:flex;gap:6px}
  .btn{background:var(--panel-2);border:1px solid var(--line);color:var(--ink);border-radius:7px;
    height:32px;min-width:34px;padding:0 10px;cursor:pointer;font-family:var(--mono);font-size:13px;display:inline-flex;align-items:center;justify-content:center;gap:6px}
  .btn:hover{border-color:var(--ink-faint)}
  .btn.primary{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600}
  .btn.play{width:44px;font-size:14px}
  .slider{display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:11px;color:var(--ink-faint)}
  input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:3px;background:var(--line);outline:none}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--accent);cursor:pointer;border:2px solid var(--panel)}
  input[type=range]::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:var(--accent);cursor:pointer;border:2px solid var(--panel)}
  #scrub{flex:1}
  #speed{width:96px}
  #timeline{width:100%;height:64px;display:block;margin-top:8px;cursor:pointer;touch-action:none}
  .tl-meta{display:flex;justify-content:space-between;font-family:var(--mono);font-size:10px;color:var(--ink-faint);margin-top:2px;text-transform:uppercase;letter-spacing:.05em}
  .toast{position:fixed;left:50%;bottom:120px;transform:translateX(-50%) translateY(8px);opacity:0;pointer-events:none;
    background:var(--ink);color:var(--ground);font-family:var(--mono);font-size:12px;padding:8px 14px;border-radius:8px;transition:.25s}
  .toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
  :focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  @media (prefers-reduced-motion:reduce){*{transition:none!important}}
  @media (max-width:880px){
    .stage{grid-template-columns:1fr;grid-auto-rows:min-content}
    .rail{max-height:none;border:0;border-top:1px solid var(--line)}
    .center{min-height:52vh}
    #keyList{max-height:32vh}
  }
</style>
"""

MARKUP = r"""
<div class="app">
  <header class="topbar">
    <div class="brand"><span class="kx">FITS·CV</span><b>Keyframe Studio</b></div>
    <div class="tb-title"><h1 id="mvTitle">Approach Jump</h1><p id="mvBlurb">—</p></div>
    <div class="tb-right">
      <span class="viewtag" id="viewTag">sagittal · 60 fps</span>
      <span class="ref">reference product · <b>VueMotion</b></span>
    </div>
  </header>

  <div class="stage">
    <aside class="rail left">
      <div class="rail-actions">
        <button class="btn wide" id="importVideoBtn">▤ Import video…</button>
        <input type="file" id="videoFile" accept="video/*" hidden>
      </div>
      <div class="section-h">Movement library</div>
      <div id="mvList"></div>
      <div class="section-h">Capture</div>
      <div class="meta">
        Multi-cam 3D markerless → <code>OpenSim</code> IK.<br>
        Demo takes are <b>synthetic</b> stand-ins; the studio reads the same
        keypoint schema the P1 pipeline emits, so real triangulated takes drop
        straight in.<br><br>
        <code>space</code> play · <code>← →</code> step · drag markers to move keyframes.
      </div>
    </aside>

    <section class="center">
      <canvas id="view"></canvas>
      <div class="legend">
        <span><i style="background:var(--c-loading)"></i>loading</span>
        <span><i style="background:var(--c-prop)"></i>propulsion</span>
        <span><i style="background:var(--c-flight)"></i>flight</span>
        <span><i style="background:var(--c-plant)"></i>contact</span>
        <span><i style="background:var(--c-landing)"></i>landing</span>
      </div>
    </section>

    <aside class="rail right">
      <div class="section-h">Joint angles · live</div>
      <div class="angles">
        <div class="ang"><div class="l">Trunk lean</div><div class="v" id="aTrunk">0°</div></div>
        <div class="ang"><div class="l">Hip flex R</div><div class="v" id="aHip">0°</div></div>
        <div class="ang"><div class="l">Knee flex R</div><div class="v" id="aKnee">0°</div></div>
        <div class="ang"><div class="l">Ankle R</div><div class="v" id="aAnkle">0°</div></div>
        <div class="ang"><div class="l">Elbow R</div><div class="v" id="aElbow">0°</div></div>
        <div class="ang"><div class="l">Knee sep</div><div class="v" id="aSep">0cm</div></div>
        <div class="ang full"><div class="l">Foot contact</div><span class="chip grd" id="aContact">ground</span></div>
      </div>
      <div class="section-h">Take metrics</div>
      <div id="metrics"></div>
      <div class="kf-wrap">
        <div class="section-h">Keyframes</div>
        <div id="keyList"></div>
        <div class="kf-tools">
          <input id="renameKf" placeholder="rename selected keyframe" aria-label="Rename selected keyframe">
          <button class="btn" id="delKf" title="Delete selected">✕</button>
          <button class="btn primary" id="exportBtn">Export</button>
        </div>
        <textarea id="exportArea" spellcheck="false" aria-label="Exported keyframe JSON"></textarea>
      </div>
    </aside>
  </div>

  <footer class="transport">
    <div class="transport-row">
      <div class="tbtns">
        <button class="btn" id="restartBtn" title="Restart">⤒</button>
        <button class="btn" id="stepB" title="Step back">◂</button>
        <button class="btn play" id="playBtn" aria-label="Play">▶</button>
        <button class="btn" id="stepF" title="Step forward">▸</button>
        <button class="btn" id="addKf" title="Add keyframe at playhead">+ keyframe</button>
      </div>
      <input type="range" id="scrub" min="0" max="119" value="0" aria-label="Scrub frames">
      <div class="slider">speed <input type="range" id="speed" min="0.1" max="1.5" step="0.05" value="1"><span id="speedVal">1.00×</span></div>
    </div>
    <canvas id="timeline"></canvas>
    <div class="tl-meta"><span>phases + editable keyframes</span><span>drag a marker to retime · click to scrub</span></div>
  </footer>
</div>
<div class="toast" id="toast"></div>
"""

# inject a real captured take (from the pipeline) if present, so the studio can load it
cap_path = HERE / "captured_take.json"
cap_script = ""
if cap_path.exists():
    cap_script = "\n<script>window.CAPTURED=" + cap_path.read_text() + ";</script>\n"

html = STYLE + MARKUP + cap_script + "\n<script>\n" + engine + "\n</script>\n<script>\n" + app + "\n</script>\n"
(HERE / "keyframe-studio.html").write_text(html)
print("wrote keyframe-studio.html", len(html), "bytes", "(captured take embedded)" if cap_script else "(no captured take)")
