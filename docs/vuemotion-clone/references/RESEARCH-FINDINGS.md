# Research Findings & Evidence Base

Cited foundation for the VueMotion clone strategy. Two sources:
1. A **deep-research workflow** (114 agents: fan-out web search → source fetch → 3-vote
   adversarial verification → synthesis). 25 claims verified, **24 confirmed, 1 refuted**.
2. **Peer-reviewed validation studies** retrieved via **PubMed** (attributions + DOI links below).

Confidence tags and verification votes (e.g. `3-0`) are from the adversarial verification step.
Where a claim was **refuted**, it is flagged — do not rely on it.

---

## A. On-device / 2D pose estimation

**A1. RTMPose — best permissively-licensed real-time 2D pose (SHIP THIS).** `high · 3-0`
RTMPose-m: **75.8% COCO AP** at 90+ FPS CPU, 430+ FPS GTX 1660Ti, **35+ FPS on a Snapdragon
865** (a 2020 SoC → modern iPhone A-series exceeds this). RTMPose-s: **72.2% AP at 70+ FPS**
on Snapdragon 865. **Apache-2.0**, actively maintained, exports via MMDeploy to
ONNX/TensorRT/CoreML/ncnn.
Sources: arXiv:2303.07399 · open-mmlab/mmpose.

