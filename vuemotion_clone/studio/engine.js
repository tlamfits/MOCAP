/* Movement Keyframe Studio — analysis engine (pure, browser + node).
 *
 * Kinematics only. A 2D sagittal/frontal stick athlete is driven by authored
 * segment-angle keyposes per movement; joints come from forward kinematics, and
 * every reported metric is computed FROM the joints (never the authoring angles)
 * so what you see on screen equals what is measured — the same contract the real
 * multi-camera pipeline uses. Procedural demo takes stand in until triangulated
 * keypoints from the P1 pipeline are wired in.
 */
(function (global) {
  "use strict";

  // Segment lengths (metres) for a ~1.75 m athlete.
  var SEG = { trunk: 0.52, head: 0.22, thigh: 0.44, shank: 0.42, foot: 0.21, uparm: 0.30, forearm: 0.28 };
  var GROUND_TOE = 0.06; // toe below this height (m) = ground contact

  var D2R = Math.PI / 180;

  // Neutral standing pose. All angles in degrees.
  // Leg/arm angles measured from the downward vertical, +ve = forward (+x).
  // trunk/head measured from the upward vertical, +ve = forward lean.
  function neutral() {
    return {
      px: 0, ph: 0.90, trunk: 4, head: 3,
      thighR: 3, shankR: 3, footR: 90, thighL: -3, shankL: -3, footL: 90,
      uaR: 8, faR: 12, uaL: -8, faL: -12
    };
  }

  function lerp(a, b, u) { return a + (b - a) * u; }
  function smooth(u) { return u * u * (3 - 2 * u); }

  // Interpolate a pose from authored keyposes (each {t, ...fields}) over neutral.
  function poseFromKeys(keys, t) {
    var p = neutral();
    if (!keys.length) return p;
    if (t <= keys[0].t) return merge(p, keys[0]);
    if (t >= keys[keys.length - 1].t) return merge(p, keys[keys.length - 1]);
    var i = 0;
    while (i < keys.length - 1 && t > keys[i + 1].t) i++;
    var a = keys[i], b = keys[i + 1];
    var u = smooth((t - a.t) / Math.max(1e-6, b.t - a.t));
    var out = merge(p, a);
    for (var k in b) {
      if (k === "t") continue;
      var av = a[k] != null ? a[k] : p[k];
      out[k] = lerp(av, b[k], u);
    }
    return out;
  }
  function merge(base, k) {
    var o = {}; for (var f in base) o[f] = base[f];
    for (var g in k) { if (g !== "t") o[g] = k[g]; }
    return o;
  }

  // Forward kinematics: pose -> world joints (metres, y-up).
  function fk(p) {
    var px = p.px, ph = p.ph;
    var pelvis = [px, ph];
    var tr = p.trunk * D2R, hd = p.head * D2R;
    var neck = [px + SEG.trunk * Math.sin(tr), ph + SEG.trunk * Math.cos(tr)];
    var head = [neck[0] + SEG.head * Math.sin(hd), neck[1] + SEG.head * Math.cos(hd)];
    function leg(th, sh, ft) {
      var thr = th * D2R, shr = sh * D2R, ftr = ft * D2R;
      var knee = [px + SEG.thigh * Math.sin(thr), ph - SEG.thigh * Math.cos(thr)];
      var ankle = [knee[0] + SEG.shank * Math.sin(shr), knee[1] - SEG.shank * Math.cos(shr)];
      var toe = [ankle[0] + SEG.foot * Math.sin(ftr), ankle[1] - SEG.foot * Math.cos(ftr)];
      return { knee: knee, ankle: ankle, toe: toe };
    }
    function arm(ua, fa) {
      var uar = ua * D2R, far = fa * D2R;
      var elbow = [neck[0] + SEG.uparm * Math.sin(uar), neck[1] - SEG.uparm * Math.cos(uar)];
      var wrist = [elbow[0] + SEG.forearm * Math.sin(far), elbow[1] - SEG.forearm * Math.cos(far)];
      return { elbow: elbow, wrist: wrist };
    }
    var R = leg(p.thighR, p.shankR, p.footR), L = leg(p.thighL, p.shankL, p.footL);
    var aR = arm(p.uaR, p.faR), aL = arm(p.uaL, p.faL);
    return {
      pelvis: pelvis, neck: neck, head: head,
      hipR: pelvis, kneeR: R.knee, ankleR: R.ankle, toeR: R.toe,
      hipL: pelvis, kneeL: L.knee, ankleL: L.ankle, toeL: L.toe,
      shoulderR: neck, elbowR: aR.elbow, wristR: aR.wrist,
      shoulderL: neck, elbowL: aL.elbow, wristL: aL.wrist
    };
  }

  function interior(A, B, C) { // interior angle at B, degrees
    var b1x = A[0] - B[0], b1y = A[1] - B[1], b2x = C[0] - B[0], b2y = C[1] - B[1];
    var d = (b1x * b2x + b1y * b2y) /
      (Math.hypot(b1x, b1y) * Math.hypot(b2x, b2y) + 1e-9);
    d = Math.max(-1, Math.min(1, d));
    return Math.acos(d) / D2R;
  }

  function jointAngles(j) {
    var lean = Math.atan2(j.neck[0] - j.pelvis[0], j.neck[1] - j.pelvis[1]) / D2R;
    return {
      trunkLean: lean,
      hipFlexR: 180 - interior(j.neck, j.pelvis, j.kneeR),
      kneeFlexR: 180 - interior(j.hipR, j.kneeR, j.ankleR),
      ankleR: interior(j.kneeR, j.ankleR, j.toeR),
      hipFlexL: 180 - interior(j.neck, j.pelvis, j.kneeL),
      kneeFlexL: 180 - interior(j.hipL, j.kneeL, j.ankleL),
      ankleL: interior(j.kneeL, j.ankleL, j.toeL),
      elbowR: 180 - interior(j.shoulderR, j.elbowR, j.wristR),
      kneeSep: (j.kneeR[0] - j.kneeL[0])
    };
  }

  // ---- Movement library --------------------------------------------------
  // cat colours: approach, loading, propulsion, flight, landing, plant, release
  var MOVEMENTS = {
    approach_jump: {
      name: "Approach Jump", view: "sagittal", fps: 60, frames: 120,
      blurb: "Run-up to a max vertical — penultimate to final plant to takeoff.",
      phases: [
        { id: "approach", name: "Approach", cat: "approach", t: 0.00 },
        { id: "pen", name: "Penultimate", cat: "plant", t: 0.30 },
        { id: "plant", name: "Final plant", cat: "loading", t: 0.48 },
        { id: "takeoff", name: "Takeoff", cat: "propulsion", t: 0.60 },
        { id: "flight", name: "Flight", cat: "flight", t: 0.66 },
        { id: "landing", name: "Landing", cat: "landing", t: 0.92 }
      ],
      keys: [
        { t: 0.00, px: -1.6, ph: 0.90, trunk: 12, thighR: 24, shankR: -6, thighL: -20, shankL: 34, uaR: -30, faR: -20, uaL: 30, faL: 20 },
        { t: 0.30, px: -0.9, ph: 0.86, trunk: 16, thighR: -18, shankR: 40, footR: 78, thighL: 22, shankL: -8, uaR: 40, uaL: -30 },
        { t: 0.48, px: -0.35, ph: 0.72, trunk: 22, thighR: 20, shankR: 34, footR: 74, thighL: 18, shankL: 30, footL: 74, uaR: -60, faR: -30, uaL: -60, faL: -30 },
        { t: 0.60, px: -0.1, ph: 1.02, trunk: 8, thighR: 6, shankR: 4, footR: 118, thighL: 4, shankL: 4, footL: 118, uaR: 150, faR: 165, uaL: 150, faL: 165 },
        { t: 0.66, px: 0.0, ph: 1.30, trunk: 4, thighR: 20, shankR: -30, thighL: 18, shankL: -28, footR: 120, footL: 120, uaR: 160, uaL: 160 },
        { t: 0.80, px: 0.05, ph: 1.34, trunk: 2, thighR: 24, shankR: -26, thighL: 22, shankL: -24, uaR: 120, uaL: 120 },
        { t: 0.92, px: 0.1, ph: 0.70, trunk: 26, thighR: 34, shankR: 40, footR: 78, thighL: 30, shankL: 38, footL: 78, uaR: -20, uaL: -20 },
        { t: 1.00, px: 0.12, ph: 0.82, trunk: 14, thighR: 12, shankR: 12, thighL: -12, shankL: 12 }
      ],
      metrics: ["approach_speed", "flight_time", "jump_height", "takeoff_angle", "plant_knee"]
    },

    throwing: {
      name: "Throwing", view: "sagittal", fps: 120, frames: 120,
      blurb: "Stride, cock, accelerate, release — dominant-arm sequencing.",
      phases: [
        { id: "windup", name: "Wind-up", cat: "loading", t: 0.00 },
        { id: "stride", name: "Stride", cat: "approach", t: 0.28 },
        { id: "plant", name: "Front plant", cat: "plant", t: 0.46 },
        { id: "cock", name: "Max cock", cat: "loading", t: 0.56 },
        { id: "release", name: "Release", cat: "release", t: 0.72 },
        { id: "follow", name: "Follow-through", cat: "landing", t: 0.9 }
      ],
      keys: [
        { t: 0.00, px: -0.2, ph: 0.92, trunk: -8, thighR: -6, thighL: 8, uaR: -20, faR: -60, uaL: -40, faL: -80 },
        { t: 0.28, px: -0.05, ph: 0.90, trunk: -6, thighR: -14, shankR: 20, thighL: 26, shankL: -10, footL: 100, uaR: -70, faR: -60, uaL: 20 },
        { t: 0.46, px: 0.05, ph: 0.88, trunk: 2, thighR: -8, shankR: 8, thighL: 20, shankL: 6, footL: 96, uaR: -120, faR: -80, uaL: 60 },
        { t: 0.56, px: 0.08, ph: 0.9, trunk: 10, thighL: 12, shankL: 2, uaR: -150, faR: -120, uaL: 90 },
        { t: 0.72, px: 0.12, ph: 0.9, trunk: 24, thighR: 10, thighL: 8, uaR: 60, faR: 40, uaL: 120 },
        { t: 0.86, px: 0.15, ph: 0.86, trunk: 40, thighR: 20, shankR: 30, thighL: 6, uaR: 120, faR: 100, uaL: 140 },
        { t: 1.00, px: 0.18, ph: 0.84, trunk: 46, thighR: 30, shankR: 40, footR: 80, uaR: 140, faR: 120 }
      ],
      metrics: ["front_plant_knee", "trunk_at_release", "elbow_at_release", "release_height", "release_speed"]
    },

    acceleration: {
      name: "Acceleration", view: "sagittal", fps: 120, frames: 132,
      blurb: "First strides out of a stance — drive, recover, touchdown, repeat.",
      phases: [
        { id: "s1c", name: "Drive R", cat: "propulsion", t: 0.02 },
        { id: "s1a", name: "Flight", cat: "flight", t: 0.18 },
        { id: "s2c", name: "Touchdown L", cat: "plant", t: 0.30 },
        { id: "s2a", name: "Flight", cat: "flight", t: 0.46 },
        { id: "s3c", name: "Touchdown R", cat: "plant", t: 0.58 },
        { id: "s3a", name: "Flight", cat: "flight", t: 0.74 },
        { id: "s4c", name: "Touchdown L", cat: "plant", t: 0.86 }
      ],
      keys: runKeys(),
      metrics: ["contact_time", "flight_time", "avg_speed", "trunk_lean", "touchdown_knee"]
    },

    broad_jump: {
      name: "Broad Jump", view: "sagittal", fps: 60, frames: 120,
      blurb: "Standing horizontal jump — countermovement, drive, reach, stick.",
      phases: [
        { id: "stance", name: "Stance", cat: "approach", t: 0.00 },
        { id: "cm", name: "Countermovement", cat: "loading", t: 0.28 },
        { id: "takeoff", name: "Takeoff", cat: "propulsion", t: 0.44 },
        { id: "flight", name: "Flight", cat: "flight", t: 0.52 },
        { id: "reach", name: "Reach", cat: "flight", t: 0.72 },
        { id: "landing", name: "Landing", cat: "landing", t: 0.9 }
      ],
      keys: [
        { t: 0.00, px: 0, ph: 0.90, trunk: 6, uaR: 8, uaL: -8 },
        { t: 0.20, px: 0, ph: 0.86, trunk: 18, thighR: 16, shankR: 24, footR: 76, thighL: 16, shankL: 24, footL: 76, uaR: -50, faR: -20, uaL: -50, faL: -20 },
        { t: 0.28, px: 0.02, ph: 0.66, trunk: 34, thighR: 34, shankR: 44, footR: 70, thighL: 34, shankL: 44, footL: 70, uaR: -80, faR: -30, uaL: -80, faL: -30 },
        { t: 0.44, px: 0.2, ph: 1.00, trunk: 30, thighR: -20, shankR: 30, footR: 130, thighL: -20, shankL: 30, footL: 130, uaR: 120, faR: 150, uaL: 120, faL: 150 },
        { t: 0.52, px: 0.5, ph: 1.16, trunk: 22, thighR: -40, shankR: 60, thighL: -40, shankL: 60, uaR: 150, uaL: 150 },
        { t: 0.72, px: 1.3, ph: 1.12, trunk: 10, thighR: 60, shankR: 30, footR: 110, thighL: 60, shankL: 30, footL: 110, uaR: 40, faR: 20, uaL: 40, faL: 20 },
        { t: 0.90, px: 2.0, ph: 0.64, trunk: 40, thighR: 56, shankR: 66, footR: 84, thighL: 56, shankL: 66, footL: 84, uaR: -30, uaL: -30 },
        { t: 1.00, px: 2.05, ph: 0.82, trunk: 20, thighR: 20, shankR: 20, thighL: 20, shankL: 20 }
      ],
      metrics: ["cm_depth", "distance", "takeoff_angle", "flight_time", "landing_knee"]
    },

    lateral_jump: {
      name: "Lateral Jump", view: "frontal", fps: 60, frames: 110,
      blurb: "Skater bound — load the outside leg, drive across, stick single-leg.",
      phases: [
        { id: "load", name: "Load (R)", cat: "loading", t: 0.10 },
        { id: "drive", name: "Drive", cat: "propulsion", t: 0.34 },
        { id: "flight", name: "Flight", cat: "flight", t: 0.5 },
        { id: "land", name: "Land (L)", cat: "landing", t: 0.82 }
      ],
      keys: [
        { t: 0.00, px: 0.0, ph: 0.90, trunk: 0, thighR: 6, thighL: -6, uaR: 20, uaL: -20 },
        { t: 0.10, px: 0.1, ph: 0.70, trunk: 8, thighR: 30, shankR: -34, footR: 70, thighL: 8, shankL: -12, uaR: 50, uaL: -30 },
        { t: 0.34, px: 0.2, ph: 0.94, trunk: 6, thighR: -6, shankR: 8, thighL: -20, shankL: 20, uaR: -30, uaL: 40 },
        { t: 0.50, px: 0.5, ph: 1.02, trunk: 2, thighR: -18, shankR: 26, thighL: -30, shankL: 34, uaR: -20, uaL: 30 },
        { t: 0.82, px: 0.85, ph: 0.68, trunk: 6, thighL: 30, shankL: -34, footL: 70, thighR: 10, shankR: -10, uaL: 50, uaR: -30 },
        { t: 1.00, px: 0.9, ph: 0.86, trunk: 2, thighL: 8, shankL: -6, thighR: -6 }
      ],
      metrics: ["load_depth", "lateral_distance", "flight_time", "land_knee", "knee_valgus"]
    },

    l_hop: {
      name: "L-Hop", view: "sagittal", fps: 60, frames: 150,
      blurb: "Single-leg L pattern — forward hops then a lateral redirect.",
      phases: [
        { id: "h1", name: "Hop 1", cat: "propulsion", t: 0.08 },
        { id: "c1", name: "Contact 1", cat: "plant", t: 0.24 },
        { id: "h2", name: "Hop 2", cat: "propulsion", t: 0.40 },
        { id: "c2", name: "Contact 2", cat: "plant", t: 0.56 },
        { id: "turn", name: "Redirect", cat: "loading", t: 0.70 },
        { id: "c3", name: "Contact 3", cat: "landing", t: 0.88 }
      ],
      keys: hopKeys(3, 0.55),
      metrics: ["contact_time", "flight_time", "hop_distance", "contact_knee", "reactive_index"]
    },

    pent_hop: {
      name: "Pent Hop", view: "sagittal", fps: 60, frames: 170,
      blurb: "Five reactive hops — track contact time and stiffness hop to hop.",
      phases: [
        { id: "c1", name: "Contact 1", cat: "plant", t: 0.12 },
        { id: "c2", name: "Contact 2", cat: "plant", t: 0.30 },
        { id: "c3", name: "Contact 3", cat: "plant", t: 0.48 },
        { id: "c4", name: "Contact 4", cat: "plant", t: 0.66 },
        { id: "c5", name: "Contact 5", cat: "landing", t: 0.84 }
      ],
      keys: hopKeys(5, 0.4),
      metrics: ["contact_time", "flight_time", "hop_distance", "contact_knee", "reactive_index"]
    },

    cod: {
      name: "Change of Direction", view: "frontal", fps: 120, frames: 130,
      blurb: "Decelerate, plant, redirect — the injury-risk window on the cut.",
      phases: [
        { id: "approach", name: "Approach", cat: "approach", t: 0.00 },
        { id: "pen", name: "Penultimate", cat: "plant", t: 0.30 },
        { id: "plant", name: "Cut plant", cat: "loading", t: 0.50 },
        { id: "push", name: "Redirect", cat: "propulsion", t: 0.64 },
        { id: "exit", name: "Re-accelerate", cat: "flight", t: 0.82 }
      ],
      keys: [
        { t: 0.00, px: -1.4, ph: 0.90, trunk: 10, thighR: 20, shankR: -6, thighL: -18, shankL: 30, uaR: -20, uaL: 20 },
        { t: 0.30, px: -0.7, ph: 0.84, trunk: 6, thighR: -20, shankR: 34, footR: 80, thighL: 22, shankL: -6, uaR: 30, uaL: -20 },
        { t: 0.50, px: -0.2, ph: 0.70, trunk: -14, thighR: 30, shankR: 30, footR: 76, thighL: 12, shankL: 24, footL: 78, uaR: -30, uaL: 40 },
        { t: 0.64, px: 0.0, ph: 0.80, trunk: -18, thighR: 14, shankR: 16, thighL: -10, shankL: 20, uaR: -20, uaL: 50 },
        { t: 0.82, px: 0.5, ph: 0.88, trunk: -20, thighR: -18, shankR: 30, thighL: 22, shankL: -6, uaR: 40, uaL: -30 },
        { t: 1.00, px: 1.1, ph: 0.88, trunk: -16, thighR: 22, shankR: -6, thighL: -18, shankL: 28 }
      ],
      metrics: ["approach_speed", "plant_knee", "plant_trunk", "knee_valgus", "contact_time"]
    }
  };

  // cyclic sprint keyposes (alternating legs, forward progression, bob).
  function runKeys() {
    var keys = [], n = 8, dist = 3.2;
    for (var i = 0; i <= n; i++) {
      var t = i / n, ph = t; // fraction
      var stanceR = (i % 2 === 0);
      var bob = 0.90 + 0.05 * Math.sin(t * n * Math.PI); // vertical oscillation
      keys.push({
        t: ph,
        px: -1.6 + dist * (t * t * 0.6 + t * 0.4), // accelerating progression
        ph: stanceR ? bob - 0.04 : bob + 0.02,
        trunk: 34 - 16 * t, // rise from deep lean
        thighR: stanceR ? -16 : 42, shankR: stanceR ? 18 : -30, footR: stanceR ? 84 : 118,
        thighL: stanceR ? 42 : -16, shankL: stanceR ? -30 : 18, footL: stanceR ? 118 : 84,
        uaR: stanceR ? 70 : -50, faR: stanceR ? 90 : 100,
        uaL: stanceR ? -50 : 70, faL: stanceR ? 100 : 90
      });
    }
    return keys;
  }

  // repeated hops: n contacts, stride length s (m). Single-leg (right) reactive.
  function hopKeys(n, s) {
    var keys = [], steps = n * 2 + 1;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var contact = (i % 2 === 1);
      keys.push({
        t: t,
        px: s * (i * 0.5),
        ph: contact ? 0.74 : 1.0,
        trunk: contact ? 14 : 6,
        thighR: contact ? 30 : -30, shankR: contact ? 34 : 46, footR: contact ? 74 : 130,
        thighL: contact ? 18 : 24, shankL: contact ? 26 : -40, footL: contact ? 120 : 120,
        uaR: contact ? 40 : 120, uaL: contact ? -30 : 120
      });
    }
    return keys;
  }

  // ---- Take generation + metrics ----------------------------------------
  function generateTake(id) {
    var m = MOVEMENTS[id];
    var N = m.frames, frames = [];
    for (var f = 0; f < N; f++) {
      var t = f / (N - 1);
      var pose = poseFromKeys(m.keys, t);
      var joints = fk(pose);
      frames.push({ f: f, t: t, pose: pose, joints: joints, angles: jointAngles(joints), airborne: airborne(joints) });
    }
    var events = m.phases.map(function (p) {
      return { id: p.id, name: p.name, cat: p.cat, frame: Math.round(p.t * (N - 1)) };
    });
    return { id: id, name: m.name, view: m.view, fps: m.fps, frames: frames, phases: m.phases, events: events, metricKeys: m.metrics };
  }

  function airborne(j) { return j.toeR[1] > GROUND_TOE && j.toeL[1] > GROUND_TOE; }

  function metricValue(key, take) {
    var fr = take.frames, fps = take.fps, N = fr.length;
    function comV(i) { // COM (pelvis) velocity m/s
      var a = fr[Math.max(0, i - 1)].joints.pelvis, b = fr[Math.min(N - 1, i + 1)].joints.pelvis;
      var dt = (Math.min(N - 1, i + 1) - Math.max(0, i - 1)) / fps;
      return [(b[0] - a[0]) / dt, (b[1] - a[1]) / dt];
    }
    function firstTakeoff() { for (var i = 1; i < N; i++) if (fr[i].airborne && !fr[i - 1].airborne) return i; return -1; }
    function firstLandingAfter(k) { for (var i = k + 1; i < N; i++) if (!fr[i].airborne && fr[i - 1].airborne) return i; return -1; }
    function peakCOM() { var m = -1, mi = 0; for (var i = 0; i < N; i++) if (fr[i].joints.pelvis[1] > m) { m = fr[i].joints.pelvis[1]; mi = i; } return { h: m, i: mi }; }
    function contactFrames() { var c = 0; for (var i = 0; i < N; i++) if (!fr[i].airborne) c++; return c; }
    function airFrames() { var c = 0; for (var i = 0; i < N; i++) if (fr[i].airborne) c++; return c; }
    function minPelvis() { var m = 9, mi = 0; for (var i = 0; i < N; i++) if (fr[i].joints.pelvis[1] < m) { m = fr[i].joints.pelvis[1]; mi = i; } return { h: m, i: mi }; }

    var to, la, pk;
    switch (key) {
      case "approach_speed": {
        to = firstTakeoff(); var i = to > 8 ? to - 6 : Math.floor(N * 0.3);
        return { label: "Approach speed", val: Math.abs(comV(i)[0]), unit: "m/s", fmt: 1 };
      }
      case "avg_speed": {
        var d = fr[N - 1].joints.pelvis[0] - fr[0].joints.pelvis[0];
        return { label: "Avg speed", val: d / (N / fps), unit: "m/s", fmt: 1 };
      }
      case "flight_time": {
        to = firstTakeoff(); la = firstLandingAfter(to);
        var t = (to >= 0 && la > to) ? (la - to) / fps : airFrames() / fps;
        return { label: "Flight time", val: t * 1000, unit: "ms", fmt: 0 };
      }
      case "contact_time": {
        return { label: "Contact time", val: (contactFrames() / Math.max(1, countContacts(fr))) / fps * 1000, unit: "ms", fmt: 0 };
      }
      case "jump_height": {
        to = firstTakeoff(); pk = peakCOM();
        var base = to >= 0 ? fr[to].joints.pelvis[1] : fr[0].joints.pelvis[1];
        return { label: "Jump height", val: Math.max(0, pk.h - base) * 100, unit: "cm", fmt: 0 };
      }
      case "takeoff_angle": {
        to = firstTakeoff(); if (to < 0) to = Math.floor(N * 0.5);
        var v = comV(to); return { label: "Takeoff angle", val: Math.atan2(v[1], Math.abs(v[0]) + 1e-3) / D2R, unit: "°", fmt: 0 };
      }
      case "distance": {
        to = firstTakeoff(); la = firstLandingAfter(to);
        var a = to >= 0 ? fr[to].joints.pelvis[0] : fr[0].joints.pelvis[0];
        var b = la > 0 ? fr[la].joints.pelvis[0] : fr[N - 1].joints.pelvis[0];
        return { label: "Distance", val: (b - a), unit: "m", fmt: 2 };
      }
      case "lateral_distance": {
        return { label: "Lateral distance", val: fr[N - 1].joints.pelvis[0] - fr[0].joints.pelvis[0], unit: "m", fmt: 2 };
      }
      case "hop_distance": {
        return { label: "Mean hop", val: (fr[N - 1].joints.pelvis[0] - fr[0].joints.pelvis[0]) / Math.max(1, countContacts(fr)), unit: "m", fmt: 2 };
      }
      case "cm_depth": case "load_depth": {
        pk = minPelvis(); return { label: "Countermovement depth", val: (fr[0].joints.pelvis[1] - pk.h) * 100, unit: "cm", fmt: 0 };
      }
      case "reactive_index": {
        var ct = contactFrames() / Math.max(1, countContacts(fr)) / fps;
        var ft = airFrames() / Math.max(1, countContacts(fr)) / fps;
        return { label: "Reactive index", val: ft / Math.max(0.02, ct), unit: "", fmt: 2 };
      }
      case "plant_knee": case "landing_knee": case "land_knee": case "contact_knee": case "touchdown_knee": case "front_plant_knee": {
        var mk = maxAt(fr, function (x) { return !x.airborne; }, function (x) { return x.angles.kneeFlexR; });
        return { label: "Peak knee flex", val: mk, unit: "°", fmt: 0 };
      }
      case "plant_trunk": case "trunk_lean": {
        var mt = extreme(fr, function (x) { return x.angles.trunkLean; });
        return { label: "Peak trunk lean", val: mt, unit: "°", fmt: 0 };
      }
      case "trunk_at_release": {
        var ri = releaseFrame(fr); return { label: "Trunk @ release", val: fr[ri].angles.trunkLean, unit: "°", fmt: 0 };
      }
      case "elbow_at_release": {
        var ri2 = releaseFrame(fr); return { label: "Elbow @ release", val: fr[ri2].angles.elbowR, unit: "°", fmt: 0 };
      }
      case "release_height": {
        var ri3 = releaseFrame(fr); return { label: "Release height", val: fr[ri3].joints.wristR[1] * 100, unit: "cm", fmt: 0 };
      }
      case "release_speed": {
        var ri4 = releaseFrame(fr);
        var a2 = fr[Math.max(0, ri4 - 1)].joints.wristR, b2 = fr[Math.min(N - 1, ri4 + 1)].joints.wristR;
        var dt2 = 2 / fps; return { label: "Hand speed", val: Math.hypot(b2[0] - a2[0], b2[1] - a2[1]) / dt2, unit: "m/s", fmt: 1 };
      }
      case "knee_valgus": {
        var mv = maxAt(fr, function (x) { return !x.airborne; }, function (x) { return -x.angles.kneeSep; });
        return { label: "Knee sep (valgus proxy)", val: mv * 100, unit: "cm", fmt: 1, caveat: true };
      }
    }
    return { label: key, val: 0, unit: "", fmt: 0 };
  }

  function countContacts(fr) { var c = 0; for (var i = 1; i < fr.length; i++) if (!fr[i].airborne && fr[i - 1].airborne) c++; return Math.max(1, c); }
  function maxAt(fr, filter, val) { var m = -1e9; for (var i = 0; i < fr.length; i++) if (filter(fr[i])) m = Math.max(m, val(fr[i])); return m === -1e9 ? 0 : m; }
  function extreme(fr, val) { var m = 0; for (var i = 0; i < fr.length; i++) if (Math.abs(val(fr[i])) > Math.abs(m)) m = val(fr[i]); return m; }
  function releaseFrame(fr) { // fastest forward hand
    var best = 0, bi = Math.floor(fr.length * 0.7);
    for (var i = 1; i < fr.length - 1; i++) {
      var v = fr[i + 1].joints.wristR[0] - fr[i - 1].joints.wristR[0];
      if (v > best) { best = v; bi = i; }
    }
    return bi;
  }

  function metrics(take) { return take.metricKeys.map(function (k) { return metricValue(k, take); }); }

  var API = { SEG: SEG, MOVEMENTS: MOVEMENTS, generateTake: generateTake, jointAngles: jointAngles, fk: fk, metrics: metrics, metricValue: metricValue, GROUND_TOE: GROUND_TOE };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  global.MKS = API;
})(typeof window !== "undefined" ? window : globalThis);
