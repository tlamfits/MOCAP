/* Movement Keyframe Studio — UI layer (browser only). Depends on window.MKS. */
(function () {
  "use strict";
  var MKS = window.MKS;

  var CAT = {
    approach: "--c-approach", loading: "--c-loading", propulsion: "--c-prop",
    flight: "--c-flight", landing: "--c-landing", plant: "--c-plant", release: "--c-release"
  };
  function catColor(cat) {
    return getComputedStyle(document.documentElement).getPropertyValue(CAT[cat] || "--c-approach").trim() || "#9aa7b4";
  }
  function token(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  var state = {
    id: "approach_jump", take: null, frame: 0, playing: false, speed: 1,
    keyframes: [], selected: 0, lastTs: 0, acc: 0
  };

  var el = {};
  function $(id) { return document.getElementById(id); }

  function load(id) {
    state.id = id;
    state.take = MKS.generateTake(id);
    state.frame = 0;
    state.keyframes = state.take.events.map(function (e) { return { frame: e.frame, name: e.name, cat: e.cat }; });
    state.selected = 0;
    document.querySelectorAll(".mv-item").forEach(function (n) { n.classList.toggle("active", n.dataset.id === id); });
    $("mvTitle").textContent = state.take.name;
    $("mvBlurb").textContent = MKS.MOVEMENTS[id].blurb;
    $("viewTag").textContent = state.take.view + " · " + state.take.fps + " fps";
    buildMetrics();
    buildKeyList();
    resize();
    render();
  }

  // ---------- viewport rendering ----------
  function worldToScreen(w, cam, ctx) {
    return [cam.cx + (w[0] - cam.px) * cam.s, cam.groundY - w[1] * cam.s];
  }
  function camera(ctx) {
    var W = ctx.canvas.width / cam_dpr, H = ctx.canvas.height / cam_dpr;
    var fr = state.take.frames[state.frame];
    var s = H * 0.34; // px per metre (~2 m tall visible)
    return { cx: W * 0.5, px: fr.joints.pelvis[0], s: s, groundY: H * 0.86, W: W, H: H };
  }
  var cam_dpr = 1;

  function render() {
    var c = el.view, ctx = c.getContext("2d");
    cam_dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = c.clientWidth, H = c.clientHeight;
    if (c.width !== W * cam_dpr) { c.width = W * cam_dpr; c.height = H * cam_dpr; }
    ctx.setTransform(cam_dpr, 0, 0, cam_dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var cam = camera(ctx);
    var fr = state.take.frames[state.frame];

    drawGround(ctx, cam);
    drawTrace(ctx, cam);
    drawSkeleton(ctx, cam, fr);
    drawArcs(ctx, cam, fr);
    drawHUD(ctx, cam, fr);
    updateAngles(fr);
  }

  function drawGround(ctx, cam) {
    ctx.strokeStyle = token("--line"); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, cam.groundY); ctx.lineTo(cam.W, cam.groundY); ctx.stroke();
    // metre ticks
    ctx.fillStyle = token("--ink-faint"); ctx.font = "10px " + token("--mono");
    var startM = Math.floor(cam.px - cam.W / (2 * cam.s)) - 1;
    var endM = startM + Math.ceil(cam.W / cam.s) + 2;
    for (var m = startM; m <= endM; m += 0.5) {
      var sx = cam.cx + (m - cam.px) * cam.s;
      if (sx < -20 || sx > cam.W + 20) continue;
      var major = Math.abs(m - Math.round(m)) < 0.01;
      ctx.strokeStyle = token("--line");
      ctx.beginPath(); ctx.moveTo(sx, cam.groundY); ctx.lineTo(sx, cam.groundY + (major ? 8 : 4)); ctx.stroke();
      if (major) ctx.fillText(m.toFixed(0) + "m", sx + 3, cam.groundY + 16);
    }
  }

  function drawTrace(ctx, cam) {
    ctx.lineWidth = 1.5;
    for (var i = 1; i <= state.frame; i++) {
      var a = worldToScreen(state.take.frames[i - 1].joints.pelvis, cam);
      var b = worldToScreen(state.take.frames[i].joints.pelvis, cam);
      var al = Math.max(0.05, 1 - (state.frame - i) / 40);
      ctx.strokeStyle = withAlpha(token("--accent"), al * 0.55);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
  }

  var BONES_R = [["pelvis", "kneeR"], ["kneeR", "ankleR"], ["ankleR", "toeR"], ["neck", "elbowR"], ["elbowR", "wristR"]];
  var BONES_L = [["pelvis", "kneeL"], ["kneeL", "ankleL"], ["ankleL", "toeL"], ["neck", "elbowL"], ["elbowL", "wristL"]];
  var BONES_C = [["pelvis", "neck"], ["neck", "head"]];

  function drawSkeleton(ctx, cam, fr) {
    var j = fr.joints;
    function bone(a, b, color, w) {
      var pa = worldToScreen(j[a], cam), pb = worldToScreen(j[b], cam);
      ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
    }
    BONES_L.forEach(function (b) { bone(b[0], b[1], withAlpha(token("--ink-dim"), 0.5), 5); });
    BONES_C.forEach(function (b) { bone(b[0], b[1], token("--ink"), 7); });
    BONES_R.forEach(function (b) { bone(b[0], b[1], token("--ink"), 6); });
    // head
    var h = worldToScreen(j.head, cam);
    ctx.fillStyle = token("--ink"); ctx.beginPath(); ctx.arc(h[0], h[1], 11, 0, 7); ctx.fill();
    // joints
    ["kneeR", "ankleR", "kneeL", "ankleL", "pelvis", "neck", "elbowR", "wristR"].forEach(function (k) {
      var p = worldToScreen(j[k], cam);
      ctx.fillStyle = token("--panel"); ctx.strokeStyle = token("--ink-dim"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p[0], p[1], 3.5, 0, 7); ctx.fill(); ctx.stroke();
    });
    // contact indicator
    if (!fr.airborne) {
      var t = worldToScreen([Math.min(j.toeR[0], j.toeL[0]), 0], cam);
      ctx.fillStyle = withAlpha(catColor("plant"), 0.9);
      ctx.beginPath(); ctx.arc(t[0], cam.groundY, 4, 0, 7); ctx.fill();
    }
  }

  function drawArcs(ctx, cam, fr) {
    var j = fr.joints, a = fr.angles;
    arc(ctx, cam, j.kneeR, "K " + Math.round(a.kneeFlexR) + "°", token("--accent"));
    arc(ctx, cam, j.hipR, "H " + Math.round(a.hipFlexR) + "°", token("--ink-dim"));
  }
  function arc(ctx, cam, jw, label, color) {
    var p = worldToScreen(jw, cam);
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p[0], p[1], 14, -0.5, 1.8); ctx.stroke();
    ctx.fillStyle = color; ctx.font = "11px " + token("--mono");
    ctx.fillText(label, p[0] + 16, p[1] - 6);
  }

  function drawHUD(ctx, cam, fr) {
    var ph = currentPhase();
    ctx.font = "600 12px " + token("--mono");
    var pad = 12;
    // phase pill
    var label = ph ? ph.name : "—";
    ctx.fillStyle = withAlpha(catColor(ph ? ph.cat : "approach"), 0.16);
    ctx.strokeStyle = catColor(ph ? ph.cat : "approach"); ctx.lineWidth = 1;
    var tw = ctx.measureText(label).width + 20;
    roundRect(ctx, pad, pad, tw, 22, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = catColor(ph ? ph.cat : "approach");
    ctx.fillText(label, pad + 10, pad + 15);
    // frame/time
    ctx.fillStyle = token("--ink-faint"); ctx.textAlign = "right";
    var ms = (state.frame / state.take.fps * 1000).toFixed(0);
    ctx.fillText("f " + state.frame + " / " + (state.take.frames.length - 1) + "   ·   " + ms + " ms", cam.W - pad, pad + 15);
    ctx.textAlign = "left";
  }

  function currentPhase() {
    var ph = state.take.phases, N = state.take.frames.length;
    var cur = null;
    for (var i = 0; i < ph.length; i++) { if (state.frame >= Math.round(ph[i].t * (N - 1))) cur = ph[i]; }
    return cur;
  }

  // ---------- timeline ----------
  function drawTimeline() {
    var c = el.timeline, ctx = c.getContext("2d");
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = c.clientWidth, H = c.clientHeight;
    if (c.width !== W * dpr) { c.width = W * dpr; c.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var N = state.take.frames.length, ph = state.take.phases;
    var bandY = 8, bandH = 20;
    // phase bands
    for (var i = 0; i < ph.length; i++) {
      var x0 = ph[i].t * (W - 1);
      var x1 = (i < ph.length - 1 ? ph[i + 1].t : 1) * (W - 1);
      ctx.fillStyle = withAlpha(catColor(ph[i].cat), 0.28);
      ctx.fillRect(x0, bandY, Math.max(1, x1 - x0), bandH);
      ctx.fillStyle = withAlpha(catColor(ph[i].cat), 0.9);
      ctx.fillRect(x0, bandY, 2, bandH);
    }
    // baseline
    var trackY = bandY + bandH + 14;
    ctx.strokeStyle = token("--line"); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, trackY); ctx.lineTo(W, trackY); ctx.stroke();
    // keyframe markers
    state.keyframes.forEach(function (k, idx) {
      var x = (k.frame / (N - 1)) * (W - 1);
      var sel = idx === state.selected;
      ctx.strokeStyle = sel ? token("--accent") : catColor(k.cat);
      ctx.lineWidth = sel ? 2 : 1.5;
      ctx.beginPath(); ctx.moveTo(x, bandY); ctx.lineTo(x, trackY); ctx.stroke();
      ctx.fillStyle = sel ? token("--accent") : catColor(k.cat);
      ctx.beginPath(); ctx.moveTo(x, trackY - 6); ctx.lineTo(x - 5, trackY + 4); ctx.lineTo(x + 5, trackY + 4); ctx.closePath(); ctx.fill();
    });
    // playhead
    var px = (state.frame / (N - 1)) * (W - 1);
    ctx.strokeStyle = token("--ink"); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
    ctx.fillStyle = token("--ink");
    ctx.beginPath(); ctx.arc(px, 4, 3, 0, 7); ctx.fill();
  }

  function timelineFrameFromX(clientX) {
    var r = el.timeline.getBoundingClientRect();
    var u = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    return Math.round(u * (state.take.frames.length - 1));
  }

  // ---------- panels ----------
  function updateAngles(fr) {
    var a = fr.angles;
    setVal("aTrunk", a.trunkLean, "°", 0);
    setVal("aHip", a.hipFlexR, "°", 0);
    setVal("aKnee", a.kneeFlexR, "°", 0);
    setVal("aAnkle", a.ankleR, "°", 0);
    setVal("aElbow", a.elbowR, "°", 0);
    setVal("aSep", a.kneeSep * 100, "cm", 1);
    $("aContact").textContent = fr.airborne ? "airborne" : "ground";
    $("aContact").className = "chip " + (fr.airborne ? "air" : "grd");
  }
  function setVal(id, v, unit, dp) { var n = $(id); if (n) n.textContent = (v >= 0 && unit === "°" ? "" : "") + v.toFixed(dp) + unit; }

  function buildMetrics() {
    var box = $("metrics"); box.innerHTML = "";
    MKS.metrics(state.take).forEach(function (m) {
      var d = document.createElement("div"); d.className = "metric";
      var v = m.val.toFixed(m.fmt) + (m.unit ? " " + m.unit : "");
      d.innerHTML = '<span class="mlab">' + m.label + (m.caveat ? ' <span class="warn-dot" title="Transverse-plane / rotation metrics are the industry-wide accuracy ceiling — treat as a proxy.">⚠</span>' : '') + '</span><span class="mval">' + v + '</span>';
      box.appendChild(d);
    });
  }

  function buildKeyList() {
    var box = $("keyList"); box.innerHTML = "";
    state.keyframes.forEach(function (k, idx) {
      var fr = state.take.frames[k.frame];
      var row = document.createElement("button"); row.className = "kf" + (idx === state.selected ? " sel" : "");
      row.innerHTML =
        '<span class="kf-dot" style="background:' + catColor(k.cat) + '"></span>' +
        '<span class="kf-name">' + k.name + '</span>' +
        '<span class="kf-meta">f' + k.frame + ' · K' + Math.round(fr.angles.kneeFlexR) + '° · T' + Math.round(fr.angles.trunkLean) + '°</span>';
      row.addEventListener("click", function () { state.selected = idx; state.frame = k.frame; syncScrub(); refresh(); });
      box.appendChild(row);
    });
  }

  function exportJSON() {
    var out = {
      movement: state.id, name: state.take.name, view: state.take.view, fps: state.take.fps,
      frames: state.take.frames.length,
      keyframes: state.keyframes.map(function (k) {
        var fr = state.take.frames[k.frame];
        return {
          frame: k.frame, name: k.name, phase: k.cat, timeMs: +(k.frame / state.take.fps * 1000).toFixed(1),
          angles: Object.keys(fr.angles).reduce(function (o, key) { o[key] = +fr.angles[key].toFixed(2); return o; }, {}),
          airborne: fr.airborne
        };
      }),
      metrics: MKS.metrics(state.take).map(function (m) { return { label: m.label, value: +m.val.toFixed(m.fmt), unit: m.unit }; })
    };
    var text = JSON.stringify(out, null, 2);
    $("exportArea").value = text;
    $("exportArea").style.display = "block";
    $("exportArea").select();
    try { navigator.clipboard.writeText(text); flash("Keyframes copied to clipboard"); }
    catch (e) { flash("Keyframes ready — select & copy"); }
  }
  function flash(msg) { var f = $("toast"); f.textContent = msg; f.classList.add("show"); setTimeout(function () { f.classList.remove("show"); }, 1800); }

  // ---------- playback ----------
  function tick(ts) {
    if (state.playing) {
      if (!state.lastTs) state.lastTs = ts;
      var dt = (ts - state.lastTs) / 1000; state.lastTs = ts;
      state.acc += dt * state.take.fps * state.speed;
      if (state.acc >= 1) {
        state.frame += Math.floor(state.acc); state.acc %= 1;
        if (state.frame >= state.take.frames.length - 1) { state.frame = state.take.frames.length - 1; setPlaying(false); }
        syncScrub();
      }
    } else { state.lastTs = 0; }
    refresh();
    requestAnimationFrame(tick);
  }
  function refresh() { render(); drawTimeline(); buildKeyList(); }
  function setPlaying(p) {
    state.playing = p; if (p && state.frame >= state.take.frames.length - 1) { state.frame = 0; }
    $("playBtn").textContent = p ? "❚❚" : "▶";
    $("playBtn").setAttribute("aria-label", p ? "Pause" : "Play");
    state.lastTs = 0;
  }
  function syncScrub() { el.scrub.value = state.frame; }

  function resize() { render(); drawTimeline(); }

  function withAlpha(hex, a) {
    hex = hex.trim();
    if (hex[0] !== "#") return hex;
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // ---------- wire up ----------
  function init() {
    el.view = $("view"); el.timeline = $("timeline"); el.scrub = $("scrub");
    // movement list
    Object.keys(MKS.MOVEMENTS).forEach(function (id) {
      var m = MKS.MOVEMENTS[id];
      var b = document.createElement("button"); b.className = "mv-item"; b.dataset.id = id;
      b.innerHTML = '<span class="mv-name">' + m.name + '</span><span class="mv-sub">' + m.view + '</span>';
      b.addEventListener("click", function () { setPlaying(false); load(id); });
      $("mvList").appendChild(b);
    });
    // controls
    $("playBtn").addEventListener("click", function () { setPlaying(!state.playing); });
    $("restartBtn").addEventListener("click", function () { setPlaying(false); state.frame = 0; syncScrub(); refresh(); });
    $("stepB").addEventListener("click", function () { setPlaying(false); state.frame = Math.max(0, state.frame - 1); syncScrub(); refresh(); });
    $("stepF").addEventListener("click", function () { setPlaying(false); state.frame = Math.min(state.take.frames.length - 1, state.frame + 1); syncScrub(); refresh(); });
    $("speed").addEventListener("input", function (e) { state.speed = parseFloat(e.target.value); $("speedVal").textContent = state.speed.toFixed(2) + "×"; });
    el.scrub.addEventListener("input", function (e) { setPlaying(false); state.frame = parseInt(e.target.value, 10); refresh(); });
    $("addKf").addEventListener("click", function () {
      state.keyframes.push({ frame: state.frame, name: "Keyframe", cat: (currentPhase() || {}).cat || "approach" });
      state.keyframes.sort(function (a, b) { return a.frame - b.frame; });
      state.selected = state.keyframes.findIndex(function (k) { return k.frame === state.frame; });
      refresh(); flash("Keyframe added at f" + state.frame);
    });
    $("delKf").addEventListener("click", function () {
      if (state.keyframes.length && state.selected >= 0) { state.keyframes.splice(state.selected, 1); state.selected = Math.max(0, state.selected - 1); refresh(); }
    });
    $("renameKf").addEventListener("input", function (e) { if (state.keyframes[state.selected]) { state.keyframes[state.selected].name = e.target.value; refresh(); } });
    $("exportBtn").addEventListener("click", exportJSON);

    // timeline drag
    var dragging = false;
    function pickNearest(frame) {
      var best = -1, bd = 6;
      state.keyframes.forEach(function (k, i) { var d = Math.abs(k.frame - frame); if (d < bd) { bd = d; best = i; } });
      return best;
    }
    el.timeline.addEventListener("pointerdown", function (e) {
      el.timeline.setPointerCapture(e.pointerId);
      var frame = timelineFrameFromX(e.clientX);
      var near = pickNearest(frame);
      if (near >= 0) { state.selected = near; dragging = true; $("renameKf").value = state.keyframes[near].name; }
      state.frame = frame; setPlaying(false); syncScrub(); refresh();
    });
    el.timeline.addEventListener("pointermove", function (e) {
      var frame = timelineFrameFromX(e.clientX);
      if (dragging && state.keyframes[state.selected]) { state.keyframes[state.selected].frame = frame; }
      state.frame = frame; syncScrub(); refresh();
    });
    el.timeline.addEventListener("pointerup", function () { dragging = false; state.keyframes.sort(function (a, b) { return a.frame - b.frame; }); refresh(); });

    window.addEventListener("resize", resize);
    document.addEventListener("keydown", function (e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); setPlaying(!state.playing); }
      else if (e.code === "ArrowLeft") { setPlaying(false); state.frame = Math.max(0, state.frame - 1); syncScrub(); refresh(); }
      else if (e.code === "ArrowRight") { setPlaying(false); state.frame = Math.min(state.take.frames.length - 1, state.frame + 1); syncScrub(); refresh(); }
    });

    load(state.id);
    el.scrub.max = state.take.frames.length - 1;
    requestAnimationFrame(tick);
  }

  // scrub max needs update per movement
  var _load = load;
  load = function (id) { _load(id); el.scrub.max = state.take.frames.length - 1; el.scrub.value = 0; $("renameKf").value = ""; };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
