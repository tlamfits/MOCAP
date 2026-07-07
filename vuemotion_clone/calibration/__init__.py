"""calibration/ — camera intrinsics + extrinsics.

ChArUco/checkerboard intrinsics per camera + extrinsics via a shared calibration
object + bundle adjustment. Re-verify each session; store calibration with capture.
Dep: OpenCV (Apache-2.0).

TODO(P1): implement calibration. See docs 01-FABLE5-EXECUTION-BRIEF P1.
"""
from __future__ import annotations

from vuemotion_clone.types import CameraCalibration


def calibrate_rig(calibration_capture_dir: str) -> list[CameraCalibration]:
    """Estimate intrinsics + extrinsics for every camera in the rig."""
    raise NotImplementedError("P1: rig calibration (OpenCV)")
