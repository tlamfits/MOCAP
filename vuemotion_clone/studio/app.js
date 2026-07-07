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
    if (id === "captured" && window.CAPTURED) state.take = capturedTake(window.CAPTURED);
    else if (id === "imported") { if (!state.importedTake) return; state.take = state.importedTake; }
    else state.take = MKS.generateTake(id);
    state.frame = 0;
    if (state.take.imported) {
      state.keyframes = Object.keys(state.take.dig).map(Number).sort(function (a, b) { return a - b; })
        .map(function (f) { return { frame: f, name: "Pose", cat: "loading" }; });
    } else {
      state.keyframes = state.take.events.map(function (e) { return { frame: e.frame, name: e.name, cat: e.cat }; });
    }
    state.selected = 0;
    document.querySelectorAll(".mv-item").forEach(function (n) { n.classList.toggle("active", n.dataset.id === id); });
    $("mvTitle").textContent = state.take.name;
    $("mvBlurb").textContent = state.take.blurb || (MKS.MOVEMENTS[id] && MKS.MOVEMENTS[id].blurb) || "";
    $("viewTag").textContent = state.take.view + " · " + state.take.fps + " fps" + (state.take.captured ? " · captured" : "");
    buildMetrics();
    buildKeyList();
    resize();
    render();
  }

  // Build a studio take from a real captured Take JSON (3D -> sagittal projection).
  function capturedTake(cap) {
    var names = cap.keypoints, N = cap.frames.length;
    var frames = cap.frames.map(function (fr) {
      var j = {};
      for (var i = 0; i < names.length; i++) j[names[i]] = [fr.joints3d[i][0], fr.joints3d[i][1]]; // drop Z -> sagittal
      j.shoulderR = j.neck; j.shoulderL = j.neck; // studio arms hang from neck
      return { f: fr.f, t: fr.t, joints: j, angles: fr.angles, airborne: fr.airborne };
    });
    return {
      id: "captured", name: cap.movement.replace(/_/g, " ") + " · captured", view: "sagittal",
      fps: cap.fps, captured: true,
      blurb: "Real reconstruction: 4 cameras → triangulation → movement engine (source: " + cap.source + ").",
      frames: frames,
      phases: cap.phases.map(function (p) { return { id: p.name, name: p.name, cat: p.cat, t: p.frame / (N - 1) }; }),
      events: cap.phases.map(function (p) { return { id: p.name, name: p.name, cat: p.cat, frame: p.frame }; }),
      metricKeys: [],
      precomputed: cap.metrics.map(function (m) {
        return { label: m.label, val: m.value, unit: m.unit, caveat: m.caveat, fmt: (m.unit === "ms" || m.unit === "°") ? 0 : 2 };
      })
    };
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
    if (state.take && state.take.imported) { renderImported(); return; }
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
  function updateAngles(fr) { updateAnglesPanel(fr.angles, fr.airborne ? "airborne" : "ground"); }
  function updateAnglesPanel(a, contact) {
    setVal("aTrunk", a.trunkLean, "°", 0);
    setVal("aHip", a.hipFlexR, "°", 0);
    setVal("aKnee", a.kneeFlexR, "°", 0);
    setVal("aAnkle", a.ankleR, "°", 0);
    setVal("aElbow", a.elbowR, "°", 0);
    setVal("aSep", a.kneeSep * 100, "cm", 1);
    var n = $("aContact");
    if (contact === null) { n.textContent = "video"; n.className = "chip"; }
    else { n.textContent = contact; n.className = "chip " + (contact === "airborne" ? "air" : "grd"); }
  }
  function setVal(id, v, unit, dp) { var n = $(id); if (n) n.textContent = (v >= 0 && unit === "°" ? "" : "") + v.toFixed(dp) + unit; }

  function buildMetrics() {
    var box = $("metrics"); box.innerHTML = "";
    var list = state.take.imported ? impMetrics() : (state.take.precomputed || MKS.metrics(state.take));
    list.forEach(function (m) {
      var d = document.createElement("div"); d.className = "metric";
      var v = m.val.toFixed(m.fmt) + (m.unit ? " " + m.unit : "");
      d.innerHTML = '<span class="mlab">' + m.label + (m.caveat ? ' <span class="warn-dot" title="Transverse-plane / rotation metrics are the industry-wide accuracy ceiling — treat as a proxy.">⚠</span>' : '') + '</span><span class="mval">' + v + '</span>';
      box.appendChild(d);
    });
  }

  function buildKeyList() {
    var box = $("keyList"); box.innerHTML = "";
    state.keyframes.forEach(function (k, idx) {
      var ang = state.take.imported ? anglesImported(k.frame) : state.take.frames[k.frame].angles;
      var row = document.createElement("button"); row.className = "kf" + (idx === state.selected ? " sel" : "");
      row.innerHTML =
        '<span class="kf-dot" style="background:' + catColor(k.cat) + '"></span>' +
        '<span class="kf-name">' + k.name + '</span>' +
        '<span class="kf-meta">f' + k.frame + ' · K' + Math.round(ang.kneeFlexR) + '° · T' + Math.round(ang.trunkLean) + '°</span>';
      row.addEventListener("click", function () { state.selected = idx; state.frame = k.frame; syncScrub(); refresh(); });
      box.appendChild(row);
    });
  }

  function exportJSON() {
    if (state.take.imported) { return impExport(); }
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
      metrics: (state.take.precomputed || MKS.metrics(state.take)).map(function (m) { return { label: m.label, value: +m.val.toFixed(m.fmt), unit: m.unit }; })
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
    if (state.take && state.take.imported) {
      if (state.playing && state.video) {
        state.frame = Math.min(state.take.frames.length - 1, Math.max(0, Math.round(state.video.currentTime * state.take.fps)));
        if (state.video.ended) setPlaying(false);
        syncScrub();
      }
      refresh(); requestAnimationFrame(tick); return;
    }
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
    state.playing = p;
    if (state.take && state.take.imported && state.video) {
      if (p) { if (state.video.ended) state.video.currentTime = 0; var pr = state.video.play(); if (pr && pr.catch) pr.catch(function () { }); }
      else state.video.pause();
    } else if (p && state.frame >= state.take.frames.length - 1) { state.frame = 0; }
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

  // ========== imported video (upload + digitize) ==========
  var STAND_N = {
    head: [.50, .12], neck: [.50, .21], pelvis: [.50, .52],
    hipR: [.475, .52], hipL: [.525, .52], kneeR: [.47, .72], kneeL: [.53, .72],
    ankleR: [.465, .92], ankleL: [.535, .92], toeR: [.50, .955], toeL: [.575, .955],
    elbowR: [.55, .37], wristR: [.585, .50], elbowL: [.45, .37], wristL: [.415, .50]
  };
  var DRAG_JOINTS = Object.keys(STAND_N);
  var IMP_BONES = [["pelvis", "neck"], ["neck", "head"], ["neck", "elbowR"], ["elbowR", "wristR"],
    ["neck", "elbowL"], ["elbowL", "wristL"], ["pelvis", "hipR"], ["hipR", "kneeR"], ["kneeR", "ankleR"],
    ["ankleR", "toeR"], ["pelvis", "hipL"], ["hipL", "kneeL"], ["kneeL", "ankleL"], ["ankleL", "toeL"]];

  function cloneN(o) { var r = {}; DRAG_JOINTS.forEach(function (k) { r[k] = [o[k][0], o[k][1]]; }); return r; }
  function interpImported(f) {
    var dig = state.take.dig, keys = Object.keys(dig).map(Number).sort(function (a, b) { return a - b; });
    if (!keys.length) return cloneN(STAND_N);
    if (f <= keys[0]) return cloneN(dig[keys[0]]);
    if (f >= keys[keys.length - 1]) return cloneN(dig[keys[keys.length - 1]]);
    var i = 0; while (i < keys.length - 1 && f > keys[i + 1]) i++;
    var a = dig[keys[i]], b = dig[keys[i + 1]], u = (f - keys[i]) / (keys[i + 1] - keys[i]), out = {};
    DRAG_JOINTS.forEach(function (k) { out[k] = [a[k][0] + (b[k][0] - a[k][0]) * u, a[k][1] + (b[k][1] - a[k][1]) * u]; });
    return out;
  }
  function toWorldN(jn) { // -> joints (y-up pixel-ish) for angle math
    var vW = state.take.videoW, vH = state.take.videoH, J = {};
    DRAG_JOINTS.forEach(function (k) { J[k] = [jn[k][0] * vW, (1 - jn[k][1]) * vH]; });
    J.shoulderR = J.neck; J.shoulderL = J.neck; return J;
  }
  function anglesImported(f) { return MKS.jointAngles(toWorldN(interpImported(f))); }
  function impLayout(W, H) { var vW = state.take.videoW, vH = state.take.videoH, sc = Math.min(W / vW, H / vH); return { ox: (W - vW * sc) / 2, oy: (H - vH * sc) / 2, dW: vW * sc, dH: vH * sc }; }

  function renderImported() {
    var c = el.view, ctx = c.getContext("2d"); cam_dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = c.clientWidth, H = c.clientHeight; if (c.width !== W * cam_dpr) { c.width = W * cam_dpr; c.height = H * cam_dpr; }
    ctx.setTransform(cam_dpr, 0, 0, cam_dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    var L = impLayout(W, H); state._impL = L;
    if (state.video && state.video.readyState >= 2) { try { ctx.drawImage(state.video, L.ox, L.oy, L.dW, L.dH); } catch (e) { } }
    else { ctx.fillStyle = token("--panel-2"); ctx.fillRect(L.ox, L.oy, L.dW, L.dH); }
    ctx.fillStyle = "rgba(0,0,0,0.14)"; ctx.fillRect(L.ox, L.oy, L.dW, L.dH);
    var jn = interpImported(state.frame);
    function S(n) { return [L.ox + jn[n][0] * L.dW, L.oy + jn[n][1] * L.dH]; }
    ctx.strokeStyle = token("--accent"); ctx.lineWidth = 3; ctx.lineCap = "round";
    IMP_BONES.forEach(function (b) { var a = S(b[0]), z = S(b[1]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(z[0], z[1]); ctx.stroke(); });
    DRAG_JOINTS.forEach(function (k) {
      var p = S(k), on = k === state.impDrag;
      ctx.fillStyle = on ? token("--accent") : token("--panel"); ctx.strokeStyle = token("--accent"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p[0], p[1], on ? 7 : 5, 0, 7); ctx.fill(); ctx.stroke();
    });
    var a2 = anglesImported(state.frame), kp = S("kneeR");
    ctx.strokeStyle = token("--accent"); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(kp[0], kp[1], 16, -0.5, 1.8); ctx.stroke();
    ctx.fillStyle = token("--accent"); ctx.font = "11px " + token("--mono"); ctx.fillText("K " + Math.round(a2.kneeFlexR) + "°", kp[0] + 18, kp[1] - 6);
    ctx.font = "600 12px " + token("--mono"); ctx.fillStyle = token("--ink-faint"); ctx.textAlign = "right";
    ctx.fillText("f " + state.frame + " / " + (state.take.frames.length - 1) + "  ·  " + (state.frame / state.take.fps * 1000).toFixed(0) + " ms", W - 12, 22); ctx.textAlign = "left";
    if (!Object.keys(state.take.dig).length) {
      ctx.fillStyle = token("--ink-dim"); ctx.font = "12px " + token("--sans");
      ctx.fillText("Drag the joints onto the athlete, then “+ keyframe” to capture this pose.", L.ox + 12, L.oy + 24);
    }
    updateAnglesPanel(a2, null);
  }
  function impPickJoint(sx, sy) {
    var L = state._impL; if (!L) return null; var jn = interpImported(state.frame), best = null, bd = 16;
    DRAG_JOINTS.forEach(function (k) { var d = Math.hypot(L.ox + jn[k][0] * L.dW - sx, L.oy + jn[k][1] * L.dH - sy); if (d < bd) { bd = d; best = k; } });
    return best;
  }
  function impEnsureKey(f) {
    if (!state.take.dig[f]) {
      state.take.dig[f] = cloneN(interpImported(f));
      if (!state.keyframes.some(function (k) { return k.frame === f; })) {
        state.keyframes.push({ frame: f, name: "Pose", cat: "loading" });
        state.keyframes.sort(function (a, b) { return a.frame - b.frame; });
      }
    }
  }
  function impMetrics() {
    var ks = state.keyframes.map(function (k) { return k.frame; });
    if (!ks.length) return [{ label: "Add keyframes to read angles", val: 0, fmt: 0, unit: "" }];
    var kf = ks.map(function (f) { return anglesImported(f); });
    var kn = kf.map(function (a) { return a.kneeFlexR; }), tr = kf.map(function (a) { return a.trunkLean; });
    return [
      { label: "Keyframes", val: ks.length, fmt: 0, unit: "" },
      { label: "Peak knee flex", val: Math.max.apply(null, kn), fmt: 0, unit: "°" },
      { label: "Trunk lean range", val: Math.max.apply(null, tr) - Math.min.apply(null, tr), fmt: 0, unit: "°" }
    ];
  }
  function impExport() {
    var out = {
      movement: "imported", name: state.take.name, view: "video", fps: state.take.fps,
      layout: "video2d_norm", keypoints: DRAG_JOINTS, videoW: state.take.videoW, videoH: state.take.videoH,
      keyframes: state.keyframes.map(function (k) {
        var a = anglesImported(k.frame);
        return {
          frame: k.frame, name: k.name, timeMs: +(k.frame / state.take.fps * 1000).toFixed(1),
          joints_norm: state.take.dig[k.frame] || interpImported(k.frame),
          angles: Object.keys(a).reduce(function (o, key) { o[key] = +a[key].toFixed(2); return o; }, {})
        };
      })
    };
    var text = JSON.stringify(out, null, 2);
    $("exportArea").value = text; $("exportArea").style.display = "block"; $("exportArea").select();
    try { navigator.clipboard.writeText(text); flash("Digitized keyframes copied"); } catch (e) { flash("Keyframes ready — select & copy"); }
  }
  function impSeek(f) { if (state.take && state.take.imported && state.video) { try { state.video.currentTime = f / state.take.fps; } catch (e) { } } }
  function ensureImportedMenu() {
    if ($("mvImported")) return;
    var b = document.createElement("button"); b.className = "mv-item captured"; b.id = "mvImported"; b.dataset.id = "imported";
    b.innerHTML = '<span class="mv-name">▤ Imported video</span><span class="mv-sub">2D</span>';
    b.addEventListener("click", function () { if (state.importedTake) { setPlaying(false); load("imported"); } else $("videoFile").click(); });
    var list = $("mvList"); list.insertBefore(b, list.firstChild);
  }
  function importVideo(file) {
    if (!file) return;
    if (state._url) { try { URL.revokeObjectURL(state._url); } catch (e) { } }
    var url = URL.createObjectURL(file); state._url = url;
    var v = document.createElement("video"); v.muted = true; v.playsInline = true; v.preload = "auto"; v.style.display = "none";
    document.body.appendChild(v);
    v.addEventListener("loadedmetadata", function () {
      if (state.video && state.video !== v) { try { document.body.removeChild(state.video); } catch (e) { } }
      state.video = v;
      var fps = 30, N = Math.max(2, Math.round((v.duration || 4) * fps));
      var take = {
        id: "imported", name: (file.name || "Imported video"), view: "video", fps: fps, imported: true,
        videoW: v.videoWidth || 1280, videoH: v.videoHeight || 720, dig: {}, frames: [], phases: [], events: [],
        metricKeys: [], precomputed: null,
        blurb: "Uploaded clip · drag the skeleton onto the athlete, capture keyframes, read angles."
      };
      for (var i = 0; i < N; i++) take.frames.push({ f: i });
      state.importedTake = take; ensureImportedMenu(); setPlaying(false); load("imported");
      flash("Video imported — drag the skeleton to the athlete");
    });
    v.addEventListener("error", function () { flash("Could not load that video file"); });
    v.src = url;
  }

  // ---------- wire up ----------
  function init() {
    el.view = $("view"); el.timeline = $("timeline"); el.scrub = $("scrub");
    // captured (real pipeline) take, if embedded
    if (window.CAPTURED) {
      var cb = document.createElement("button"); cb.className = "mv-item captured"; cb.dataset.id = "captured";
      cb.innerHTML = '<span class="mv-name">◉ Captured take</span><span class="mv-sub">real 3D</span>';
      cb.addEventListener("click", function () { setPlaying(false); load("captured"); });
      $("mvList").appendChild(cb);
    }
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
    $("restartBtn").addEventListener("click", function () { setPlaying(false); state.frame = 0; impSeek(0); syncScrub(); refresh(); });
    $("stepB").addEventListener("click", function () { setPlaying(false); state.frame = Math.max(0, state.frame - 1); impSeek(state.frame); syncScrub(); refresh(); });
    $("stepF").addEventListener("click", function () { setPlaying(false); state.frame = Math.min(state.take.frames.length - 1, state.frame + 1); impSeek(state.frame); syncScrub(); refresh(); });
    $("speed").addEventListener("input", function (e) { state.speed = parseFloat(e.target.value); $("speedVal").textContent = state.speed.toFixed(2) + "×"; if (state.video) state.video.playbackRate = state.speed; });
    el.scrub.addEventListener("input", function (e) { setPlaying(false); state.frame = parseInt(e.target.value, 10); impSeek(state.frame); refresh(); });
    $("addKf").addEventListener("click", function () {
      if (state.take.imported) {
        impEnsureKey(state.frame);
        state.selected = state.keyframes.findIndex(function (k) { return k.frame === state.frame; });
        refresh(); flash("Pose captured at f" + state.frame); return;
      }
      state.keyframes.push({ frame: state.frame, name: "Keyframe", cat: (currentPhase() || {}).cat || "approach" });
      state.keyframes.sort(function (a, b) { return a.frame - b.frame; });
      state.selected = state.keyframes.findIndex(function (k) { return k.frame === state.frame; });
      refresh(); flash("Keyframe added at f" + state.frame);
    });
    $("delKf").addEventListener("click", function () {
      if (state.keyframes.length && state.selected >= 0) {
        var k = state.keyframes[state.selected];
        if (state.take.imported && k) delete state.take.dig[k.frame];
        state.keyframes.splice(state.selected, 1); state.selected = Math.max(0, state.selected - 1); refresh();
      }
    });
    // video import
    $("importVideoBtn").addEventListener("click", function () { $("videoFile").click(); });
    $("videoFile").addEventListener("change", function (e) { if (e.target.files && e.target.files[0]) importVideo(e.target.files[0]); e.target.value = ""; });
    el.view.addEventListener("dragover", function (e) { e.preventDefault(); });
    el.view.addEventListener("drop", function (e) {
      e.preventDefault(); var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f && f.type.indexOf("video") === 0) importVideo(f); else if (f) flash("Drop a video file");
    });
    // viewport skeleton drag (imported only)
    el.view.addEventListener("pointerdown", function (e) {
      if (!(state.take && state.take.imported)) return;
      var r = el.view.getBoundingClientRect(), j = impPickJoint(e.clientX - r.left, e.clientY - r.top);
      if (j) { setPlaying(false); impEnsureKey(state.frame); state.impDrag = j; el.view.setPointerCapture(e.pointerId); refresh(); }
    });
    el.view.addEventListener("pointermove", function (e) {
      if (!state.impDrag) return; var r = el.view.getBoundingClientRect(), L = state._impL; if (!L) return;
      var nx = (e.clientX - r.left - L.ox) / L.dW, ny = (e.clientY - r.top - L.oy) / L.dH;
      nx = Math.max(0, Math.min(1, nx)); ny = Math.max(0, Math.min(1, ny));
      if (state.take.dig[state.frame]) state.take.dig[state.frame][state.impDrag] = [nx, ny];
      refresh();
    });
    el.view.addEventListener("pointerup", function () { state.impDrag = null; });
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
      state.frame = frame; setPlaying(false); impSeek(frame); syncScrub(); refresh();
    });
    el.timeline.addEventListener("pointermove", function (e) {
      var frame = timelineFrameFromX(e.clientX);
      if (dragging && state.keyframes[state.selected]) {
        var old = state.keyframes[state.selected].frame;
        state.keyframes[state.selected].frame = frame;
        if (state.take.imported && state.take.dig[old]) { state.take.dig[frame] = state.take.dig[old]; if (frame !== old) delete state.take.dig[old]; }
      }
      state.frame = frame; impSeek(frame); syncScrub(); refresh();
    });
    el.timeline.addEventListener("pointerup", function () { dragging = false; state.keyframes.sort(function (a, b) { return a.frame - b.frame; }); refresh(); });

    window.addEventListener("resize", resize);
    document.addEventListener("keydown", function (e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); setPlaying(!state.playing); }
      else if (e.code === "ArrowLeft") { setPlaying(false); state.frame = Math.max(0, state.frame - 1); impSeek(state.frame); syncScrub(); refresh(); }
      else if (e.code === "ArrowRight") { setPlaying(false); state.frame = Math.min(state.take.frames.length - 1, state.frame + 1); impSeek(state.frame); syncScrub(); refresh(); }
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
