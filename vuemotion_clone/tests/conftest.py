"""Shared synthetic-rig fixtures for pipeline tests.

Builds a virtual multi-camera rig with known ground-truth geometry so the
triangulation math can be validated without any real hardware.
"""
from __future__ import annotations

import numpy as np

from vuemotion_clone.types import CameraCalibration, Keypoints2D


def look_at_camera(camera_id: str, center, target=(0, 0, 0), up=(0, 0, 1),
                   focal=1200.0, image_size=(1920, 1080)) -> CameraCalibration:
    """Construct a pinhole camera at `center` looking at `target` (OpenCV convention)."""
    C = np.asarray(center, float)
    f = np.asarray(target, float) - C
    f = f / np.linalg.norm(f)                 # forward (camera +z)
    r = np.cross(f, np.asarray(up, float))
    r = r / np.linalg.norm(r)                  # right (camera +x)
    d = np.cross(f, r)                          # down  (camera +y)
    R = np.vstack([r, d, f])                    # world -> camera rotation
    t = -R @ C                                  # world -> camera translation
    w, h = image_size
    K = np.array([[focal, 0, w / 2.0],
                  [0, focal, h / 2.0],
                  [0, 0, 1.0]])
    return CameraCalibration(camera_id, K, np.zeros(5), R, t, image_size)


def default_rig(n_cameras=4, radius=3.0, height=1.2) -> list[CameraCalibration]:
    """A ring of cameras around a capture volume centred near the origin."""
    cams = []
    for i in range(n_cameras):
        ang = 2 * np.pi * i / n_cameras
        center = (radius * np.cos(ang), radius * np.sin(ang), height)
        cams.append(look_at_camera(f"cam{i}", center, target=(0, 0, height)))
    return cams


def synthetic_skeleton(n_kp=17, seed=0, spread=0.5, height=1.2) -> np.ndarray:
    """A plausible cluster of 3D keypoints (metres) inside the capture volume."""
    rng = np.random.default_rng(seed)
    pts = rng.normal(0, spread, size=(n_kp, 3))
    pts[:, 2] = np.abs(pts[:, 2]) + height  # keep points above the ground plane
    return pts


def project_skeleton(cam: CameraCalibration, pts3d: np.ndarray,
                     noise_px=0.0, seed=0) -> Keypoints2D:
    """Project a 3D skeleton into one camera, optionally adding pixel noise."""
    from vuemotion_clone.triangulation import project_point
    rng = np.random.default_rng(seed)
    xy = np.array([project_point(cam, p) for p in pts3d])
    if noise_px:
        xy = xy + rng.normal(0, noise_px, size=xy.shape)
    conf = np.ones(len(pts3d))
    return Keypoints2D(cam.camera_id, frame_index=0, xy=xy, confidence=conf)