**A2. Sapiens — accuracy leader, but NON-COMMERCIAL.** `high · 3-0`
**82.2 COCO body AP** (2B params; scales 79.6→81.2→82.1→82.2 across 0.3B–2B). Supports
17/133 (whole-body)/**308 dense** keypoint formats (useful for foot/limb detail). **Weights
are CC-BY-NC 4.0 → commercial use blocked without a Meta license.** SOTA numbers use large
1024×768 input (not mobile). **Use for internal labeling/validation only.**
Source: arXiv:2408.12569 · facebookresearch/sapiens.

**A3. Other real-time options (context).** YOLO11-Pose ~89.4% mAP@0.5 at 200+ FPS — but
**Ultralytics is AGPL-3.0** (copyleft; commercial license required). RF-DETR Keypoint ~71.8
AP at 9.8 ms. Treat these as fallback, license permitting.
Source: roboflow (blog, corroborating).

---

## B. Multi-view 3D pipelines & biomechanical fitting

**B1. OpenCap — primary open blueprint.** `high · 3-0 (2-1 on one sub-claim)`
2+ synced phones (validation used 5) → OpenPose/HRNet 2D → **DLT triangulation** → **LSTM
marker enhancer (20 sparse keypoints → 43 anatomical markers)** → **OpenSim** IK +
muscle-driven simulation, automated in the cloud. Lower-extremity kinematic **RMSE 2.0–10.2°**
vs marker-based mocap (comparable to IMU). *Caveat: best-case lab conditions; kinetics
simulated, not measured.*
Source: Uhlrich et al., PLOS Comput Biol 2023;19(10):e1011462 · nmbl.stanford.edu OpenCap manuscript.

**B2. Upgraded OpenCap marker enhancer — the highest-leverage retrain.** `high · 3-0`
Trained on **1,176 subjects / 1,433 synthesized hours**: **~4.1° mean RMSE (max 8.7°)** on
benchmark movements vs **9.6° (max 43.1°)** for raw video keypoints and 5.3° (max 11.5°) for
the original enhancer. On **unseen diverse** movements it **held 4.1° mean (max 6.7°)** where
the original enhancer **collapsed to 40.4° mean (max 252°)**. Marker augmentation improved
some DOFs by up to **35.9°**.
Source: Uhlrich/Falisse et al., "Marker Data Enhancement for Markerless Motion Capture,"
bioRxiv 2024.07.13.603382 / IEEE TBME 2025 · PMC11275905.

**B3. Pose2Sim — open sports-tuned multi-cam → OpenSim.** `high · 3-0`
Mean joint-angle error **3.0° (walk) / 4.1° (run) / 4.0° (cycle)** vs Qualisys/OpenSim;
sagittal CMC > 0.9 for most tasks. Failure modes: hip-in-running systematic ~15° offset
(CMC 0.65); occluded ankle in cycling (CMC 0.75); non-sagittal hip rotations didn't agree
(CMC < 0.75). *Validation n=1.*
Source: Pagnon et al., Sensors 2022;22:2712 · perfanalytics/Pose2Sim.

**B4. Theia3D — commercial 8-camera benchmark to beat.** `high · 3-0 (2-1 on one sub-claim)`
Joint-center agreement with VICON **< 2.5 cm** (hip 3.6 cm); global segment angles **< 5.5°**;
full-curve joint-angle **RMSD 0.96–3.71°**; single-leg functional-task RMSD **3.2–3.6°**.
**Transverse-plane / long-axis rotations are the accuracy ceiling (SEM > 5°).**
Source: Kanko et al., J Biomech 2021 (S0021929021004346) · Theia3D systematic review 2025
(S0933365725002672).

---

## C. GRF & kinetics from video (the hard, differentiating output)

**C1. GRF-from-video is feasible but coarse; kinematics ≠ kinetics.** `high · 3-0`
Best from smartphone video via muscle-driven tracking: **~6.7 ± 4.3 %BW GRF RMSE**,
**~1.34 ± 0.96 %BW·height joint-moment RMSE**. **Critical:** improving *kinematic* accuracy
does **not** consistently improve *dynamics* (even tracking gold-standard lab kinematics gave
comparable dynamics error). → A dedicated force model is required.
Source: PMC11275905.

**C2. Frontier method — hybrid ML + simulation.** `high · 3-0 (preprint — treat as promising)`
ML (transformer, e.g. GaitDynamics trained on AddBiomechanics) predicts GRF/CoP from video
kinematics, then a dynamic simulation enforces dynamic consistency → **~40% lower vertical
GRF error** vs physics-only; improved knee-OA joint-loading metrics 13–30%. *Dec-2025
bioRxiv preprint, not yet peer-reviewed, no independent replication.*
Source: bioRxiv 2025.12.19.695562.

**C3. Monocular OpenCap-style GRF (corroborating, PubMed).** `peer-reviewed`
Single-video musculoskeletal simulation: MAE **8.4°** joint angles, **5.0 %BW** GRF,
**1.1 %BW·height** joint moments.
> According to PubMed — Ueno R., *Heliyon* 2024;10(11):e32078.
> [DOI](https://doi.org/10.1016/j.heliyon.2024.e32078)

**C4. GRF-from-kinematics CNN error bounds (PubMed).** `peer-reviewed`
1D-CNN predicting 3-axis GRF from joint angles: typically-developed subjects **nRMSE < 12.65%,
PCC > 0.94**; cerebral-palsy (harder) nRMSE < 20.13%, PCC > 0.84. Shows kinematics→GRF is
learnable but domain-sensitive.
> According to PubMed — Ozates et al., *Ann Biomed Eng* 2024;53(3):634-643.
> [DOI](https://doi.org/10.1007/s10439-024-03658-y)

**C5. REFUTED — do not rely on this.** `1-2 ✗`
A specific set of OpenCap joint-moment accuracy numbers (0.75 %BW·height MAE; peak knee
adduction moment r = 0.80, MAE 0.30 %BW·height) **did not survive verification.** Treat any
single headline kinetics figure with caution.

---

## D. Validation vs gold standard (PubMed anchors)

**D1. OpenCap on return-to-sport tasks.** `peer-reviewed`
437 trials, jump-landing/single-leg-hop/lateral-vertical-hop vs 10-camera marker system:
grand mean **3.85° MAE / 4.34° RMSE**; sagittal knee/hip **CMC > 0.94**; ankle CMC 0.84–0.93;
frontal CMC 0.47–0.78; transverse CMC 0.51–0.6.
> According to PubMed — Turner et al., *J Biomech* 2024;171:112200.
> [DOI](https://doi.org/10.1016/j.jbiomech.2024.112200)

**D2. OpenCap on healthy & pathological gait.** `peer-reviewed`
Overall **RMSE 5.8° (SD 1.8)**, peak error 11.3°; errors highest for crouch/circumduction gait.
Authors note this is **above the clinically desirable 2–5° threshold** — headroom for a
retrained enhancer.
> According to PubMed — Horsak et al., *J Biomech* 2023;159:111801.
> [DOI](https://doi.org/10.1016/j.jbiomech.2023.111801)

**D3. Multi-camera markerless at low frame rate — why high fps matters.** `peer-reviewed`
6-camera consumer setup at **25 Hz** vs 10-camera VICON on basketball tasks (incl. sprinting):
joint **displacement** excellent (**r = 0.916–0.994**, median nRMSE 0.54–1.32%), but
**velocity (r = 0.583–0.867) and acceleration (r = 0.232–0.677) degrade sharply.** →
**Impact/GRF live in the derivatives; a high-fps rig (200+) is required for impact work.**
> According to PubMed — Li et al., *Sensors* 2026;26(5):1689.
> [DOI](https://doi.org/10.3390/s26051689)

---

## E. Datasets

- **AthletePose3D** (CVPRW 2025, arXiv:2503.07499) — 3D pose benchmark for **high-velocity
  athletics** (sprint/jump/cut). Most on-point public set.
- **BEDLAM** (arXiv:2304.01865) — large photorealistic **synthetic** humans, perfect 3D GT.
- **AMASS / Human3.6M / 3DPW** — canonical 3D motion/pose benchmarks (Human3.6M license restrictive).
- **OpenCap dataset** — marker-enhancer training corpus (open).
- **AddBiomechanics** — kinematics+kinetics corpus with OpenSim fits → GRF model training.
- **Nature Sci Data 2024** (s41597-024-04077-3) — **synced multi-cam video + mocap + force
  plate** → pipeline validation ground truth.

---

## F. Licenses (clear before shipping)

| Component | License | Commercial? |
|---|---|---|
| RTMPose / MMPose / MMDeploy | Apache-2.0 | ✅ Yes |
| ViTPose | Apache-2.0 | ✅ Yes |
| OpenSim | permissive (Apache-style) | ✅ Yes |
| Pose2Sim | BSD-style (VERIFY) | ✅ likely |
| OpenCap core | Apache-2.0 (core) | ✅ (verify per-module deps) |
| **OpenPose** | CMU non-commercial | ❌ ~$25k commercial license |
| **Ultralytics YOLO-Pose** | AGPL-3.0 | ❌ copyleft / commercial license needed |
| **Sapiens weights** | CC-BY-NC 4.0 | ❌ Meta license needed |
| **SMPL/SMPL-X** | research license nuances | ⚠️ clear before shipping meshes |

---

## G. Open questions the build must resolve empirically

1. How do published accuracies (2–5° angles, ~6.7 %BW GRF) degrade on **real sprint/cut
   extremes** (motion blur, occlusion)? No source validated these on sprint/cut extremes.
2. Realistic achievable accuracy for **cut/valgus injury-risk metrics** given the universal
   transverse-plane ceiling?
3. Best **camera-count × frame-rate** trade-off (2/4/8 cams × 60/120/240 fps) for FITS's
   target movements — sources validate individual pipelines, not hardware configs head-to-head.
4. Can the hybrid ML+sim GRF method (validated on walking) generalize to **impact-heavy
   foot-strike/landing/cutting** forces, and what extra training data is needed?

---

## H. Global caveats (from the verification step)

- Most quoted accuracies come from **gait / controlled tasks**, not sprint/cut extremes —
  treat as optimistic for this product's target domain.
- The strongest GRF result (hybrid ML+sim, ~40%) is a **Dec-2025 preprint** — reproduce
  internally before betting product claims on it.
- Several validation studies have **very small samples** (Pose2Sim accuracy paper n=1).
- **Transverse-plane / long-axis rotation** (int/ext rotation) is a **universal** limitation
  and directly undermines rotation-dependent injury-risk metrics.
- Pose-estimator FPS/AP numbers are **author-reported**, not third-party audited.
- One kinetics claim was **refuted** (§C5) — no single headline kinetics figure is safe.

---

*PubMed material used above is attributed inline per PubMed's terms, with DOI links. The
deep-research workflow's full per-claim source list and verification votes are preserved in
the session task output (`wyn86cuki.output`).*
