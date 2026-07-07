# Movement Keyframe Studio

Interactive, browser-based keyframe + biomechanics tool for the FITS movement
library — VueMotion as the reference product, pure-kinematic scope.

**Open:** `keyframe-studio.html` (self-contained, no network) or the published Artifact.

## What it does
- **8 movements:** approach jump, throwing, acceleration, broad jump, lateral jump,
  L-hop, pent hop, change of direction.
- **Skeleton playback** with COM trace, ground scale, live phase pill, and joint-angle
  arcs (knee/hip) rendered on the athlete.
- **Editable phase timeline:** auto-detected key events per movement; drag markers to
  retime, add a keyframe at the playhead, delete, rename.
- **Live joint angles** (trunk lean, hip/knee/ankle flex, elbow, knee separation, foot
  contact) and **take metrics** (flight time, jump height, takeoff angle, distance,
  contact time, RSI, release speed, knee-valgus proxy…).
- **Export** keyframes + angles + metrics as JSON in the pipeline's schema.

## How it's built
- `engine.js` — pure analysis engine (browser + node). Forward kinematics from authored
  segment-angle keyposes; **every metric is computed from the joints, not the authoring
  angles**, so on-screen = measured — the same contract the real pipeline uses.
- `app.js` — canvas rendering, timeline, panels, keyframe editing, export.
- `build.py` — inlines engine + app into the self-contained `keyframe-studio.html`.

Verify the math without a browser:
```
node engine.test.js        # geometry + metrics finite, contacts detected, values sane
python3 build.py           # rebuild keyframe-studio.html
```

## Honest scope
Demo takes are **procedurally generated** stand-ins (no live pose model — the Artifact
sandbox blocks external ML libs). They read/write the **same keypoint + keyframe schema**
the P1 multi-camera pipeline emits, so real triangulated takes drop in unchanged. The
knee-valgus/rotation readouts are flagged ⚠ — transverse-plane rotation is the
industry-wide markerless accuracy ceiling and is shown as a proxy, not ground truth.
