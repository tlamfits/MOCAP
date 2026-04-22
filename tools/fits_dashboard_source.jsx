import { useState, useEffect } from "react";

// ─── Color Palette (warm brown broadcast aesthetic) ─────────────────
const C = {
  bg: "#1a1209",
  cardBg: "#261c0f",
  cardBorder: "rgba(255,140,40,0.15)",
  cardBorderHover: "rgba(255,140,40,0.4)",
  orange: "#ff8c28",
  orangeDim: "#cc6a10",
  green: "#3ddc52",
  greenDim: "#2a9e3a",
  red: "#ff4444",
  cream: "#f5e6d0",
  muted: "#8a7a66",
  mutedLight: "#b5a48e",
  darkPanel: "#1e150b",
};

// ─── Mock Data ──────────────────────────────────────────────────────
const ATHLETE = { name: "KINETIC ATHLETE", status: "PRO-1", rank: "#142", weeklyGain: "+2.4%", avatar: "AM" };

const COMPOSITES = [
  {
    id: "jsq", label: "JOINT SYSTEM QUALITY", badge: "STABLE", badgeColor: C.green, score: 89,
    preview: { type: "ring", joints: [{ name: "ANKLE", val: 92 }, { name: "KNEE", val: 84 }, { name: "HIP", val: 91 }] },
    description: "Structural architecture and usable range across five joint systems. The gateway between structure and coordination.",
    subMetrics: [
      { name: "Ankle Dorsiflexion", score: 92, max: 100, status: "elite" },
      { name: "Knee Stability Index", score: 84, max: 100, status: "competitive" },
      { name: "Hip IR / ER Composite", score: 91, max: 100, status: "elite" },
      { name: "Thoracic Rotation", score: 86, max: 100, status: "competitive" },
      { name: "Shoulder Flex / ER", score: 88, max: 100, status: "elite" },
    ],
    flags: [{ text: "Knee stability lowest — monitor during deceleration patterns", severity: "mild" }],
    insight: "Range is a prerequisite quality. If you can't access the position, you can't stabilize it. Hardware problems cannot be solved with cueing alone.",
  },
  {
    id: "csq", label: "CORE STABILITY", badge: "ELITE", badgeColor: C.green, score: 94.2,
    preview: { type: "sliders", items: [{ name: "LAT", val: 92 }, { name: "ANT", val: 96, highlight: true }, { name: "POS", val: 94 }] },
    description: "System-wide stability across five joint systems governed by Triple C: Centration, Co-activation, Coordination. 18 qualities across Hip, Knee, Ankle/Foot, Shoulder, Trunk.",
    subMetrics: [
      { name: "Hip System (6 CSQ)", score: 94, max: 100, status: "elite" },
      { name: "Knee System (1 CSQ)", score: 91, max: 100, status: "elite" },
      { name: "Ankle & Foot (2 CSQ)", score: 92, max: 100, status: "elite" },
      { name: "Shoulder System (3 CSQ)", score: 96, max: 100, status: "elite" },
      { name: "Trunk System (6 CSQ)", score: 95, max: 100, status: "elite" },
    ],
    universals: [
      { name: "Canister Organization", avg: 2.8, min: 2.5 },
      { name: "Leg Line Control", avg: 2.7, min: 2.4 },
      { name: "Upper Chain Linkage", avg: 2.9, min: 2.6 },
      { name: "Controlled Bandwidth", avg: 2.7, min: 2.3 },
    ],
    flags: [{ text: "Break Point: Controlled Bandwidth under reactive demand — MOQ 2.3", severity: "mild" }],
    insight: "The minimum score (break point) is always the programming priority. It identifies where the stability platform fails first under demand.",
  },
  {
    id: "engine", label: "ENGINE QUALITY", badge: "PL-4", badgeColor: C.green, score: 92,
    preview: { type: "bigNumber", phase: "PL-4" },
    description: "Six engine qualities defining force production capacity. The engine determines how much force movement solutions can generate.",
    subMetrics: [
      { name: "Maximum Strength", score: 90, max: 100, pl: 4, status: "elite" },
      { name: "Power (Propulsion)", score: 94, max: 100, pl: 4, status: "elite" },
      { name: "Speed", score: 88, max: 100, pl: 3, status: "competitive" },
      { name: "Position-Specific ISO", score: 95, max: 100, pl: 4, status: "elite" },
      { name: "Eccentric Control", score: 91, max: 100, pl: 4, status: "elite" },
      { name: "Reactivity", score: 93, max: 100, pl: 4, status: "elite" },
    ],
    flags: [{ text: "Speed is relative limiter at PL-3 — target velocity-specific training", severity: "mild" }],
    insight: "Engine qualities are scored on Performance Level 1–4. Quality of organization shows up in Movement Skill scores at Layer 3+.",
  },
  {
    id: "esd", label: "ENERGY SYSTEMS", badge: null, badgeColor: null, score: 85,
    preview: { type: "bars", items: [{ name: "ALACTIC", val: 98, color: C.orange }, { name: "LACTIC POWER", val: 72, color: C.orange }, { name: "AEROBIC BASE", val: 85, color: C.muted }] },
    description: "Energy system capacity sustains everything under repeated demand. ESD is a programming variable — the same exercise targets different systems based on work:rest ratios.",
    subMetrics: [
      { name: "Alactic Power (ATP-PC)", score: 98, max: 100, status: "elite" },
      { name: "Lactic Power (Anaerobic)", score: 72, max: 100, status: "competitive" },
      { name: "Aerobic Base", score: 85, max: 100, status: "elite" },
      { name: "Repeat Sprint Ability", score: 78, max: 100, status: "competitive" },
      { name: "Recovery Quality", score: 88, max: 100, status: "elite" },
    ],
    flags: [
      { text: "Lactic power is the limiter — glycolytic capacity training needed", severity: "moderate" },
      { text: "Alactic system is elite — explosive repeat capacity strong", severity: "positive" },
    ],
    insight: "When energy systems deplete, elastic efficiency degrades, compensations accumulate, and injury risk rises. ESD protects the integrity of the entire Movement System.",
  },
  {
    id: "jump", label: "JUMP SYMMETRY", badge: null, badgeColor: null, score: 88,
    preview: { type: "symmetry", left: 28.4, right: 27.9, deviation: 0.5 },
    description: "Force plate–derived engine profile from CMJ, Drop Jump, and IMTP. Foundation × Technique × Engine = Elite Jump.",
    subMetrics: [
      { name: "Max Strength (IMTP)", score: 90, max: 100, status: "elite" },
      { name: "Propulsion (CMJ)", score: 88, max: 100, status: "elite" },
      { name: "Reactivity (DJ)", score: 92, max: 100, status: "elite" },
      { name: "Eccentric Loading", score: 82, max: 100, status: "competitive" },
    ],
    symmetry: [
      { name: "Eccentric", pct: 4, favor: "R" },
      { name: "Reactive", pct: 3, favor: "L" },
      { name: "Propulsive", pct: 2, favor: "R" },
      { name: "Landing", pct: 6, favor: "R" },
    ],
    timing: [
      { name: "Braking Phase", value: "0.19s" },
      { name: "Propulsive Phase", value: "0.24s" },
      { name: "Contact Time (DJ)", value: "0.26s" },
      { name: "RSI", value: "1.82" },
    ],
    flags: [{ text: "Eccentric loading is lowest composite — invest in braking system", severity: "mild" }],
    insight: "Scores derived from normative comparison by age, sex, and sport. A perfectly symmetrical athlete scores 100; 15% asymmetry ≈ 50.",
  },
  {
    id: "arm", label: "ARM DEVELOPMENT", badge: null, badgeColor: null, score: 87,
    preview: { type: "armStats", power: 8.4, velocity: 92 },
    description: "5 composite throwing qualities driven by 5 foundation arm qualities. Diagnostic triangle: Phase Evaluation → Composite Score → Foundation Intervention.",
    compositeQualities: [
      { name: "Tilt & Rotation Power", score: 4.2, max: 5 },
      { name: "Scapular Connection", score: 4.0, max: 5 },
      { name: "Trunk Control", score: 4.4, max: 5 },
      { name: "Lead Elbow Pull", score: 4.1, max: 5 },
      { name: "Arm Acceleration & Control", score: 3.8, max: 5 },
    ],
    foundationQualities: [
      { name: "General Upper Body Strength", score: 85, max: 100 },
      { name: "Range (Thoracic + Shoulder)", score: 90, max: 100 },
      { name: "Special Shoulder Strength", score: 78, max: 100 },
      { name: "Rotation Power", score: 88, max: 100 },
      { name: "Arm Acceleration", score: 82, max: 100 },
    ],
    flags: [{ text: "Arm Acceleration & Control lowest composite — elastic whip is the development edge", severity: "mild" }],
    insight: "Composite qualities reduce cognitive load by chunking complex mechanics into 5 trainable solutions. The brain stores skills as global movement solutions.",
  },
];

