# VueMotion Clone + Upgrade — Planning Package

Deep-research-backed plan to clone **VueMotion** (iPhone single-camera markerless mocap for
athletic movement) and surpass it with a **lab-grade multi-camera 3D** system, then hand
execution to **Fable 5**.

## Read in this order

1. **[`00-STRATEGY.md`](./00-STRATEGY.md)** — the master strategy: what VueMotion is, the
   target architecture, reference pipelines to clone, tech stack + license landmines, the
   pure-kinematic scope decision, training approach, validation methodology, phased roadmap,
   and risk register.
2. **[`01-FABLE5-EXECUTION-BRIEF.md`](./01-FABLE5-EXECUTION-BRIEF.md)** — the structured,
   imperative handoff Fable 5 builds from (settled decisions, phase gates, accuracy targets,
   first three concrete tasks).
3. **[`references/RESEARCH-FINDINGS.md`](./references/RESEARCH-FINDINGS.md)** — the cited
   evidence base with confidence levels, adversarial-verification votes, PubMed DOIs, and the
   one refuted claim.

## The plan in five sentences

- Clone the **OpenCap** architecture (`2D pose → triangulation → LSTM marker augmentation →
  OpenSim`), which is open and closest to the target.
- Upgrade it to **multi-camera true-3D at 120–240 fps** with **commercially-licensed**
  components (**RTMPose** front-end, not OpenPose/Sapiens/YOLO) and **hybrid on-device+cloud**
  delivery.
- **Pure kinematic system — no force from video.** Force is owned entirely by FITS's force
  plates, run as a separate workflow. Kinematics is the product; win by **retraining the
  marker-augmentation network on athletic video** (and fine-tuning 2D pose second).
- Be honest about the industry-wide ceiling: **transverse-plane rotation** is hard for
  everyone; win on sagittal kinematics, jump/hop, and sprint/cut mechanics.
- Fable 5 executes the phased roadmap (P0 legal/foundations → P5 validation study) against
  measured accuracy gates.

---
*Planning model: claude-opus-4-8 · Execution model: Fable 5 · Prepared 2026-07-04*
