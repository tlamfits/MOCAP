"""pose2d/ — 2D keypoint estimation per camera view.

Ship: RTMPose / MMPose (Apache-2.0). Cloud accuracy alt: ViTPose (Apache-2.0).
Do NOT ship OpenPose (non-commercial), Ultralytics YOLO (AGPL), or Sapiens weights
(CC-BY-NC). COCO-pretrained base weights are commercially OK (attribution required).
See docs/vuemotion-clone/LICENSE-CLEARANCE.md.

TODO(P1): wrap RTMPose inference. TODO(P2): athletic fine-tune (license-gated).
"""
from __future__ import annotations

from vuemotion_clone.types import Keypoints2D


class Pose2DEstimator:
    """Interface for a per-view 2D keypoint estimator (RTMPose backend)."""

    def __init__(self, model: str = "rtmpose-m", layout: str = "coco17") -> None:
        self.model = model
        self.layout = layout

    def infer(self, frame, camera_id: str, frame_index: int) -> Keypoints2D:
        raise NotImplementedError("P1: RTMPose 2D inference")
