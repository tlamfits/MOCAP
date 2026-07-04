# Fable 5 Execution Brief — VueMotion Clone + Upgrade

**You are Fable 5.** This brief is your build spec. The reasoning behind every decision is in
`00-STRATEGY.md`; the cited evidence is in `references/RESEARCH-FINDINGS.md`. Do not
re-litigate the architecture — execute it. Where this brief says "DECISION," it is settled.
Where it says "VERIFY," confirm the fact at build time before depending on it.

---

## 0. Mission

Build a **lab-grade, multi-camera, true-3D markerless motion-capture system** for athletic
movement analysis that clones VueMotion's capabilities and surpasses them on accuracy and on
force estimation. **Hybrid processing:** on-device live 2D preview + cloud heavy 3D
biomechanics. **Four output families:** (1) sprint/running mechanics, (2) jump/hop & landing,
(3) GRF/impact force from video, (4) change-of-direction/cutting + injury-risk screening.

**North-star architecture (DECISION):** clone the **OpenCap pipeline** —
`multi-view 2D pose → calibrated triangulation → LSTM/Transformer marker augmentation →
OpenSim IK/ID → metrics` — swapping in commercially-licensed components and retraining the
marker-augmentation and GRF networks on athletic data.

---

## 1. Ground rules

1. **License hygiene is a gate, not a footnote.** Ship only permissively-licensed components.
   Blocked from the shippable product: **OpenPose** (non-commercial, ~$25k), **Ultralytics
   YOLO-Pose** (AGPL-3.0), **Sapiens weights** (CC-BY-NC 4.0). Allowed: RTMPose/MMPose &
   ViTPose (Apache-2.0), OpenCV, OpenSim, Pose2Sim (VERIFY BSD), and anything you train
   yourself. Sapiens/OpenPose may be used **internally for labeling/validation only.**
   Produce a `LICENSE-CLEARANCE.md` before P1 code lands.
2. **Report accuracy by plane and by movement.** Never collapse to a single headline number.
   Sagittal-plane kinematics are strong (2–5°); transverse-plane rotation is weak
   industry-wide (SEM > 5°). Kinetics carry uncertainty bands.
3. **The FITS force plates are the moat.** Design the capture protocol to record
   **synchronized multi-camera video + force-plate GRF** from day one. This trains and
   validates the GRF model on-domain.
4. **Fine-tune, don't train from scratch.** Start from pretrained pose backbones. Spend
   compute on the small marker-augmentation and GRF networks where your data advantage lives.
5. **Every phase ends with a measured number vs a reference**, not "it runs."

---

## 2. Repos to clone/study first (P0)

| Repo | Role | Action |
|---|---|---|
| `opencap-org/opencap-core` + `opencap-processing` | Primary architecture blueprint (Apache-2.0 core) | Reproduce end-to-end on sample data; internalize triangulation→enhancer→OpenSim flow |
| `perfanalytics/Pose2Sim` | Second reference: multi-cam calibration + triangulation → OpenSim | Reproduce; harvest calibration/sync engineering (VERIFY license) |
| `open-mmlab/mmpose` (RTMPose) + `open-mmlab/mmdeploy` | Shippable 2D pose + export to CoreML/ONNX/TFLite | Stand up RTMPose-s/m/l; test MMDeploy export path |
| `opensim-org/opensim-core` | Biomech IK/ID/scaling | Musculoskeletal model (Rajagopal/gait2392); IK harness |
| ViTPose (Apache-2.0) | Cloud high-accuracy 2D alternative | Benchmark vs RTMPose-x |
| Sapiens (facebookresearch) | Internal labeling/accuracy ceiling ONLY (CC-BY-NC) | Use to auto-label training data; DO NOT ship |

---

## 3. Component decisions (settled)

| Component | DECISION | Key spec / target |
|---|---|---|
| On-device 2D pose | **RTMPose-s or -m** via MMDeploy → **CoreML** | ≥ 30 fps on target iPhone; 72–76% COCO AP |
| Cloud 2D pose | **RTMPose-l/x** (ship) + ViTPose (compare); Sapiens for labeling only | Max accuracy offline |
| Calibration | OpenCV/Pose2Sim ChArUco intrinsics + extrinsics + bundle adjustment | Re-verify per session; store with capture |
| Triangulation | Robust DLT + RANSAC, per-keypoint confidence weighting, temporal smoothing | Reject outlier views |
| Marker augmentation | **Retrain OpenCap LSTM/Transformer enhancer on athletic data** (20→43 markers) | Hold ≤ ~5° on unseen sprint/cut |
| Biomech | **OpenSim** scaling + IK + ID + static optimization | Full-body model (arms matter for sprint) |
| GRF/kinetics | **ML predict (temporal CNN/Transformer) → OpenSim dynamic-consistency refine** | ≤ 8 %BW RMSE on jumps/hops (v1) |
| Mobile runtime | CoreML (iOS first), ONNX/TFLite (Android later) | FP16/INT8 quantization, validate accuracy retention |
| Cloud | Containerized GPU workers + job queue + object storage + per-athlete DB | Async; store calibration + raw + derived |

---

## 4. Phased execution (build in this order)

### P0 — Foundations & legal
- [ ] `LICENSE-CLEARANCE.md` covering every dependency's commercial terms.
- [ ] Reproduce OpenCap and Pose2Sim end-to-end on public sample data; record their output
      numbers as your internal baseline.
- [ ] Repo skeleton: `capture/`, `calibration/`, `pose2d/`, `triangulation/`, `augment/`,
      `opensim/`, `grf/`, `ondevice/`, `cloud/`, `eval/`, `data/`.
- **Exit:** both reference pipelines produce published-ballpark kinematics on a public clip.

