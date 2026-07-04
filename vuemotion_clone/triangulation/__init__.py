"""triangulation/ — multi-view 2D -> 3D fusion.

Robust DLT + RANSAC across calibrated views, per-keypoint confidence weighting,
outlier-view rejection. This is the mathematical core of the multi-camera system:
if triangulation is wrong, every downstream kinematic number is wrong.

Implemented + unit-tested (synthetic round-trip). See vuemotion_clone/tests/.
Temporal smoothing is a later refinement (P1).
"""
from __future__ import annotations

import itertools

import numpy as np

from vuemotion_clone.types import CameraCalibration, Keypoints2D, Keypoints3D


def projection_matrix(cal: CameraCalibration) -> np.ndarray:
    """Full 3x4 projection matrix P = K [R | t] (world -> pixel)."""
    Rt = np.hstack([np.asarray(cal.rotation, float), np.asarray(cal.translation, float).reshape(3, 1)])
    return np.asarray(cal.intrinsics, float) @ Rt


def project_point(cal: CameraCalibration, xyz: np.ndarray) -> np.ndarray:
    """Project a single world point (3,) to pixel coords (2,)."""
    P = projection_matrix(cal)
    h = P @ np.append(np.asarray(xyz, float), 1.0)
    return h[:2] / h[2]


def _dlt_one_point(
    projections: list[np.ndarray],
    uvs: list[np.ndarray],
    weights: list[float] | None = None,
) -> np.ndarray:
    """Linear DLT triangulation of one 3D point from >=2 views.

    Solves the homogeneous system A X = 0 (X in P^3) via SVD. Optional per-view
    weights scale each view's two rows (confidence weighting).
    """
    rows = []
    w = weights if weights is not None else [1.0] * len(uvs)
    for P, (u, v), wi in zip(projections, uvs, w):
        rows.append(wi * (u * P[2] - P[0]))
        rows.append(wi * (v * P[2] - P[1]))
    A = np.asarray(rows, float)
    # smallest singular vector -> homogeneous solution
    _, _, Vt = np.linalg.svd(A)
    X = Vt[-1]
    if abs(X[3]) < 1e-12:
        raise ValueError("degenerate triangulation (point at infinity)")
    return X[:3] / X[3]


def _reproj_error(cals, X, uvs, idx) -> float:
    err = 0.0
    for i in idx:
        pred = project_point(cals[i], X)
        err += float(np.linalg.norm(pred - uvs[i]))
    return err / len(idx)


def triangulate_point(
    calibrations: list[CameraCalibration],
    uvs: list[np.ndarray],
    confidences: list[float] | None = None,
    *,
    conf_threshold: float = 0.3,
    ransac_reproj_px: float = 15.0,
    min_views: int = 2,
) -> tuple[np.ndarray, float, list[int]]:
    """Robustly triangulate one 3D point from N calibrated views.

    Drops views below `conf_threshold`, then RANSAC over view-pairs to find the
    largest inlier set whose reprojection error is under `ransac_reproj_px`, and
    refines with a confidence-weighted DLT over the inliers.

    Returns (xyz, mean_reproj_error_px, inlier_view_indices).
    """
    confs = confidences if confidences is not None else [1.0] * len(uvs)
    usable = [i for i, c in enumerate(confs) if c >= conf_threshold]
    if len(usable) < min_views:
        raise ValueError(f"need >= {min_views} confident views, got {len(usable)}")

    Ps = [projection_matrix(calibrations[i]) for i in range(len(calibrations))]

    best_inliers: list[int] = []
    # RANSAC seeds from minimal (pair) samples; small N -> exhaustive over pairs.
    for i, j in itertools.combinations(usable, 2):
        X = _dlt_one_point([Ps[i], Ps[j]], [uvs[i], uvs[j]])
        inliers = [k for k in usable
                   if float(np.linalg.norm(project_point(calibrations[k], X) - uvs[k])) <= ransac_reproj_px]
        if len(inliers) > len(best_inliers):
            best_inliers = inliers
        if len(best_inliers) == len(usable):
            break

    if len(best_inliers) < min_views:
        best_inliers = usable  # no clean consensus; fall back to all confident views

    X = _dlt_one_point(
        [Ps[i] for i in best_inliers],
        [uvs[i] for i in best_inliers],
        [confs[i] for i in best_inliers],
    )
    return X, _reproj_error(calibrations, X, uvs, best_inliers), best_inliers


def triangulate(
    views: list[Keypoints2D],
    calibration: list[CameraCalibration],
    *,
    conf_threshold: float = 0.3,
    ransac_reproj_px: float = 15.0,
) -> Keypoints3D:
    """Fuse per-view 2D keypoints into a single 3D keypoint set for one frame.

    `views` and `calibration` are aligned by camera_id. Every keypoint index is
    triangulated independently across the views that see it confidently.
    """
    cal_by_id = {c.camera_id: c for c in calibration}
    views = [v for v in views if v.camera_id in cal_by_id]
    if len(views) < 2:
        raise ValueError("need >= 2 calibrated views")

    n_kp = views[0].xy.shape[0]
    frame_index = views[0].frame_index
    cals = [cal_by_id[v.camera_id] for v in views]

    xyz = np.full((n_kp, 3), np.nan)
    conf = np.zeros(n_kp)
    for k in range(n_kp):
        uvs = [v.xy[k] for v in views]
        cfs = [float(v.confidence[k]) for v in views]
        try:
            X, err, inliers = triangulate_point(
                cals, uvs, cfs, conf_threshold=conf_threshold, ransac_reproj_px=ransac_reproj_px
            )
            xyz[k] = X
            # fused confidence: mean inlier confidence attenuated by reprojection error
            conf[k] = float(np.mean([cfs[i] for i in inliers])) / (1.0 + err / ransac_reproj_px)
        except ValueError:
            conf[k] = 0.0  # leave xyz as NaN for unrecoverable keypoints
    return Keypoints3D(frame_index=frame_index, xyz=xyz, confidence=conf, layout=views[0].layout)
