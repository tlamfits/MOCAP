# Fable 5 Execution Brief — VueMotion Clone + Upgrade

**You are Fable 5.** This brief is your build spec. The reasoning behind every decision is in
`00-STRATEGY.md`; the cited evidence is in `references/RESEARCH-FINDINGS.md`. Do not
re-litigate the architecture — execute it. Where this brief says "DECISION," it is settled.
Where it says "VERIFY," confirm the fact at build time before depending on it.

---

## 0. Mission

Build a **lab-grade, multi-camera, true-3D markerless motion-capture system** for athletic
movement analysis that clones VueMotion's capabilities and surpasses them on **kinematic**
accuracy. **Hybrid processing:** on-device live 2D preview + cloud heavy 3D biomechanics.
**Output families (kinematics only):** (1) sprint/running mechanics, (2) jump/hop & landing,
(3) change-of-direction/cutting + injury-risk screening — joint angles, ROM, timing, symmetry.

> **SCOPE DECISION (locked): this is a PURE KINEMATIC system. No force from video.**
> The CV system does **not** estimate ground-reaction force, impact force, joint moments, or
> any kinetic quantity. **Force is owned entirely by FITS's force plates**, run as a separate,
> independent workflow — not synchronized, fused, or coupled to the CV system in any way. No
> `grf/` module, no force-plate integration in the capture rig, no kinetics phase.

**North-star architecture (DECISION):** clone the **OpenCap pipeline** —
`multi-view 2D pose → calibrated triangulation → LSTM/Transformer marker augmentation →
OpenSim inverse kinematics → kinematic metrics` — swapping in commercially-licensed components
and retraining the marker-augmentation and 2D-pose networks on athletic **video** data. Take
OpenCap's **kinematic path only**; its optional muscle-driven dynamics is out of scope.

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
   industry-wide (SEM > 5°). Report kinematics only — no force numbers.
3. **No force from video; force plates are SEPARATE.** The CV system estimates **zero** kinetic
   quantities. No shared trigger, no timecode bridge, no paired video+force dataset, no `grf/`
   module. The capture rig syncs **cameras to each other only.** Your on-facility advantage is
   **athletic video volume** for pose/kinematics fine-tuning.
4. **Fine-tune, don't train from scratch.** Start from pretrained pose backbones. Spend
   compute on the small marker-augmentation network (and 2D pose fine-tune) where your
   athletic-video advantage lives.
5. **Every phase ends with a measured number vs a reference**, not "it runs."

---

## 2. Repos to clone/study first (P0)

| Repo | Role | Action |
|---|---|---|
| `opencap-org/opencap-core` + `opencap-processing` | Primary architecture blueprint (Apache-2.0 core) | Reproduce end-to-end on sample data; internalize triangulation→enhancer→OpenSim flow |
| `perfanalytics/Pose2Sim` | Second reference: multi-cam calibration + triangulation → OpenSim | Reproduce; harvest calibration/sync engineering (VERIFY license) |
| `open-mmlab/mmpose` (RTMPose) + `open-mmlab/mmdeploy` | Shippable 2D pose + export to CoreML/ONNX/TFLite | Stand up RTMPose-s/m/l; test MMDeploy export path |
| `opensim-org/opensim-core` | Biomech scaling + inverse **kinematics** (no dynamics) | Musculoskeletal model (Rajagopal/gait2392); IK harness |
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
| Marker augmentation | **Retrain OpenCap LSTM/Transformer enhancer on athletic video** (20→43 markers) | Hold ≤ ~5° on unseen sprint/cut |
| Biomech | **OpenSim** scaling + inverse **kinematics** (no inverse dynamics) | Full-body model (arms matter for sprint) |
| Force / kinetics | **NOT IN SCOPE.** Owned by FITS force plates, separate workflow. | — |
| Mobile runtime | CoreML (iOS first), ONNX/TFLite (Android later) | FP16/INT8 quantization, validate accuracy retention |
| Cloud | Containerized GPU workers + job queue + object storage + per-athlete DB | Async; store calibration + raw + derived |

---

## 4. Phased execution (build in this order)

### P0 — Foundations & legal
- [ ] `LICENSE-CLEARANCE.md` covering every dependency's commercial terms.
- [ ] Reproduce OpenCap and Pose2Sim end-to-end on public sample data; record their output
      numbers as your internal baseline.
- [ ] Repo skeleton: `capture/`, `calibration/`, `pose2d/`, `triangulation/`, `augment/`,
      `opensim/`, `ondevice/`, `cloud/`, `eval/`, `data/`. (No `grf/` — force is out of scope.)
- **Exit:** both reference pipelines produce published-ballpark kinematics on a public clip.

