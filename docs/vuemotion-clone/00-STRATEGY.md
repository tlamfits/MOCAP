# VueMotion Clone + Upgrade — Master Strategy

**Prepared for:** FITS (Fitness Improvement Training Systems), Toronto
**Purpose:** Plan the best-methods approach to clone VueMotion and surpass it, then hand execution to Fable 5.
**Planning model:** claude-opus-4-8 · **Execution model:** Fable 5
**Date:** 2026-07-04

---

## 0. How to read this document

This is the *planning* deliverable. It is grounded in a deep, adversarially-verified
literature review (see `references/RESEARCH-FINDINGS.md` for every cited number and its
verification vote). It makes the architectural, tooling, dataset, training, and validation
decisions so that Fable 5 can execute without re-litigating them.

- **This file (`00-STRATEGY.md`)** — the reasoning, decisions, and trade-offs.
- **`01-FABLE5-EXECUTION-BRIEF.md`** — the structured, imperative handoff Fable 5 works from.
- **`references/RESEARCH-FINDINGS.md`** — the cited evidence base with confidence levels.

> **One-line thesis:** Don't reinvent the science. Clone the **OpenCap** pipeline
> (pose → triangulation → LSTM marker augmentation → OpenSim), swap in *better,
> commercially-licensed* components (RTMPose front-end, more cameras, higher fps), retrain
> the marker-augmentation and GRF networks on athletic (sprint/jump/cut) data — which is
> exactly where VueMotion and OpenCap are *weakest* — and wrap it in a hybrid
> on-device/cloud product.

---

## 1. What VueMotion actually is (the clone target)

VueMotion is an **iPhone, single-camera, markerless motion-capture app** for athletic
movement analysis. Confirmed characteristics:

- **Capture:** one smartphone (4K/60fps) + tripod + five cones. No sensors, no markers.
- **Core use cases:** sprint/running mechanics, hop tests, change-of-direction/cutting.
- **Outputs:** joint angles, gait/stride metrics, and *estimated* kinetic quantities —
  foot-strike and cut impact forces — plus injury-risk framing and return-to-play tooling.
- **Method:** computer-vision 2D landmark tracking → biomechanical inference. It tracks
  landmarks in 2D frames (validation used iPhone 12 Pro at 60 Hz).
- **Validation claims:** benchmarked against VICON, laser, and OptoGate; hop-test landmark
  tracking reported ~95–99% axis accuracy.
- **Business:** Australian company (~5 yrs), partnered with ALTIS as "Motion IQ,"
  working with pro leagues. Positioned as "lab-grade analysis from a phone."

**Its structural weaknesses (your opportunity):**
1. **Single camera = 2D.** Out-of-plane motion (the transverse plane: internal/external
   rotation, knee valgus during cuts) is fundamentally under-observed. This is *the*
   injury-risk-relevant plane.
2. **60 fps ceiling.** Impact and change-of-direction events are high-frequency; derivative
   quantities (velocity, acceleration → force) degrade badly at low frame rates.
3. **Force is inferred from thin observations.** GRF/impact from a single 2D view is the
   least trustworthy output.

Your chosen upgrade — **multi-camera, calibrated, true-3D, high-fps, hybrid processing** —
attacks all three directly.

---

## 2. Target architecture (your decisions, locked)

| Decision | Choice | Rationale |
|---|---|---|
| **Capture rig** | Multi-cam 3D lab rig (2–8 synced calibrated cameras) | True 3D removes VueMotion's out-of-plane blind spot; lab-grade accuracy at the FITS facility. |
| **Processing** | Hybrid: on-device live pose preview + cloud heavy biomechanics | Instant coach feedback on-device; heavy triangulation/OpenSim/GRF in the cloud. |
| **Outputs** | All four: sprint mechanics · jump/hop & landing · GRF/impact force · change-of-direction/cutting | Covers VueMotion parity **and** ties into FITS's existing jump dashboards + force plates. |

### 2.1 System block diagram

