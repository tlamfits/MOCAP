"""opensim/ — biomechanical model scaling + inverse KINEMATICS.

OpenSim (Apache-2.0): scale a musculoskeletal model (Rajagopal/gait2392; consider
full-body for sprint arm action) and run inverse kinematics to joint angles.

Inverse DYNAMICS is intentionally out of scope — no joint moments / GRF / kinetics
from video. Force is owned by FITS's force plates (docs 00-STRATEGY §5).

TODO(P1): scaling + IK harness.
"""
from __future__ import annotations

from vuemotion_clone.types import JointAngles, MarkerSet


def inverse_kinematics(markers: list[MarkerSet], model_path: str) -> list[JointAngles]:
    """Fit joint angles to marker trajectories via OpenSim IK. Kinematics only."""
    raise NotImplementedError("P1: OpenSim scaling + inverse kinematics")
