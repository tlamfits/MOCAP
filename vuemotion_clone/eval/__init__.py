"""eval/ — accuracy harness vs gold standard (VICON).

Report MAE/RMSE + waveform agreement (CMC / Pearson r) PER JOINT, PER PLANE, PER
MOVEMENT — never a single headline number. Sagittal plane is strong (2-5 deg);
transverse-plane rotation is the industry-wide weak spot — report it honestly.

Acceptance (v1): <= 5 deg sagittal lower-limb RMSE vs VICON on CMJ + hop.
No force/kinetic metrics — out of scope.

TODO(P1): implement metrics + per-plane reporting.
"""
from __future__ import annotations

from vuemotion_clone.types import KinematicResult


def compare_to_reference(
    predicted: KinematicResult,
    reference: KinematicResult,
) -> dict:
    """Return per-joint / per-plane / per-movement MAE, RMSE, CMC, Pearson r."""
    raise NotImplementedError("P1: kinematic validation metrics")
