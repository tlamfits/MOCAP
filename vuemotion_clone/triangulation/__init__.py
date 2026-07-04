"""triangulation/ — multi-view 2D -> 3D fusion.

Robust DLT + RANSAC across calibrated views, per-keypoint confidence weighting,
outlier-view rejection, temporal smoothing (OpenCap/Pose2Sim/AniPose style).

TODO(P1): implement triangulation. See docs 01-FABLE5-EXECUTION-BRIEF P1.
"""
from __future__ import annotations

from vuemotion_clone.types import CameraCalibration, Keypoints2D, Keypoints3D


def triangulate(
    views: list[Keypoints2D],
    calibration: list[CameraCalibration],
) -> Keypoints3D:
    """Fuse per-view 2D keypoints into a single 3D keypoint set for one frame."""
    raise NotImplementedError("P1: robust DLT + RANSAC triangulation")