```
┌─────────────────────────── CAPTURE (FITS facility) ───────────────────────────┐
│  2–8 genlocked/synced cameras (global shutter, 120–240 fps)                     │
│  + optional 1–2 force plates (ground-truth for GRF model training/validation)   │
└───────────────┬────────────────────────────────────────────────┬──────────────┘
                │                                                  │
     ON-DEVICE (live preview tier)                     CLOUD (heavy tier, async)
     ┌──────────────────────────┐                      ┌───────────────────────────────┐
     │ RTMPose-s/m (CoreML/ONNX)│                      │ 1. Multi-view 2D pose          │
     │ 2D skeleton overlay      │                      │    (RTMPose-l / RTMPose-x /    │
     │ rep counting, live cues  │                      │     Sapiens*-offline)          │
     │ 30–60 fps on-device      │                      │ 2. Calibration + DLT/robust    │
     └──────────────────────────┘                      │    triangulation → 3D keypts   │
                                                        │ 3. LSTM/Transformer marker     │
                                                        │    augmentation (20→43 markers)│
                                                        │ 4. OpenSim scaling + IK        │
                                                        │ 5. GRF/kinetics model          │
                                                        │    (ML predict → sim refine)   │
                                                        │ 6. Metrics + report + storage  │
                                                        └───────────────────────────────┘
   * Sapiens is CC-BY-NC — research/validation only unless a Meta commercial license is bought.
```

---

## 3. The reference pipelines to clone (don't start from scratch)

Three validated systems define the state of the art. Clone the open one, benchmark against
the commercial one, borrow the sports-tuned tricks from the third.

### 3.1 OpenCap — **the primary blueprint** (open-source, closest to your target)
Stanford's OpenCap is the closest existing thing to what you're building and it is
**fully open**. Pipeline:

```
2+ synced phones → OpenPose/HRNet 2D keypoints → DLT triangulation → 3D keypoints
  → LSTM "marker enhancer" (20 sparse keypoints → 43 anatomical markers)
  → OpenSim scaling + inverse kinematics + muscle-driven simulation → kinematics & (simulated) dynamics
```

- **Validated accuracy:** lower-extremity kinematic RMSE **2.0–10.2°** vs marker-based mocap
  (comparable to IMU systems). On return-to-sport tasks (jump-landing, single-leg/lateral
  hops) an independent study measured **3.85° MAE / 4.34° RMSE** grand mean, with sagittal
  knee/hip agreement CMC > 0.94 but frontal/transverse plane much weaker (CMC 0.47–0.78).
  On gait, **~5.8° RMSE** — still above the 2–5° clinical threshold.
- **Why clone it:** the exact architecture you want, permissively licensed *core* (Apache-2.0
  `opencap-core`), and the marker-augmentation network is the single highest-leverage part
  to retrain.
- **Repos:** `opencap-org/opencap-core`, `opencap-org/opencap-processing`.