const WORKOUT = { label: "NEXT SESSION", title: "POWER PHASE 2", countdown: 2 * 3600 + 14 * 60 + 55,
  blocks: [
    { name: "Foundation Development Routine", dur: "12 min", type: "FDR" },
    { name: "Flight Complex — Approach Jump", dur: "15 min", type: "FLIGHT" },
    { name: "Engine Block — Lower Body Power", dur: "25 min", type: "ENGINE" },
    { name: "ESD — Repeat Effort Series", dur: "10 min", type: "ESD" },
  ],
};

const QUOTE = { text: 'THE DIFFERENCE BETWEEN ELITE AND OBSESSED IS PURELY A MATTER OF DATA.', highlights: ["ELITE", "OBSESSED"] };

const HABITS = { streak: 12, days: [
  { d: "M", slots: [1, 1] }, { d: "T", slots: [1, 1] }, { d: "W", slots: [1, 1] },
  { d: "T", slots: [1, 0] }, { d: "F", slots: [1, 1] }, { d: "S", slots: [1, 1] }, { d: "S", slots: [0, 0] },
]};

// ─── Utility Components ────────────────────────────────────────────

const ScoreRing = ({ score, size = 110 }) => {
  const sw = 5; const r = (size - sw * 2) / 2; const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,140,40,0.1)" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.orange} strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={circ - (score/100)*circ} strokeLinecap="round" />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize: size * 0.35, color: C.cream, lineHeight:1 }}>{score}</span>
        <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize: 10, color: C.muted, letterSpacing:2, fontWeight:600 }}>SCORE</span>
      </div>
    </div>
  );
};

