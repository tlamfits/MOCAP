"""cloud/ — heavy-tier orchestration (async).

Job queue + GPU workers running the full cloud pipeline (pose2d -> triangulation ->
augment -> opensim -> eval), object storage for video, per-athlete history DB.
The on-device tier (ondevice/) runs the live 2D preview in parallel.

TODO(P1/P5): orchestration + storage + athlete DB.
"""
from __future__ import annotations

from vuemotion_clone.types import KinematicResult


def process_trial(trial_id: str) -> KinematicResult:
    """Run the full cloud kinematics pipeline for one captured trial."""
    raise NotImplementedError("P1: cloud pipeline orchestration")
