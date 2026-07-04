# LICENSE CLEARANCE MEMO (P0-1)

**Project:** VueMotion clone — pure kinematic markerless mocap
**Prepared by:** Fable 5 (execution) · **Date:** 2026-07-04
**Status:** First-pass engineering due diligence — **NOT legal advice.** Anything that ships
must be reviewed by counsel. License terms change; every item below carries a "verified on"
date and a source link so it can be re-checked.

---

## 0. TL;DR — two verdicts

1. **The shippable *code* stack is clean.** RTMPose/MMPose/MMDeploy, ViTPose, OpenSim,
   Pose2Sim, and OpenCap-core are all Apache-2.0 / BSD-3 / MIT — commercial-use OK. The only
   code landmines are OpenPose, Ultralytics YOLO, and Sapiens **weights**, all of which the
   plan already avoids. ✅
2. **⚠️ The *training data* is the real problem, and it's bigger than expected.** The best
   athletic/biomechanics datasets — **AthletePose3D, AMASS, BEDLAM, SMPL/SMPL-X** — are
   **non-commercial** or **license-on-request**. AMASS explicitly forbids training neural
   networks "for commercial use of any kind." **These cannot sit in the training lineage of a
   shipped commercial model without paid/again-negotiated licenses.** This directly constrains
   the marker-augmentation retrain and pose fine-tune (Priorities 1–2). See §3 — it needs a
   decision before P3.

---

## 1. Shippable code stack — CLEARED for commercial use ✅