const Bar = ({ value, max = 100, color = C.orange, h = 8, bg = "rgba(255,255,255,0.06)" }) => (
  <div style={{ width:"100%", height:h, background:bg, borderRadius: h/2 }}>
    <div style={{ width:`${(value/max)*100}%`, height:"100%", background:color, borderRadius:h/2, transition:"width 0.6s ease" }} />
  </div>
);

const Badge = ({ text, color }) => (
  <span style={{
    padding: "3px 10px", borderRadius: 4, fontSize: 10, fontWeight: 700,
    fontFamily: "'Rajdhani',sans-serif", letterSpacing: 1.5,
    background: `${color}22`, color, border: `1px solid ${color}44`,
  }}>{text}</span>
);

const Slider = ({ val, highlight }) => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, flex:1 }}>
    <div style={{ width:8, height:60, background:"rgba(255,255,255,0.06)", borderRadius:4, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", bottom:0, width:"100%", height:`${val}%`, background: C.green, borderRadius:4, opacity: highlight ? 1 : 0.6 }} />
    </div>
  </div>
);

const FlagBadge = ({ flag }) => {
  const colors = { mild: C.orange, moderate: C.red, positive: C.green };
  const c = colors[flag.severity] || C.orange;
  return (
    <div style={{ padding:"8px 12px", background:`${c}11`, border:`1px solid ${c}33`, borderRadius:8, marginBottom:6 }}>
      <span style={{ fontSize:11, color:c, fontFamily:"'Rajdhani',sans-serif", fontWeight:600 }}>{flag.text}</span>
    </div>
  );
};

// ─── Card Preview Renderers ────────────────────────────────────────

const PreviewRing = ({ data }) => (
  <div>
    <div style={{ display:"flex", justifyContent:"center", padding:"8px 0 16px" }}>
      <ScoreRing score={data.score} />
    </div>
    <div style={{ display:"flex", justifyContent:"space-around" }}>
      {data.preview.joints.map((j, i) => (
        <div key={i} style={{ textAlign:"center" }}>
          <span style={{ fontSize:11, color:C.muted, fontFamily:"'Rajdhani',sans-serif", fontWeight:600 }}>{j.name}: </span>
          <span style={{ fontSize:11, color:C.cream, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:1 }}>{j.val}</span>
        </div>
      ))}
    </div>
  </div>
);

const PreviewSliders = ({ data }) => (
  <div>
    <div style={{ display:"flex", gap:20, justifyContent:"center", padding:"12px 0 8px" }}>
      {data.preview.items.map((s, i) => <Slider key={i} val={s.val} highlight={s.highlight} />)}
    </div>
    <div style={{ display:"flex", justifyContent:"space-around", marginBottom:12 }}>
      {data.preview.items.map((s, i) => (
        <span key={i} style={{ fontSize:11, color: s.highlight ? C.green : C.muted, fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:1 }}>{s.name}</span>
      ))}
    </div>
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"rgba(0,0,0,0.3)", borderRadius:8 }}>
      <span style={{ fontSize:14, color:C.green }}>◎</span>
      <span style={{ fontSize:12, color:C.muted, fontFamily:"'Rajdhani',sans-serif", fontWeight:600 }}>COMPOSITE:</span>
      <span style={{ fontSize:14, color:C.green, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:1 }}>{data.score}</span>
    </div>
  </div>
);

