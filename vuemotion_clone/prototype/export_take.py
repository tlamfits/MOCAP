"""Run the pipeline prototype, analyse the RECONSTRUCTED 3D with the real movement
engine, and write a Take JSON the studio loads unchanged. This closes the loop:
cameras -> triangulate -> movement engine -> shared schema -> studio.

Run:  python3 -m vuemotion_clone.prototype.export_take
"""
from __future__ import annotations

import pathlib
import numpy as np

from vuemotion_clone.prototype.pipeline_demo import run
from vuemotion_clone.movement import build_take


def main():
    bundle, acc = run()
    # stack the reconstructed 3D (from real triangulation) into (T,17,3)
    recon = np.array([fr["recon"] for fr in bundle["frames"]], float)
    take = build_take(recon, fps=bundle["fps"], movement="broad_jump", source="pipeline")
    out = pathlib.Path(__file__).parent.parent / "studio" / "captured_take.json"
    take.save(out)
    mv = {m.label: m.value for m in take.metrics}
    print("Captured take from RECONSTRUCTED 3D (real triangulation):")
    print("  frames %d @ %d fps | reconstruction accuracy: mean %.1f mm, knee %.2f deg RMSE"
          % (len(take.frames), take.fps, acc["mean_mm"], acc["knee_rmse_deg"]))
    print("  phases:", ", ".join("%s@%d" % (e.name, e.frame) for e in take.phases))
    print("  metrics:", "  ".join("%s=%.2f%s" % (k, v, "") for k, v in mv.items()))
    print("  wrote", out.name)


if __name__ == "__main__":
    main()
