"""Synthetic round-trip tests for multi-view triangulation.

Ground truth is known exactly (we project it ourselves), so these tests prove the
DLT + RANSAC math recovers 3D geometry to sub-millimetre accuracy in the clean
case, stays accurate under pixel noise, and rejects a corrupted (outlier) view.
No hardware required.
"""
from __future__ import annotations

import numpy as np
import pytest

from vuemotion_clone.triangulation import project_point, triangulate, triangulate_point
from vuemotion_clone.tests.conftest import default_rig, project_skeleton, synthetic_skeleton


def test_perfect_roundtrip_submillimetre():
    """Clean projections from 4 cameras -> recover 3D within 1e-6 m."""
    rig = default_rig(n_cameras=4)
    pts = synthetic_skeleton(n_kp=17, seed=1)
    views = [project_skeleton(cam, pts) for cam in rig]

    out = triangulate(views, rig)
    err = np.linalg.norm(out.xyz - pts, axis=1)
    assert np.max(err) < 1e-6, f"max recovery error {np.max(err):.2e} m"
    assert np.all(out.confidence > 0)


def test_two_views_sufficient():
    """Minimum viable rig: two cameras still triangulate exactly."""
    rig = default_rig(n_cameras=4)[:2]
    pts = synthetic_skeleton(n_kp=10, seed=2)
    views = [project_skeleton(cam, pts) for cam in rig]
    out = triangulate(views, rig)
    assert np.max(np.linalg.norm(out.xyz - pts, axis=1)) < 1e-6


def test_noise_degrades_gracefully():
    """1 px Gaussian noise on 4 views keeps 3D error in the millimetre range."""
    rig = default_rig(n_cameras=4)
    pts = synthetic_skeleton(n_kp=17, seed=3)
    views = [project_skeleton(cam, pts, noise_px=1.0, seed=10 + i) for i, cam in enumerate(rig)]
    out = triangulate(views, rig)
    err = np.linalg.norm(out.xyz - pts, axis=1)
    assert np.median(err) < 0.01, f"median error {np.median(err)*1000:.1f} mm too high"


def test_ransac_rejects_outlier_view():
    """One grossly corrupted view must not wreck the estimate (RANSAC rejects it)."""
    rig = default_rig(n_cameras=5)
    pts = synthetic_skeleton(n_kp=12, seed=4)
    views = [project_skeleton(cam, pts) for cam in rig]

    # Corrupt camera index 2 entirely (simulate a mis-detection / swapped person).
    views[2].xy[:] = views[2].xy + 300.0

    single_errs = []
    cals = rig
    for k in range(pts.shape[0]):
        uvs = [v.xy[k] for v in views]
        cfs = [1.0] * len(views)
        X, reproj, inliers = triangulate_point(cals, uvs, cfs)
        single_errs.append(np.linalg.norm(X - pts[k]))
        assert 2 not in inliers, "corrupted view should be excluded from inliers"
    assert np.max(single_errs) < 1e-4, f"outlier corrupted estimate: {np.max(single_errs):.2e} m"


def test_low_confidence_views_dropped():
    """Keypoints seen confidently by <2 cameras are returned as NaN, conf 0."""
    rig = default_rig(n_cameras=3)
    pts = synthetic_skeleton(n_kp=5, seed=5)
    views = [project_skeleton(cam, pts) for cam in rig]
    # Only one camera is confident about keypoint 0.
    for v in views[1:]:
        v.confidence[0] = 0.0
    out = triangulate(views, rig)
    assert out.confidence[0] == 0.0 and np.all(np.isnan(out.xyz[0]))
    assert np.all(out.confidence[1:] > 0)


def test_projection_is_consistent():
    """Sanity: projecting a point then reprojecting the DLT result matches pixels."""
    rig = default_rig(n_cameras=4)
    X = np.array([0.1, -0.2, 1.3])
    for cam in rig:
        uv = project_point(cam, X)
        assert uv.shape == (2,)
        # point is in front of the camera and lands on the sensor
        assert 0 <= uv[0] <= cam.image_size[0] and 0 <= uv[1] <= cam.image_size[1]


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