const PreviewBigNumber = ({ data }) => (
  <div style={{ position:"relative", overflow:"hidden", minHeight: 100 }}>
    <div style={{ position:"absolute", right:-10, top:-10, fontSize:120, fontFamily:"'Bebas Neue',sans-serif", color:"rgba(255,140,40,0.06)", lineHeight:1 }}>{data.score}</div>
    <div style={{ position:"relative", zIndex:1 }}>
      <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:8 }}>
        <span style={{ fontSize:56, fontFamily:"'Bebas Neue',sans-serif", color:C.green, lineHeight:1 }}>{data.score}</span>
        <span style={{ fontSize:16, color:C.muted, fontFamily:"'Rajdhani',sans-serif", fontWeight:500 }}>/ 100</span>
      </div>
      <Badge text={`PHASE: ${data.preview.phase}`} color={C.green} />
      <div style={{ marginTop:12, height:6, background:"rgba(255,255,255,0.06)", borderRadius:3 }}>
        <div style={{ width:`${data.score}%`, height:"100%", background:`linear-gradient(90deg, ${C.orangeDim}, ${C.green})`, borderRadius:3 }} />
      </div>
    </div>
  </div>
);

const PreviewBars = ({ data }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:14, padding:"8px 0" }}>
    {data.preview.items.map((b, i) => (
      <div key={i}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <span style={{ fontSize:12, color:C.muted, fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:1 }}>{b.name}</span>
          <span style={{ fontSize:13, color: i === 0 ? C.green : C.orange, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:1 }}>{b.val}%</span>
        </div>
        <Bar value={b.val} color={i === 0 ? C.orange : i === 1 ? C.orange : C.muted} h={10} />
      </div>
    ))}
  </div>
);

const PreviewSymmetry = ({ data }) => (
  <div>
    <div style={{ display:"flex", gap:10, marginBottom:12, marginTop:8 }}>
      {[{ label: "LEFT PEAK", val: data.preview.left }, { label: "RIGHT PEAK", val: data.preview.right }].map((p, i) => (
        <div key={i} style={{ flex:1, padding:"12px 14px", background:"rgba(0,0,0,0.3)", borderRadius:8, border:`1px solid ${C.cardBorder}` }}>
          <div style={{ fontSize:10, color:C.muted, fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:1.5 }}>{p.label}</div>
          <div><span style={{ fontSize:28, fontFamily:"'Bebas Neue',sans-serif", color:C.cream }}>{p.val}</span><span style={{ fontSize:13, color:C.muted, marginLeft:3 }}>in</span></div>
        </div>
      ))}
    </div>
    <div style={{ textAlign:"center" }}>
      <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, position:"relative", marginBottom:6 }}>
        <div style={{ position:"absolute", left:"50%", top:-2, width:8, height:8, borderRadius:4, background:C.green, transform:"translateX(-50%)" }} />
      </div>
      <span style={{ fontSize:12, color:C.green, fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:1 }}>{data.preview.deviation}" LATERAL DEVIATION</span>
    </div>
  </div>
);