### 3.2 Theia3D — **the commercial benchmark to beat** (8-camera, lab-grade)
Theia3D is the leading commercial deep-learning markerless system (~8 cameras). Treat it as
the accuracy target:
- Joint-center agreement with VICON **< 2.5 cm** for all joints except hip (3.6 cm).
- Global segment angles **< 5.5°**; full-curve joint-angle RMSD **0.96–3.71°**.
- Single-leg functional-task RMSD **3.2–3.6°**.
- **Its ceiling (and everyone's):** transverse-plane / long-axis rotations (int/ext rotation)
  — SEM > 5°. This is the universal markerless limitation and it directly caps cut/valgus
  injury-risk metrics.

### 3.3 Pose2Sim — **the open sports-tuned variant** (borrow the workflow)
Pose2Sim is an open end-to-end multi-camera → OpenSim workflow validated on sport-like tasks:
- Mean joint-angle error **3.0° (walk) / 4.1° (run) / 4.0° (cycle)** vs Qualisys/OpenSim.
- Documented failure modes to design around: hip-in-running had a systematic ~15° offset;
  occluded ankle in cycling degraded (CMC 0.75); non-sagittal hip rotations didn't agree
  (CMC < 0.75). Validation was n=1 — treat as directional.
- **Repo:** `perfanalytics/Pose2Sim` (BSD-style, commercially usable — verify at build time).

**Decision:** Build on the **OpenCap architecture**, use **Pose2Sim's multi-camera
calibration/triangulation engineering** as a second reference implementation, and hold
**Theia3D's published numbers** as the bar to clear.

---

## 4. Component-by-component tech stack (with the license landmines flagged)

> **Licensing is decision-critical and must be cleared before shipping.** Several of the
> most-cited academic tools are **non-commercial**. The table below is designed so the
> *shippable* path is entirely permissive.

| Layer | Recommended (commercial-safe) | Avoid / license trap | Notes |
|---|---|---|---|
| **On-device 2D pose** | **RTMPose-s/m** (Apache-2.0), exported via MMDeploy → **CoreML/ONNX/TFLite** | OpenPose (**non-commercial**, ~$25k commercial license); Ultralytics YOLO-Pose (**AGPL-3.0** — copyleft, commercial license required) | RTMPose-m: 75.8% COCO AP, 35+ fps on a 2020 Snapdragon 865 → comfortably real-time on modern A-series iPhone. |
| **Cloud 2D pose (accuracy)** | **RTMPose-l/x** (Apache-2.0); **ViTPose** (Apache-2.0) | **Sapiens** (CC-BY-NC 4.0 — accuracy leader at 82.2 COCO AP + 308 dense keypoints, but **research/validation only** unless Meta license) | Use Sapiens to *label training data* and set an internal accuracy ceiling; ship RTMPose/ViTPose. |
| **Calibration** | OpenCV / Pose2Sim calibration (checkerboard/ChArUco + bundle adjustment) | — | Intrinsics per camera + extrinsics via shared calibration object; re-verify each session. |
| **3D triangulation** | Robust DLT + RANSAC (OpenCap/Pose2Sim/AniPose style), temporal smoothing | — | Multi-view fusion with per-keypoint confidence weighting; reject outlier views. |
| **Marker augmentation** | **Retrain OpenCap's LSTM/Transformer marker enhancer** on athletic data | Using the stock enhancer as-is (collapses on unseen dynamic movements) | **Highest-leverage upgrade.** See §6. |
| **Biomech model + IK/ID** | **OpenSim** (permissive; Apache-style) — scaling, inverse kinematics, inverse dynamics, static optimization | — | Rajagopal/gait2392 musculoskeletal models; consider full-body model for arms during sprint. |
| **Body model (optional)** | SMPL/SMPL-X for mesh/visualization & synthetic-data generation | SMPL has **research-license nuances** for commercial use — clear before shipping meshes | Useful for synthetic training data (BEDLAM) and slick coach-facing visuals. |
| **GRF / kinetics** | **Custom ML model (predict GRF/CoP) → OpenSim dynamic-consistency refinement** | Relying on OpenSim muscle-driven sim alone for kinetics on impact tasks | The hard part — see §5. |
| **Mobile runtime** | **CoreML** (iOS primary), ONNX Runtime / TFLite (Android later) | — | Quantize to FP16/INT8; validate accuracy retention post-quantization. |
| **Cloud** | GPU workers (containerized), object storage for video, job queue | — | Async processing; per-athlete history DB. |

**License clearance is a gating task for Fable 5** (see execution brief). The shippable
stack — RTMPose + OpenCV + OpenSim + your own trained networks — is clean; the traps are
OpenPose, Ultralytics YOLO, and Sapiens weights.

---

## 5. The hard part: GRF & impact force from video (output family 3)

This is where you can genuinely leapfrog VueMotion, and also where the science is thinnest.
Set expectations honestly.

**What the literature says:**
- Best current GRF-from-smartphone-video: **~6.7 ± 4.3 %BW RMSE** for GRF and
  **~1.34 ± 0.96 %BW·height** for joint moments (muscle-driven tracking).
- A monocular OpenCap-style pipeline reported **5.0 %BW** GRF and **1.1 %BW·height** moments
  (with 8.4° joint-angle error) — feasible but coarse.
- Predicting GRF from *kinematics* alone with a CNN: **nRMSE < 12.65%, PCC > 0.94** in
  healthy adults (higher error in pathological gait).
- **Critical finding:** improving *kinematic* accuracy does **not** reliably improve
  *dynamics*. You cannot force-plate-free your way to good kinetics just by tracking joints
  better. Kinetics needs a dedicated force model.
- **Frontier method (best path):** *hybrid ML + simulation* — an ML model (transformer, e.g.
  GaitDynamics trained on AddBiomechanics) predicts GRF/CoP from video kinematics, then a
  dynamic simulation enforces dynamic consistency, reducing vertical GRF error **~40%** vs
  physics-only. (This is a Dec-2025 preprint — promising, not yet peer-reviewed.)

**Strategy for FITS specifically — you have an unfair advantage:**
> FITS **already has force plates.** That means you can capture **synchronized
> video + force-plate GRF** at your own facility and *train/fine-tune your GRF model on your
> own ground-truth data* for the exact movements you care about (CMJ, hops, sprint starts,
> cuts). Almost nobody else can do this at scale. **This is the single biggest moat in the
> whole plan.** Prioritize a synchronized video+force-plate capture protocol from day one.

**Recommended GRF approach (ranked):**
1. **Data-first:** synchronized multi-cam video + force plate at FITS → build a proprietary
   labeled dataset of athletic GRF.
2. **Model:** temporal CNN/Transformer predicting 3-axis GRF + CoP from 3D kinematics
   (+ segment kinematics/accelerations), trained on your data + public sets (AddBiomechanics).
3. **Refine:** feed predicted GRF into OpenSim for dynamic-consistency correction (hybrid).
4. **Report with uncertainty bands** — never present a single force number as ground truth
   on cutting/impact tasks; the science doesn't support it yet.

---

## 6. Where accuracy gains actually come from (retraining priorities)

Three retraining efforts, in priority order. This is the "train the system effectively" core.

### Priority 1 — Marker-augmentation network (biggest kinematic win)
OpenCap's upgraded enhancer (trained on **1,176 subjects / 1,433 synthesized hours**) cut
error to **~4.1° mean (max 8.7°)** vs 9.6° for raw keypoints, and — crucially — **held 4.1°
mean on *unseen diverse* movements where the original enhancer collapsed to 40.4° (max
252°).** Marker augmentation improved some DOFs by up to **35.9°**.
- **Action:** retrain/extend this network with **athletic** movements (sprint, cut, land,
  bound). Generalization to dynamic, out-of-lab motion is exactly the failure mode you must fix.

### Priority 2 — GRF/kinetics network (biggest differentiation)
See §5. Train on FITS's synchronized video+force-plate data. This is your moat.

### Priority 3 — Sport-specific 2D pose fine-tuning (robustness)
General pose models degrade on athletic extremes (motion blur, occlusion, unusual poses).
Fine-tune the 2D estimator on athletic imagery to reduce upstream keypoint error that
propagates through everything downstream.

---

## 7. Training data & datasets

| Dataset | What it gives you | License / access | Use |
|---|---|---|---|
| **AthletePose3D** (CVPRW 2025) | 3D pose benchmark **built for high-velocity athletics** (sprint/jump/cut) | Research | **Most on-point public set** — evaluate & fine-tune pose here. |
| **BEDLAM** (synthetic, arXiv:2304.01865) | Large photorealistic synthetic humans with perfect 3D ground truth | Research (check terms) | Synthetic pre-training / augmentation; cheap volume. |
| **AMASS / Human3.6M / 3DPW** | Canonical 3D human motion & pose benchmarks | Research (Human3.6M restrictive) | Pretraining, sanity benchmarks. |
| **OpenCap dataset** | Multi-view video + marker data, the enhancer training corpus | Open | Reproduce/extend the marker enhancer. |
| **AddBiomechanics** | Large kinematics+kinetics corpus with OpenSim fits | Open | Train the GRF/kinetics model. |
| **Nature Sci Data 2024 sync set** | **Time-synced multi-cam video + mocap + force plate** | Open | **Validation ground truth** for the whole pipeline. |
| **★ FITS proprietary capture** | Your athletes: synced multi-cam video + force plate, sport movements | You own it | **The moat.** Fine-tune everything; validate on-domain. |

**How a small team trains effectively (the realistic recipe):**
1. **Don't train pose estimators from scratch.** Start from pretrained RTMPose/ViTPose;
   *fine-tune* on athletic data (AthletePose3D + your captures + BEDLAM synthetic).
2. **Synthetic-to-real:** use BEDLAM/SMPL-rendered synthetic sequences to cover rare/extreme
   poses cheaply, then fine-tune on a smaller real set.
3. **The marker-augmentation and GRF networks are small** (LSTM/temporal-CNN/Transformer over
   keypoint time series) — these are *trainable on a single GPU* and are where your data moat
   pays off. Focus compute here, not on giant pose backbones.
4. **Active-learning loop:** capture at FITS → auto-label with the cloud (high-accuracy
   Sapiens/RTMPose-x + force plates) → correct edge cases → retrain. Compounds over time.

---

## 8. Hardware & capture rig

- **Cameras:** 4–8 machine-vision or high-end action cameras with **global shutter** and
  **120–240 fps**. Rationale: at 25 fps, joint *displacement* tracks VICON excellently
  (r = 0.916–0.994) but *velocity/acceleration* degrade sharply — and impact/GRF live in
  the derivatives. **For impact and cutting work, 200+ fps is not optional.** Start with 4
  cameras (validated configs exist); scale to 8 for full-body sprint volumes.
- **Synchronization:** hardware genlock/trigger is best; software sync (audio/flash/timecode)
  is acceptable for a v1 but adds derivative noise. Sync quality is the top predictor of
  kinetic-metric reliability.
- **Calibration:** ChArUco/checkerboard intrinsics per camera + extrinsics via shared object;
  re-verify each session; store calibration with each capture.
- **Force plates:** integrate FITS's existing plates into the capture timeline (shared
  trigger/timecode) — essential for GRF model training/validation.
