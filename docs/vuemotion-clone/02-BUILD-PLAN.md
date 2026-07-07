# Build Plan — what needs to be built

Component-by-component build breakdown for the pure-kinematic markerless mocap system,
produced by a 16-agent verified workflow (one assessor per component → roadmap synthesis →
adversarial completeness critic) and reconciled with the critic's corrections.

> **Where we are:** the algorithmic core is real and tested — `triangulation/` (DLT+RANSAC)
> and `eval/` (RMSE/CMC vs VICON), 11 passing tests — plus a working browser **movement
> engine** (studio). The **pipeline prototype** proves capture→2D→triangulate→3D→angles on
> synthetic multi-camera data at **5.9 mm mean / 10.6 mm p95**, knee **1.21° RMSE**, with
> RANSAC rejecting a corrupted view. Everything else is stub or partial.

## Component status

| Component | Status | Effort | On critical path | Key external need |
|---|---|---|---|---|
| **Triangulation (3D)** | ✅ implemented core (refinement pending) | M | yes | none (CPU) |
| **Eval / validation math** | ✅ implemented + tested | — | yes | VICON for the *study* |
| **Movement + keyframe engine** | 🟡 partial (JS done; Python port needed) | L | yes | none (CPU) |
| **Data schema / IO spine** | 🟡 partial | M | yes | none (CPU) |
| **Calibration** | ⬜ stub | M | yes | ChArUco board + cams |
| **Camera sync** | ⬜ stub | L | yes | genlock (or SW fallback) |
| **Capture rig (hardware)** | ⬜ not started | L | yes | **4–8 cameras (buy)** |
| **2D pose (RTMPose)** | ⬜ stub | L | yes | **GPU** + fine-tune data |
| **Marker augmentation** | ⬜ stub | L | yes | licensing-clean training data |
| **OpenSim IK** | ⬜ stub | L | yes* | OpenSim runtime; per-athlete static trial |
| **Cloud / orchestration / DB** | ⬜ stub | L | yes | cloud storage |
| **Reporting / dashboards** | 🟡 partial (studio) | L | yes | a real take JSON |
| **Datasets + training** | ⬜ stub | XL | **yes (tail)** | 1 GPU + **owned consented data** |
| **Validation vs VICON** | 🟡 partial | L | **yes (tail)** | **VICON + athlete time** |
| **On-device iOS preview** | 📄 docs only | L | no | Mac/Xcode + dev account |

\* OpenSim IK is a hard dep for the *shippable* kinematic accuracy but is deliberately
**bypassed for the first real take** (use engine FK angles) — see min-path below.

## Corrected critical path

The synthesis path omitted two mandatory tail components; corrected:

```
data_schema → calibration → camera_sync → capture_rig → pose2d → triangulation
   → marker_aug → opensim_ik → movement_engine → reporting
   → datasets_training (owned consented retrain) → validation (VICON ≤5° gate)
```

Plus **two long-lead-time tracks that must start in Phase 0, in parallel**, or they silently
become the schedule tail:
- **Camera procurement** (weeks of lead time)
- **IRB / consent / athlete data-rights** (PIPEDA — Toronto) — gates *all* owned-data capture
  and the entire VICON study

## Phased roadmap

| Phase | Weeks | Goal | Exit criterion |
|---|---|---|---|
| **P0 — Lock contracts on CPU** | 1–4 | Freeze the data spine; prove every risky algorithm against synthetic/public data. **Also: kick off camera procurement + IRB.** | One command runs a full synthetic round-trip (3D→N cams w/ distortion+sub-frame offset+dropped frames→calibrate→sync-recover→2D→triangulate+refine→OpenSim Scale+IK→eval within tolerance). Versioned Take container round-trips Python↔studio, golden tests green. |
| **P1 — Full synthetic pipeline + control plane** | 4–9 | Stand up remaining stages + orchestration/reporting so a take flows through the whole product on synthetic/public data. | `cloud.process_trial()` runs a resumable DAG ingest→pose2d→triangulate→augment→opensim→engine→eval→store; studio loads the resulting real take JSON unchanged. Marker-aug net beats baseline via eval. Data-BoM enforced in CI. |
| **P2 — Hardware bring-up & FIRST REAL TAKE** | 8–16 (overlaps P1) | Stand up a minimal physical rig; wire drivers into the already-proven contracts; push one captured movement to the studio. | Real athlete, one movement, 4 synced cameras (software-sync OK) → calibrate under QC gate → pose2d→triangulate→engine → appears in studio with sane sagittal metrics. |
| **P3 — Accuracy, athletic fine-tune & VICON study** | 14–26 | Close the domain gap; retrain shippable models on owned data; run concurrent-validity study. | VICON study passes **≤5° sagittal lower-limb MAE** across the movement matrix; transverse/valgus reported as flagged proxies; shipping weights carry a clean data-BoM. |
| **P4 — Productization & scale-out** | 24+ | Facility-grade: GPU cloud throughput, consent/retention/encryption, coach reports + FITS dashboard integration, longitudinal history, optional iOS live preview. | Coaches self-serve a session → per-athlete report + trend view in the FITS jump dashboard; scale to 8 cameras; iOS overlay ships (non-blocking). |

## Shortest path to the first real take (bypasses marker-aug + OpenSim IK)