const PreviewArm = ({ data }) => (
  <div style={{ display:"flex", alignItems:"center", gap:16, padding:"12px 0" }}>
    <div style={{ width:70, height:70, borderRadius:"50%", background:"rgba(255,140,40,0.08)", border:`1px solid ${C.cardBorder}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 4L4 28h24L16 4z" stroke={C.orange} strokeWidth="1.5" fill="rgba(255,140,40,0.1)" />
        <path d="M12 20l4-8 4 8" stroke={C.cream} strokeWidth="1.5" />
        <path d="M10 16l6 6 6-6" stroke={C.orange} strokeWidth="1" opacity="0.5" />
      </svg>
    </div>
    <div style={{ flex:1 }}>
      <div style={{ marginBottom:8 }}>
        <span style={{ fontSize:10, color:C.muted, fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:1.5 }}>POWER</span>
        <div><span style={{ fontSize:28, fontFamily:"'Bebas Neue',sans-serif", color:C.cream }}>{data.preview.power}</span><span style={{ fontSize:12, color:C.muted, marginLeft:2 }}>KN</span></div>
      </div>
      <div>
        <span style={{ fontSize:10, color:C.muted, fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:1.5 }}>VELOCITY</span>
        <div><span style={{ fontSize:28, fontFamily:"'Bebas Neue',sans-serif", color:C.cream }}>{data.preview.velocity}</span><span style={{ fontSize:12, color:C.muted, marginLeft:2 }}>%</span></div>
      </div>
    </div>
  </div>
);

const PREVIEW_MAP = { ring: PreviewRing, sliders: PreviewSliders, bigNumber: PreviewBigNumber, bars: PreviewBars, symmetry: PreviewSymmetry, armStats: PreviewArm };

const statusTone = (status) => {
  if (status === "elite") return C.green;
  if (status === "competitive") return C.orange;
  return C.muted;
};

const formatScore = (n) => (typeof n === "number" && n % 1 !== 0 ? n.toFixed(1) : String(n));

const SubMetricRow = ({ m }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
      <span style={{ fontSize: 12, color: C.cream, fontFamily: "'Rajdhani',sans-serif", fontWeight: 600 }}>{m.name}</span>
      <span style={{ fontSize: 13, color: statusTone(m.status), fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>
        {m.score}/{m.max}
        {m.pl != null ? <span style={{ fontSize: 10, color: C.muted, marginLeft: 6 }}>PL-{m.pl}</span> : null}
      </span>
    </div>
    <Bar value={m.score} max={m.max} />
  </div>
);

const ExpandedGeneric = ({ data, onClose }) => {
  const Preview = PREVIEW_MAP[data.preview.type];
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.82)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflow: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative", width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto",
          background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: "22px 20px 24px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: 8,
            border: `1px solid ${C.cardBorder}`, background: "rgba(0,0,0,0.35)", color: C.cream,
            fontSize: 22, lineHeight: 1, cursor: "pointer", fontFamily: "system-ui,sans-serif",
          }}
          aria-label="Close"
        >
          ×
        </button>
        <div style={{ marginBottom: 16, paddingRight: 36 }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 2, fontWeight: 700, marginBottom: 6 }}>COMPOSITE</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: C.cream, letterSpacing: 1, lineHeight: 1.1 }}>{data.label}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {data.badge ? <Badge text={data.badge} color={data.badgeColor || C.green} /> : null}
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: C.green }}>{formatScore(data.score)}</span>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.cardBorder}` }}>
          <Preview data={data} />
        </div>
        <p style={{ fontSize: 13, color: C.mutedLight, lineHeight: 1.65, marginBottom: 20 }}>{data.description}</p>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 10 }}>SUB-METRICS</div>
        {data.subMetrics.map((m, i) => <SubMetricRow key={i} m={m} />)}

        {data.id === "csq" && data.universals ? (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 10 }}>UNIVERSALS (MOQ)</div>
            {data.universals.map((u, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: C.darkPanel, borderRadius: 8, marginBottom: 8, border: `1px solid ${C.cardBorder}` }}>
                <span style={{ fontSize: 12, color: C.cream, fontWeight: 600 }}>{u.name}</span>
                <span style={{ fontSize: 12, color: C.orange, fontFamily: "'Bebas Neue',sans-serif" }}>avg {u.avg} · min {u.min}</span>
              </div>
            ))}
          </div>
        ) : null}

        {data.id === "jump" && data.symmetry ? (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 10 }}>SYMMETRY PROFILE</div>
            {data.symmetry.map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                <span style={{ fontSize: 12, color: C.cream }}>{s.name}</span>
                <span style={{ fontSize: 12, color: C.orange, fontFamily: "'Bebas Neue',sans-serif" }}>{s.pct}% favor {s.favor}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1.5, fontWeight: 700, margin: "16px 0 10px" }}>TIMING</div>
            {data.timing.map((t, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: C.darkPanel, borderRadius: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.muted }}>{t.name}</span>
                <span style={{ fontSize: 12, color: C.cream, fontWeight: 600 }}>{t.value}</span>
              </div>
            ))}
          </div>
        ) : null}

        {data.id === "arm" && data.compositeQualities ? (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 10 }}>COMPOSITE QUALITIES (1–5)</div>
            {data.compositeQualities.map((q, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: C.cream }}>{q.name}</span>
                  <span style={{ fontSize: 13, color: C.green, fontFamily: "'Bebas Neue',sans-serif" }}>{q.score}/{q.max}</span>
                </div>
                <Bar value={(q.score / q.max) * 100} max={100} />
              </div>
            ))}
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1.5, fontWeight: 700, margin: "16px 0 10px" }}>FOUNDATION QUALITIES</div>
            {data.foundationQualities.map((q, i) => <SubMetricRow key={i} m={{ ...q, status: q.score >= 85 ? "elite" : "competitive" }} />)}
          </div>
        ) : null}

        {data.flags && data.flags.length ? (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 8 }}>FLAGS</div>
            {data.flags.map((f, i) => <FlagBadge key={i} flag={f} />)}
          </div>
        ) : null}

        <div style={{ marginTop: 20, padding: 14, background: C.darkPanel, borderRadius: 10, border: `1px solid ${C.orange}33` }}>
          <div style={{ fontSize: 10, color: C.orange, letterSpacing: 2, fontWeight: 700, marginBottom: 6 }}>INSIGHT</div>
          <p style={{ fontSize: 13, color: C.cream, lineHeight: 1.6, fontStyle: "italic" }}>{data.insight}</p>
        </div>
      </div>
    </div>
  );
};

