"""capture/ — multi-camera acquisition and inter-camera synchronization.

Rig target (see docs 00-STRATEGY §8): 4-8 global-shutter cameras, 120-240 fps,
inter-camera sync ONLY (force plates are a separate system — do not wire them in).

TODO(P1): implement acquisition + sync. See docs 01-FABLE5-EXECUTION-BRIEF P1.
"""
from __future__ import annotations


def load_synced_views(trial_dir: str) -> dict[str, list]:
    """Load per-camera frame sequences for a trial, time-aligned across cameras.

    Returns {camera_id: [frames...]}. Sync is inter-camera only.
    """
    raise NotImplementedError("P1: multi-cam capture + sync")