- **Volume & lighting:** define a calibrated capture volume (sprint runway + landing/cut
  zone); control lighting to minimize motion blur at high fps (shutter speed matters more
  than resolution for fast motion).

---

## 9. Validation methodology (how you prove it beats VueMotion)

1. **Concurrent validity vs VICON** (gold standard) on the FITS-relevant tasks: CMJ, hop
   tests, sprint acceleration, 45°/90° cuts. Report per-plane, per-joint MAE/RMSE and
   waveform agreement (CMC / Pearson r), not just headline means.
2. **GRF validity vs force plates** — report %BW RMSE and correlation *with uncertainty
   bands*; segment by movement type.
3. **Report by plane.** Be explicit that sagittal-plane accuracy (2–5°) is strong and
   transverse-plane rotation is the industry-wide weak spot; don't overclaim cut/valgus
   precision.
4. **Test-retest reliability** across sessions/days (between-day SEM) — coaches need
   trustworthy longitudinal tracking.
5. **Benchmark the tiers:** on-device 2D vs cloud 3D vs VICON — quantify the accuracy the
   live preview sacrifices for speed.
6. **Head-to-head vs VueMotion** where possible (same athlete, same session) — your
   marketing needs this.

**Acceptance targets (v1):** match OpenCap/Pose2Sim/Theia sagittal-plane kinematics
(**≤ 5° RMSE** lower-limb sagittal), GRF **≤ 8 %BW RMSE** on jumps/hops, and *documented*
(not necessarily better) transverse-plane performance.

