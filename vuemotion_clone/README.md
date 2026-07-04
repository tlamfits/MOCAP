# vuemotion_clone — pure kinematic markerless mocap pipeline

Code scaffold for the multi-camera, true-3D, markerless **kinematics** system specified in
[`../docs/vuemotion-clone/`](../docs/vuemotion-clone/). This is the P0-3 skeleton — module
stubs and contracts, not yet an implementation.

> **Scope reminder:** kinematics only. No force/GRF/kinetics from video — force is owned by
> FITS's force plates (separate workflow). See `docs/vuemotion-clone/00-STRATEGY.md` §5.

## Pipeline (data flow)

```
capture ──▶ calibration ──▶ pose2d ──▶ triangulation ──▶ augment ──▶ opensim ──▶ eval
  (video)   (intrinsics/    (RTMPose   (robust DLT +      (marker    (scaling +   (vs VICON,
            extrinsics)      2D kpts)   RANSAC → 3D)        enhancer)  inverse      per-plane)
                                                                       kinematics)
   └─ ondevice/ : RTMPose→CoreML live 2D preview (parallel real-time tier)
   └─ cloud/    : orchestration, job queue, storage, per-athlete DB
   └─ data/     : dataset adapters + provenance ("data bill of materials")
```

## Modules

| Dir | Responsibility | Key deps (all commercial-safe) |
|---|---|---|
| `capture/` | Multi-cam acquisition, inter-camera sync, frame I/O | — |
| `calibration/` | Intrinsics + extrinsics (ChArUco/checkerboard), bundle adjustment | OpenCV (Apache-2.0) |
| `pose2d/` | 2D keypoint inference per view | RTMPose/MMPose (Apache-2.0), ViTPose (Apache-2.0) |
| `triangulation/` | Robust DLT + RANSAC multi-view fusion → 3D keypoints | NumPy/SciPy |
| `augment/` | Marker-augmentation net (20→43 anatomical markers) — retrain target | PyTorch |
| `opensim/` | Scaling + **inverse kinematics** (no inverse dynamics) | OpenSim (Apache-2.0) |
| `ondevice/` | RTMPose → CoreML live 2D preview tier | CoreML / ONNX / TFLite |
| `cloud/` | Job orchestration, storage, athlete history | — |
| `eval/` | Accuracy harness: MAE/RMSE + CMC/Pearson vs VICON, **per joint / plane / movement** | — |
| `data/` | Dataset adapters + **license/provenance tracking** (see `LICENSE-CLEARANCE.md`) | — |

## Status

Scaffold only. Each module has a stub with its interface contract and a `TODO` referencing the
execution brief phase that fills it in. Nothing here runs yet.

## Build order (from the execution brief)

P0 foundations → **P1** cloud 3D kinematics (`≤5° sagittal RMSE vs VICON`) → **P2** on-device
preview (`≥30 fps`) → **P3** marker-augmentation retrain → **P4** sprint/cut product → **P5**
validation study.

⚠️ **License gate before P3:** the shipping model must be trained on owned consented athletic
video + permissive/licensed data — not the non-commercial research sets. See
[`../docs/vuemotion-clone/LICENSE-CLEARANCE.md`](../docs/vuemotion-clone/LICENSE-CLEARANCE.md).