const Countdown = ({ initialSeconds }) => {
  const [secLeft, setSecLeft] = useState(initialSeconds);
  useEffect(() => {
    const id = setInterval(() => setSecLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [initialSeconds]);
  const h = Math.floor(secLeft / 3600);
  const m = Math.floor((secLeft % 3600) / 60);
  const s = secLeft % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const CompositeCard = ({ data, onExpand }) => {
  const Preview = PREVIEW_MAP[data.preview.type];
  return (
    <button
      type="button"
      onClick={onExpand}
      style={{
        textAlign: "left", width: "100%", cursor: "pointer", padding: 14,
        background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 12,
        transition: "border-color 0.2s, box-shadow 0.2s", color: "inherit", font: "inherit",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.cardBorderHover; e.currentTarget.style.boxShadow = `0 0 0 1px ${C.cardBorderHover}`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 4 }}>{data.label}</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 30, color: C.cream, lineHeight: 1 }}>{formatScore(data.score)}</div>
        </div>
        {data.badge ? <Badge text={data.badge} color={data.badgeColor || C.green} /> : <span style={{ fontSize: 11, color: C.muted }}>tap</span>}
      </div>
      <Preview data={data} />
    </button>
  );
};

const QuoteBlock = () => {
  const parts = QUOTE.text.split(new RegExp(`(${QUOTE.highlights.join("|")})`));
  return (
    <div style={{ padding: 16, margin: "12px 0", background: "linear-gradient(135deg, rgba(255,140,40,0.08), rgba(0,0,0,0.2))", border: `1px solid ${C.cardBorder}`, borderRadius: 12 }}>
      <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, letterSpacing: 1.2, lineHeight: 1.45, color: C.cream }}>
        {parts.map((p, i) =>
          QUOTE.highlights.includes(p) ? (
            <span key={i} style={{ color: C.orange }}>{p}</span>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </p>
    </div>
  );
};

const HabitsStrip = () => (
  <div style={{ padding: "12px 14px", background: C.darkPanel, borderRadius: 12, border: `1px solid ${C.cardBorder}` }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <span style={{ fontSize: 11, color: C.muted, letterSpacing: 1.5, fontWeight: 700 }}>SESSION STREAK</span>
      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.green }}>{HABITS.streak} days</span>
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
      {HABITS.days.map((day, i) => (
        <div key={i} style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, fontWeight: 700 }}>{day.d}</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 3 }}>
            {day.slots.map((on, j) => (
              <div
                key={j}
                style={{
                  width: 10, height: 10, borderRadius: 2,
                  background: on ? C.green : "transparent",
                  border: `1px solid ${on ? C.greenDim : C.cardBorder}`,
                  opacity: on ? 1 : 0.35,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function FITSDashboard() {
  const [expandedId, setExpandedId] = useState(null);
  const expanded = expandedId ? COMPOSITES.find((c) => c.id === expandedId) : null;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setExpandedId(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div style={{ background: C.bg, color: C.cream, minHeight: 640, fontFamily: "'Rajdhani',sans-serif", borderRadius: 16, overflow: "hidden", border: `1px solid ${C.cardBorder}`, boxShadow: "0 20px 60px rgba(0,0,0,0.45)" }}>
      <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.cardBorder}`, background: "linear-gradient(180deg, rgba(255,140,40,0.06), transparent)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg, ${C.orange}, ${C.orangeDim})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: "#1a1209", border: `2px solid ${C.cardBorder}`,
          }}>{ATHLETE.avatar}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 1.5, lineHeight: 1.1 }}>{ATHLETE.name}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 6 }}>
              <Badge text={ATHLETE.status} color={C.green} />
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{ATHLETE.rank}</span>
              <span style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>{ATHLETE.weeklyGain} this week</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: 14, maxHeight: 520, overflowY: "auto" }}>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 2, fontWeight: 700, marginBottom: 10 }}>COMPOSITE METRICS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {COMPOSITES.map((c) => (
            <CompositeCard key={c.id} data={c} onExpand={() => setExpandedId(c.id)} />
          ))}
        </div>
      </div>

      <div style={{ padding: "0 14px 14px" }}>
        <div style={{ padding: 16, background: C.cardBg, borderRadius: 12, border: `1px solid ${C.cardBorder}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: C.orange, letterSpacing: 1.5, fontWeight: 700 }}>{WORKOUT.label}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, marginTop: 4 }}>{WORKOUT.title}</div>
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: C.green, letterSpacing: 2 }}>
              <Countdown initialSeconds={WORKOUT.countdown} />
            </div>
          </div>
          {WORKOUT.blocks.map((b, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: C.darkPanel, borderRadius: 8, marginBottom: 6, borderLeft: `3px solid ${C.orange}` }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{b.name}</div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1 }}>{b.type}</div>
              </div>
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{b.dur}</span>
            </div>
          ))}
        </div>
        <QuoteBlock />
        <HabitsStrip />
      </div>

      {expanded ? <ExpandedGeneric data={expanded} onClose={() => setExpandedId(null)} /> : null}
    </div>
  );
}