### P1 — Multi-cam 3D kinematics (cloud)
- [ ] Camera rig: start with **4 global-shutter cameras at 120–240 fps** (scale to 8).
      **Inter-camera sync only — no force-plate integration.**
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
- [ ] Assemble athletic training set: AthletePose3D + BEDLAM synthetic + FITS **video** captures.
- [ ] Retrain/extend the enhancer (20 sparse keypoints → 43 anatomical markers).
- [ ] Generalization eval on **held-out sprint/cut/land** movements.
- **Exit:** retrained enhancer holds accuracy on unseen dynamic movements where the stock
  enhancer collapses (stock degrades to ~40° mean / 252° max on unseen diverse motion).

### P4 — Sprint/cut coverage + product
- [ ] Cutting/CoD metrics (approach speed, deceleration, cut angle, asymmetry) + injury-risk
      screens (report with plane-honesty caveats).
- [ ] Coach dashboards; **integrate with FITS's existing jump-metric dashboards**
      (`Coach_Team_Jump_Metric_Dashboard.html`, `tools/build_jump_coach_dashboard.py`).
- [ ] End-to-end athlete report generation.
- **Exit:** full kinematic report (sprint + jump/hop + cut); head-to-head capture vs VueMotion.

### P5 — Validation study & hardening
- [ ] Formal concurrent-validity study vs **VICON (kinematics)** on sprint/cut/jump.
- [ ] Test-retest reliability (between-day SEM).
- **Exit:** documented accuracy meeting the targets in `00-STRATEGY.md` §9.

> There is no force/GRF phase. Force stays with FITS's force plates throughout.

---

## 5. Accuracy targets (v1 acceptance)

| Metric | Target | Reference |
|---|---|---|
| Lower-limb **sagittal** kinematics RMSE | ≤ 5° | OpenCap 3.85° MAE; Pose2Sim 3–4°; Theia3D 0.96–3.71° |
| Frontal/transverse kinematics | *Documented*, not necessarily better | Industry ceiling; SEM > 5° transverse |
| Force / kinetics | **N/A — out of scope** | Owned by FITS force plates (separate) |
| On-device pose | ≥ 30 fps, stable skeleton | RTMPose 35+ fps on 2020-era mobile SoC |

---

## 6. Datasets (fetch/build in P0–P4)

- **AthletePose3D** (CVPRW 2025) — sprint/jump/cut 3D pose benchmark → primary athletic fine-tune/eval.
- **BEDLAM** — synthetic humans, perfect 3D GT → cheap volume / rare-pose coverage.
- **OpenCap dataset** — marker-enhancer training corpus.
- **Nature Sci Data 2024** synced video+marker-mocap set → **kinematic** validation GT (public marker reference, not FITS plates).
- **★ FITS proprietary** multi-cam **video** of athletes → fine-tune pose + marker-augmentation; on-domain **kinematic** validation.

*(No kinetics datasets — force is out of scope.)*

> ⚠️ **License gate before P3 (see `LICENSE-CLEARANCE.md`):** AthletePose3D, AMASS, BEDLAM, SMPL,
> Human3.6M are **non-commercial / license-on-request** (AMASS bans commercial NN training) →
> **R&D-only.** A shipped model must train on **owned consented athletic video + permissive/
> licensed data**. COCO-pretrained RTMPose/ViTPose base weights ship fine (attribution).

---

## 7. Non-negotiable "don'ts"

- ❌ Don't ship OpenPose, Ultralytics YOLO-Pose, or Sapiens weights in the product.
- ❌ Don't estimate force/GRF/joint moments from video — force is out of scope (plates own it).
- ❌ Don't wire the force plates into the CV capture timeline — they are a separate system.
- ❌ Don't claim transverse-plane rotation precision you can't back with your own validation.
- ❌ Don't train giant pose backbones from scratch — fine-tune; spend compute on the small nets.
- ❌ Don't trust a single small-sample study — validate in-house on FITS athletes.

---

## 8. First three concrete tasks for Fable 5

1. **P0-1:** Produce `LICENSE-CLEARANCE.md` — enumerate every intended dependency and its
   commercial-use verdict; confirm the shippable stack is clean.
2. **P0-2:** Stand up and reproduce **OpenCap** end-to-end on a public sample; log its output
   kinematics as the internal baseline.
3. **P1-1:** Design the **4-camera, 120–240 fps, global-shutter capture + inter-camera sync +
   calibration** protocol (**cameras only — no force-plate integration**) as a written spec,
   then implement calibration + triangulation and measure sagittal RMSE vs a reference clip.

*Escalate to the user only for: capital hardware purchases, buying a commercial license
(OpenPose/Sapiens), or any product accuracy claim that goes to marketing.*