### P1 — Multi-cam 3D kinematics (cloud)
- [ ] Camera rig: start with **4 global-shutter cameras at 120–240 fps** (scale to 8).
- [ ] Sync (hardware genlock preferred; software timecode acceptable for v1) + calibration.
- [ ] Pipeline: RTMPose multi-view → triangulation → OpenSim scaling + IK → joint-angle
      time series.
- [ ] `eval/` harness: MAE/RMSE + CMC/Pearson vs VICON, **per joint, per plane, per movement**.
- **Exit:** **≤ 5° sagittal-plane lower-limb RMSE** vs VICON on CMJ + hop.

### P2 — On-device live preview
- [ ] Export RTMPose-s/m to CoreML; live 2D skeleton overlay.
- [ ] Live metrics: rep counting, ground-contact time, cadence, basic joint angles, coach cues.
- **Exit:** **≥ 30 fps** on target iPhone with stable skeleton; documented accuracy delta vs
  cloud tier.

### P3 — Marker-augmentation retrain (biggest kinematic win)
- [ ] Assemble athletic training set: AthletePose3D + BEDLAM synthetic + FITS captures.
- [ ] Retrain/extend the enhancer (20 sparse keypoints → 43 anatomical markers).
- [ ] Generalization eval on **held-out sprint/cut/land** movements.
- **Exit:** retrained enhancer holds accuracy on unseen dynamic movements where the stock
  enhancer collapses (stock degrades to ~40° mean / 252° max on unseen diverse motion).

### P4 — GRF/kinetics (the moat)
- [ ] **Synchronized video + force-plate capture protocol** at FITS (shared trigger/timecode).
- [ ] Build proprietary labeled GRF dataset: CMJ, hops, sprint starts, cuts.
- [ ] Train temporal CNN/Transformer: 3D kinematics (+segment accelerations) → 3-axis GRF + CoP.
      Supplement with AddBiomechanics.
- [ ] Hybrid refinement: predicted GRF → OpenSim dynamic-consistency correction.
- [ ] Reports carry **uncertainty bands**; segment error by movement type.
- **Exit:** **≤ 8 %BW GRF RMSE** on jumps/hops vs force plate; uncertainty-banded output.

### P5 — Sprint/cut coverage + product
- [ ] Cutting/CoD metrics (approach speed, deceleration, cut angle, asymmetry) + injury-risk
      screens (report with plane-honesty caveats).
- [ ] Coach dashboards; **integrate with FITS's existing jump-metric dashboards**
      (`Coach_Team_Jump_Metric_Dashboard.html`, `tools/build_jump_coach_dashboard.py`).
- [ ] End-to-end athlete report generation.
- **Exit:** full four-family report; head-to-head capture vs VueMotion on the same athlete.

### P6 — Validation study & hardening
- [ ] Formal concurrent-validity study vs VICON + force plates on sprint/cut/jump.
- [ ] Test-retest reliability (between-day SEM).
- **Exit:** documented accuracy meeting the targets in `00-STRATEGY.md` §9.

---

## 5. Accuracy targets (v1 acceptance)

| Metric | Target | Reference |
|---|---|---|
| Lower-limb **sagittal** kinematics RMSE | ≤ 5° | OpenCap 3.85° MAE; Pose2Sim 3–4°; Theia3D 0.96–3.71° |
| Frontal/transverse kinematics | *Documented*, not necessarily better | Industry ceiling; SEM > 5° transverse |
| **GRF** RMSE (jump/hop) | ≤ 8 %BW | Lit best ~6.7 %BW smartphone; force-plate training should beat this |
| Joint-moment RMSE | ≤ 1.5 %BW·height | Lit ~1.1–1.34 %BW·height |
| On-device pose | ≥ 30 fps, stable skeleton | RTMPose 35+ fps on 2020-era mobile SoC |

---

## 6. Datasets (fetch/build in P0–P4)

- **AthletePose3D** (CVPRW 2025) — sprint/jump/cut 3D pose benchmark → primary athletic fine-tune/eval.
- **BEDLAM** — synthetic humans, perfect 3D GT → cheap volume / rare-pose coverage.
- **OpenCap dataset** — marker-enhancer training corpus.
- **AddBiomechanics** — kinematics+kinetics → GRF model training.
- **Nature Sci Data 2024** synced video+mocap+force-plate set → pipeline validation GT.
- **★ FITS proprietary** synced multi-cam video + force plate → the moat; fine-tune + on-domain validation.

---

## 7. Non-negotiable "don'ts"

- ❌ Don't ship OpenPose, Ultralytics YOLO-Pose, or Sapiens weights in the product.
- ❌ Don't present video-only GRF/impact on cutting as ground truth — bands + caveats.
- ❌ Don't claim transverse-plane rotation precision you can't back with your own validation.
- ❌ Don't train giant pose backbones from scratch — fine-tune; spend compute on the small nets.
- ❌ Don't trust a single small-sample study — validate in-house on FITS athletes.

---

## 8. First three concrete tasks for Fable 5

1. **P0-1:** Produce `LICENSE-CLEARANCE.md` — enumerate every intended dependency and its
   commercial-use verdict; confirm the shippable stack is clean.
2. **P0-2:** Stand up and reproduce **OpenCap** end-to-end on a public sample; log its output
   kinematics as the internal baseline.
3. **P1-1:** Design the **4-camera, 120–240 fps, global-shutter capture + sync + calibration**
   protocol (including force-plate timecode integration) as a written spec, then implement
   calibration + triangulation and measure sagittal RMSE vs a reference clip.

*Escalate to the user only for: capital hardware purchases, buying a commercial license
(OpenPose/Sapiens), or any product accuracy claim that goes to marketing.*
