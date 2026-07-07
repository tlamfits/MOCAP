"""Shared data contracts for the kinematics pipeline.

These dataclasses define the interfaces between stages. Stubs elsewhere reference
them so the pipeline's data flow is explicit before any implementation lands.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    # numpy is a P1 runtime dep; kept out of import path so the scaffold loads
    # in a bare environment. Annotations are stringized (PEP 563) and only
    # evaluated by type checkers.
    import numpy as np


@dataclass
class CameraCalibration:
    """Intrinsics + extrinsics for one camera in the rig."""
    camera_id: str
    intrinsics: np.ndarray            # 3x3 K matrix
    distortion: np.ndarray            # lens distortion coeffs
    rotation: np.ndarray              # 3x3 R (world->camera)
    translation: np.ndarray           # 3, t (world->camera)
    image_size: tuple[int, int]       # (width, height)
    reproj_error_px: Optional[float] = None  # calibration quality


@dataclass
class Keypoints2D:
    """2D keypoints for one frame from one camera view."""
    camera_id: str
    frame_index: int
    xy: np.ndarray                    # (K, 2) pixel coords
    confidence: np.ndarray            # (K,) per-keypoint score
    layout: str = "coco17"            # keypoint naming/order


@dataclass
class Keypoints3D:
    """Triangulated 3D keypoints for one frame."""
    frame_index: int
    xyz: np.ndarray                   # (K, 3) world coords (metres)
    confidence: np.ndarray            # (K,) fused confidence
    layout: str = "coco17"


@dataclass
class MarkerSet:
    """Anatomical markers produced by the marker-augmentation network."""
    frame_index: int
    positions: np.ndarray             # (M, 3) e.g. 43 OpenSim markers
    names: list[str] = field(default_factory=list)


@dataclass
class JointAngles:
    """OpenSim inverse-kinematics output for one frame."""
    frame_index: int
    angles_deg: dict[str, float]      # dof name -> angle (degrees)
    # NOTE: kinematics only. No joint moments / GRF / kinetics here — by design.


@dataclass
class KinematicResult:
    """Full-trial kinematic output + provenance."""
    trial_id: str
    fps: float
    joint_angle_series: list[JointAngles]
    calibration: list[CameraCalibration]
    model_provenance: dict = field(default_factory=dict)  # data bill-of-materials