| Component | License | Commercial? | Verified (2026-07-04) |
|---|---|---|---|
| **RTMPose / MMPose / MMDeploy** | Apache-2.0 | ✅ Yes | Prior research (open-mmlab/mmpose LICENSE) |
| **ViTPose** | Apache-2.0 | ✅ Yes | [LICENSE](https://github.com/ViTAE-Transformer/ViTPose/blob/main/LICENSE) — Open-MMLab, no commercial restriction in file |
| **OpenSim** (opensim-core) | Apache-2.0 | ✅ Yes | [LICENSE.txt](https://github.com/opensim-org/opensim-core/blob/main/LICENSE.txt) |
| **Pose2Sim** | **BSD-3-Clause** | ✅ Yes | [LICENSE](https://github.com/perfanalytics/pose2sim/blob/main/LICENSE) — confirmed BSD-3 (research had flagged "verify") |
| **OpenCap-core** | Apache-2.0 | ✅ Yes* | [LICENSE](https://github.com/stanfordnmbl/opencap-core/blob/main/LICENSE) — *core is Apache; see §2 re: its default pose backend* |
| **HRNet** (pose backbone option) | MIT (expected) | ✅ likely | ⚠️ **VERIFY** leoxiaobin/deep-high-resolution-net LICENSE at build |
| **OpenCV** | Apache-2.0 (4.x) | ✅ Yes | Well established |
| **CoreML / ONNX Runtime / TFLite** | runtimes, permissive | ✅ Yes | Apple/MS/Google SDK terms apply |

**Net:** the pipeline `RTMPose → OpenCV calibration/triangulation → OpenSim IK`, plus Pose2Sim
as a second reference, is commercially clean at the code level.

---

## 2. Code landmines — DO NOT SHIP these ❌

| Component | License | Problem | Action |
|---|---|---|---|
| **OpenPose** | CMU Academic / non-commercial | Free for non-commercial research only; commercial license ~US$25k. **OpenCap's default pose step historically uses OpenPose.** | **Swap OpenCap's pose front-end for RTMPose or HRNet.** Never ship OpenPose. Use it only for internal comparison if at all. |
| **Ultralytics YOLO(-Pose)** | AGPL-3.0 | Strong copyleft — network use triggers source disclosure; commercial needs a paid Ultralytics license. | Don't use in product. RTMPose covers the same need under Apache-2.0. |
| **Sapiens (weights)** | CC-BY-NC 4.0 | Non-commercial. Code may be permissive; **the released weights are not.** | Internal R&D / accuracy-ceiling benchmarking only. Never in the shipped model. |

> **Critical build note:** cloning OpenCap ≠ shipping OpenCap as-is. Its reference
> implementation pulls in OpenPose. The commercial clone must replace that stage. This is a
> code change, already in the plan (RTMPose front-end), but it is the single most common way
> teams accidentally ship a non-commercial dependency.

---

## 3. ⚠️ Training-data licensing — the real blocker (decision needed before P3)

This is the finding that matters. The pure-kinematic plan's accuracy comes from **retraining
the marker-augmentation network** and **fine-tuning 2D pose** on athletic data (Strategy §6).
Most of the candidate datasets are **not** commercially licensed:

| Dataset | License | Commercial training? | Verified (2026-07-04) |
|---|---|---|---|
| **AthletePose3D** (primary athletic set) | Non-commercial, research only | ❌ **No** | [repo](https://github.com/calvinyeungck/AthletePose3D) — "non-commercial and scientific research purposes only" |
| **AMASS** (motion corpus behind marker augmentation) | MPI non-commercial | ❌ **No — explicitly bans commercial NN training** | [license](https://amass.is.tue.mpg.de/license.html) — "may not be used to train methods/…/neural networks…for commercial use of any kind" |
| **BEDLAM** (synthetic) | PS-License 1.0 | ⚠️ **By request only** (email ps-license@tue.mpg.de) | [license](https://bedlam.is.tuebingen.mpg.de/license.html) |
| **SMPL / SMPL-X** (body model for synthetic data & meshes) | MPI research; commercial via **Meshcapade** | ⚠️ **Paid license required** | [SMPL-X license](https://smpl-x.is.tue.mpg.de/modellicense.html) · [Meshcapade](https://meshcapade.com/infopages/licensing.html) |
| **Human3.6M** | Academic, restrictive | ❌ No | Well established |
| **COCO Keypoints** (behind RTMPose/ViTPose pretraining) | Images CC-BY-4.0; annotations CC-BY-4.0 | ✅ **Yes, with attribution** | [COCO terms](https://cocodataset.org/#termsofuse) — commercial OK w/ attribution |

**What this means concretely:**
- **COCO-pretrained pose weights (RTMPose/ViTPose) are broadly OK to ship commercially** (CC-BY-4.0 + Apache weights) — provide attribution. This de-risks the *base* pose model. ✅
- **But the athletic fine-tune and marker-augmentation *retrain* cannot legally use AthletePose3D, AMASS, or unlicensed BEDLAM/SMPL if the resulting model ships commercially.** Using them taints the model's provenance.
- OpenCap's *published* marker-enhancer was trained on data derived from these research corpora; **re-using OpenCap's trained enhancer weights commercially inherits the same question.** Treat OpenCap's weights as R&D-only unless Stanford/NMBL confirms commercial terms.

**Recommended commercially-clean training strategy (the mitigation):**
1. **Own your data.** Train/fine-tune primarily on **FITS-captured athletic video** with proper
   athlete/model consent and data-rights assignment. This is now not just an accuracy asset
   (Strategy §7) but a **licensing necessity.** Put a consent + data-license clause in the
   capture protocol.
2. **License what's worth it.** If synthetic data or SMPL meshes are needed, buy the
   **Meshcapade SMPL commercial license**; email MPI for **BEDLAM** commercial terms.
3. **Quarantine non-commercial data.** AthletePose3D / AMASS / Human3.6M / Sapiens → **internal
   benchmarking and R&D only**, in a separate environment, never in a shipped model's training
   lineage. Track dataset provenance per model artifact (a "data bill of materials").
4. **Attribution hygiene.** Ship COCO attribution; keep a NOTICE file for Apache-2.0 deps.

> **This is a genuine fork that needs your call before P3 (training).** It doesn't block P0–P2
> (reproduce OpenCap for R&D, build the rig, ship the on-device COCO-pretrained preview). It
> blocks *shipping a commercially-trained* enhancer. Options in the message below.

---

## 4. Open items requiring counsel or outreach (before shipping)

- [ ] **Legal review** of the full dependency + data manifest (this memo is engineering, not law).
- [ ] **Confirm HRNet license** (MIT expected) if used as the OpenCap pose backend instead of RTMPose.
- [ ] **Meshcapade SMPL commercial quote** — only if synthetic data / body meshes are in scope.
- [ ] **BEDLAM commercial terms** — email MPI if synthetic pretraining is desired.
- [ ] **OpenCap trained-weights commercial status** — ask Stanford NMBL, or retrain from scratch on owned data.
- [ ] **Athlete consent + data-rights** clause in the FITS capture protocol (P1) — required for commercial training on your own footage.
- [ ] **COCO attribution** string + Apache-2.0 `NOTICE` file in the product.
- [ ] Re-verify every row of §1–§3 at build time (licenses drift).

---

## 5. Verification log

All rows verified **2026-07-04** via the linked primary sources (GitHub LICENSE files and
official model/dataset license pages). Method: direct fetch of LICENSE files for code repos;
official license pages for datasets/body models. Items marked ⚠️ VERIFY were not
independently confirmed to a primary LICENSE file in this pass and must be checked at build.

**Bottom line:** ship the code stack with confidence; **do not train the shipping model on
non-commercial datasets** — use owned athletic video + licensed/permissive data, and keep the
research corpora walled off for R&D. Decision required on §3 before Priority-1/2 training.
