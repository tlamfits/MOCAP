"""Tests for the kinematic validation harness (metrics + per-plane reporting)."""
from __future__ import annotations

import numpy as np
import pytest

from vuemotion_clone.eval import cmc, compare_to_reference, mae, pearson_r, rmse
from vuemotion_clone.types import JointAngles, KinematicResult


def _trial(series: dict[str, np.ndarray], trial_id="t") -> KinematicResult:
    """Build a KinematicResult from {dof: array-over-time}."""
    T = len(next(iter(series.values())))
    frames = [JointAngles(frame_index=i, angles_deg={d: float(series[d][i]) for d in series})
              for i in range(T)]
    return KinematicResult(trial_id, fps=200.0, joint_angle_series=frames,
                           calibration=[], model_provenance={})


def test_metric_identities():
    a = np.linspace(0, 90, 100)
    assert rmse(a, a) == 0.0
    assert mae(a, a) == 0.0
    assert pearson_r(a, a) == pytest.approx(1.0)
    assert cmc(a, a) == pytest.approx(1.0)


def test_constant_offset():
    a = np.linspace(0, 90, 50)
    b = a + 3.0
    assert rmse(a, b) == pytest.approx(3.0)
    assert mae(a, b) == pytest.approx(3.0)
    assert pearson_r(a, b) == pytest.approx(1.0)          # shape identical
    assert 0.0 < cmc(a, b) < 1.0                           # offset penalised


def test_cmc_floors_at_zero():
    a = np.array([0.0, 1, 0, 1, 0, 1])
    b = -a + 0.5                                            # anti-correlated
    assert cmc(a, b) == 0.0


def test_compare_meets_v1_target():
    """A <=5deg sagittal error should pass the v1 acceptance flag."""
    t = np.linspace(0, 2 * np.pi, 120)
    knee = 60 * (1 - np.cos(t))                             # a CMJ-ish knee waveform
    ref = _trial({"knee_angle_r": knee, "hip_flexion_r": 0.5 * knee})
    pred = _trial({"knee_angle_r": knee + 2.0, "hip_flexion_r": 0.5 * knee - 1.5})

    report = compare_to_reference(pred, ref)
    assert report["summary"]["meets_v1_target"] is True
    assert report["summary"]["sagittal_rmse_deg"] < 5.0
    assert "sagittal" in report["per_plane"]
    assert report["per_dof"]["knee_angle_r"]["rmse_deg"] == pytest.approx(2.0, abs=1e-6)


def test_compare_flags_failure_and_planes():
    t = np.linspace(0, 2 * np.pi, 80)
    knee = 45 * np.sin(t)
    ref = _trial({"knee_angle_r": knee, "hip_rotation_r": knee})
    pred = _trial({"knee_angle_r": knee + 9.0, "hip_rotation_r": knee + 12.0})
    report = compare_to_reference(pred, ref)
    assert report["summary"]["meets_v1_target"] is False   # 9deg sagittal > 5
    # transverse plane bucket exists and is worse — the documented weak spot
    assert report["per_plane"]["transverse"]["rmse_deg_mean"] > report["per_plane"]["sagittal"]["rmse_deg_mean"]


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