---

## 10. Phased build roadmap

| Phase | Goal | Key deliverables | Exit criterion |
|---|---|---|---|
| **P0 — Foundations & legal** | De-risk licensing + stand up reference pipelines | License clearance memo; OpenCap + Pose2Sim running on sample data; repo skeleton | Both reference pipelines reproduce published-ballpark numbers on a public clip |
| **P1 — Multi-cam 3D kinematics (cloud)** | True-3D kinematics at FITS | Calibration + sync rig; RTMPose multi-view → triangulation → OpenSim IK; kinematics report | ≤ 5° sagittal RMSE vs VICON on CMJ/hop |
| **P2 — On-device live preview** | Real-time coach feedback | RTMPose-s/m in CoreML; live skeleton + cues; rep/contact-time metrics | ≥ 30 fps on target iPhone with stable skeleton |
| **P3 — Marker-augmentation retrain** | Fix dynamic-movement accuracy | Athletic-tuned enhancer network; generalization eval | Holds accuracy on unseen sprint/cut vs stock enhancer collapse |
| **P4 — GRF/kinetics (the moat)** | Force estimation from video | Synced video+force-plate dataset; GRF model; hybrid sim refinement | ≤ 8 %BW GRF RMSE on jumps; uncertainty-banded reports |
| **P5 — Sprint/cut coverage + product** | All four output families, packaged | Cutting/CoD metrics, injury-risk screens, coach dashboards (tie into FITS jump dashboards) | End-to-end athlete report; head-to-head vs VueMotion |
| **P6 — Validation study & hardening** | Prove and publish | Formal VICON/force-plate validation; reliability study | Documented accuracy meeting §9 targets |

