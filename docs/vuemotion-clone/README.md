# VueMotion Clone + Upgrade — Planning Package

Deep-research-backed plan to clone **VueMotion** (iPhone single-camera markerless mocap for
athletic movement) and surpass it with a **lab-grade multi-camera 3D** system, then hand
execution to **Fable 5**.

## Read in this order

1. **[`00-STRATEGY.md`](./00-STRATEGY.md)** — the master strategy: what VueMotion is, the
   target architecture, reference pipelines to clone, tech stack + license landmines, the
   GRF/force plan, training approach, validation methodology, phased roadmap, and risk register.
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
- **The CV system and FITS's force plates are separate** — not synced or fused. Kinematics is
  the product; win by **retraining the marker-augmentation network on athletic video** (and
  fine-tuning 2D pose second).
- **CV-based GRF is optional:** public-data-trained, uncertainty-bounded, useful only as a
  *field estimate* where a plate can't reach. If not worth the caveats, cut it — the plates
  own force outright.
- Be honest about the industry-wide ceiling: **transverse-plane rotation** and **video-only
  kinetics** are hard for everyone; win on sagittal kinematics, jump/hop, and sprint/cut mechanics.
- Fable 5 executes the phased roadmap (P0 legal/foundations → P6 validation study) against
  measured accuracy gates.

---
*Planning model: claude-opus-4-8 · Execution model: Fable 5 · Prepared 2026-07-04*
