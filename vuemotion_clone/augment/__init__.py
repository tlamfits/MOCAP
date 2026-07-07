"""augment/ — marker-augmentation network (highest-leverage kinematic upgrade).

Maps sparse triangulated keypoints (~20) to dense anatomical markers (~43) for
OpenSim. Retraining THIS network on athletic movement is Priority 1 (docs §6).

⚠️ LICENSE GATE (docs/vuemotion-clone/LICENSE-CLEARANCE.md): a shipped model must
be trained on owned consented athletic video + permissive/licensed data. AthletePose3D,
AMASS, BEDLAM, SMPL are non-commercial / license-on-request — R&D only.

TODO(P3): retrain enhancer on athletic data (after license decision).
"""
from __future__ import annotations

from vuemotion_clone.types import Keypoints3D, MarkerSet


class MarkerEnhancer:
    """Sparse keypoints -> dense anatomical markers (LSTM/Transformer over time)."""

    def __init__(self, weights: str | None = None) -> None:
        self.weights = weights  # provenance tracked in data bill-of-materials

    def enhance(self, keypoints: list[Keypoints3D]) -> list[MarkerSet]:
        raise NotImplementedError("P3: marker augmentation")