---

## 11. Risk & limitations register (design around these)

| Risk | Evidence | Mitigation |
|---|---|---|
| **Transverse-plane rotations are unreliable** (int/ext rotation, knee valgus) — universal markerless ceiling | Theia3D SEM > 5°; Pose2Sim CMC < 0.75; OpenCap frontal/transverse CMC 0.47–0.78 | Lead with sagittal-plane metrics; more cameras + higher fps help marginally; be honest in reporting; don't build headline injury-risk claims on rotation precision alone |
| **Kinetics don't follow from kinematics** | Improving joint accuracy didn't improve dynamics | Dedicated GRF model + force-plate training; hybrid ML+sim; uncertainty bands |
| **Sprint/cut extremes under-validated** | Almost all published accuracy is gait/controlled tasks | Your own FITS validation on sprint/cut is required — treat public numbers as optimistic |
| **Motion blur & occlusion at speed** | Documented degradation (occluded ankle CMC 0.75) | Global-shutter cameras, high fps, fast shutter, multi-view redundancy, temporal filtering |
| **License landmines** | OpenPose non-commercial (~$25k); Ultralytics AGPL; Sapiens CC-BY-NC | Ship only RTMPose/ViTPose/OpenSim/own-trained nets; clear SMPL terms before shipping meshes |
| **Small-sample validation in literature** | Pose2Sim accuracy paper n=1 | Don't over-trust single studies; validate in-house |
| **Frontier GRF method is a preprint** | Hybrid ML+sim ~40% gain is Dec-2025, unreviewed | Reproduce internally before betting product claims on it |

---

## 12. Bottom line for the handoff

- **Clone target is clear:** OpenCap architecture, upgraded to multi-cam / higher-fps /
  commercially-licensed components, with hybrid on-device+cloud delivery.
- **The two upgrades that matter most:** (1) retrain the **marker-augmentation network** on
  athletic movement, (2) build the **GRF model on FITS's own synchronized video+force-plate
  data** — a moat almost no competitor has.
- **Be honest about the ceiling:** transverse-plane rotation and video-only kinetics are
  hard for *everyone*; win on sagittal kinematics, jump/hop, and force-plate-trained GRF, and
  report the rest with uncertainty.
- **Fable 5 executes from `01-FABLE5-EXECUTION-BRIEF.md`.**

*Full cited evidence and verification votes: `references/RESEARCH-FINDINGS.md`.*