1. Freeze the versioned **Take container + keypoint-layout registry** (unify coco17 / prototype / studio joint sets) so the studio loads a pipeline take unchanged.
2. **Port `studio/engine.js` → `vuemotion_clone/movement/`** (joint angles, contact/airborne, metrics) consuming `Keypoints3D`, emitting the existing take JSON.
3. Wire **RTMPose ONNX (CPU) inference** into `Pose2DEstimator.infer()` → `Keypoints2D`; validate on public sports clips.
4. Procure a **minimal rig**: 4 global-shutter cameras + lenses/mounts + capture PC + fast storage + a printed ChArUco board + one LED strobe/clapper. **Don't wait on genlock.**
5. Implement `load_synced_views()` acquisition (grab, timestamps, dropped-frame detection, manifest) with the **software-sync fallback** (flash/audio + the reprojection-residual sub-frame refiner built in P0).
6. Run `calibrate_rig()` on a real board capture; pass the per-session **reprojection-error QC gate**.
7. Capture one movement → pose2d → **existing `triangulate()`** → movement engine → export take JSON → load in the studio. (Skip marker-aug + OpenSim IK for this take — use engine FK angles.)

## Quick wins — buildable **now**, CPU-only, no hardware

- **Data schema:** versioned Take container + keypoint-layout registry + save/load + Python↔studio golden tests (unblocks every stage).
- **Triangulation:** add Gauss-Newton/LM reprojection refinement after the DLT seed + temporal smoothing (Savitzky-Golay/Kalman) + NaN gap-fill.
- **Calibration:** synthetic ChArUco harness — recover known K/R/t through intrinsics→extrinsics→bundle-adjustment; assert round-trip through `projection_matrix`.
- **Camera sync:** synthetic harness that injects known offsets/drops and recovers them via the reprojection-residual sub-frame minimizer (de-risks the single riskiest algorithm).
- **2D pose:** RTMPose ONNX CPU wrapper validated on public sports clips into the triangulation/eval round-trip.
- **OpenSim IK:** pinned CPU conda env running stock Rajagopal Scale+IK on OpenSim's bundled sample TRC, scored through eval.
- **Movement engine:** Python port of `engine.js` with known-answer pytest on a broad jump.
- **Marker aug:** synthetic paired keypoint→43-marker generator + small net trained on CPU, scored through eval (Priority-1 kinematic win).
- **Reporting:** studio data loader replacing `generateTake()` + static HTML→PDF report on synthetic schema-valid takes.
- **Cloud:** resumable DAG orchestrating the two *real* stages (triangulate+eval) over SQLite/MinIO with per-athlete history — the full control plane, no GPU.
- **Datasets:** harden `data/REGISTRY` into a per-artifact BoM writer + `assert_shippable` CI gate.
- **Validation:** synthetic-truth regression (known angles → 2D → pipeline → `compare_to_reference`).

## Workstreams the first pass missed (added by the critic)

These are unowned and must be scheduled — several are cheap, high-value, or long-lead:
- **Consent / IRB / athlete data-rights (PIPEDA)** — long lead time; gates all owned-data capture + the VICON study. **Start P0.**
- **Force-plate event ground truth** — FITS already owns force plates (separate system). Plate contact/takeoff timing is the **cheapest possible ground truth** to validate the movement engine's event detection (contact/takeoff/RSI) *without* scarce VICON time. Wire plate timestamps in as an event-detection validation source.
- **Per-athlete anthropometrics + static/neutral-pose capture SOP** — required input for OpenSim subject-specific scaling; nothing currently produces it.
- **Model registry / serving / version-pinning** — which model version served which athlete/take; reproducible re-serving; rollback.
- **Production ML monitoring / drift detection** — runtime accuracy watchdog, canary eval of new weights, alerting.
- **Human label-correction / annotation tooling** — or auto-labels self-reinforce error with no correction surface.
- **Per-trial trustworthiness QC gate** — aggregate the stage gates (reprojection error, marker RMS, sync quality) into one "is this take good enough to show a coach" decision that reporting honors, with caveat propagation through to the PDF.
- **Data retention / deletion / data-subject-rights** — right-to-erasure across storage + DB + trained-model influence for stored biometric video.

## Biggest risks

1. **Camera/sync hardware is the schedule bottleneck** — order the minimal 4-cam rig in P0, parallel to code.
2. **Sub-frame sync error is silent poison** — at 120–240 fps a limb moves 20–40 mm/frame; half-frame residual corrupts the very derivatives the rig exists to measure. Treat sub-frame recovery as mandatory; adopt genlock the moment software-sync limits validation.
3. **Licensing taint + owned-data cold start** — shippable marker-aug/2D models are blocked until consented FITS capture produces volume; BoM enforcement in CI is non-negotiable.
4. **Silent frame/scale/marker-convention mismatch** — world frame (metres, floor origin, axes), the 43-marker set, and OpenSim DOF names must be co-designed and locked once in P0, or you ship plausible-but-wrong angles that pass every gate.
5. **Marker-aug generalization collapse on unseen dynamic motion** — the exact failure being fixed; require held-out-**movement** eval, not just held-out-subject.
6. **Transverse-plane / knee-valgus trust ceiling** — industry markerless limit; ship only as flagged proxies, with caveat propagation enforced end-to-end.
7. **Schema churn** — ship `schema_version` + migration shims from day one; keep the studio JSON contract versioned and tested.

---
*Source: `vuemotion-build-breakdown` workflow (16 agents, adversarially critiqued), reconciled
into this plan. The two prototypes (studio, pipeline viewer) live under `vuemotion_clone/`.*
