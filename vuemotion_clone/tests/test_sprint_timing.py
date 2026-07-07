"""Sprint timing: recover known model params from a synthetic COM trace."""
import numpy as np
import pytest

from vuemotion_clone.movement import sprint_timing as S


def test_model_recovery():
    t, x, gt = S.synth_sprint(vmax=9.6, tau=1.15, fps=120, dist=40)
    r = S.analyze(t, x, fps=120)
    assert abs(r["vmax_model"] - 9.6) < 0.2, r["vmax_model"]
    assert abs(r["model"]["tau"] - 1.15) < 0.15, r["model"]["tau"]
    assert 6 < r["a0_model"] < 12                      # initial accel m/s^2
    assert r["max_rel_power"] > 10                     # W/kg


def test_splits_monotonic_and_reasonable():
    t, x, gt = S.synth_sprint(vmax=9.0, tau=1.3, fps=120, dist=40)
    r = S.analyze(t, x, fps=120)
    sp = [r["splits"][d] for d in sorted(r["splits"])]
    assert all(sp[i] < sp[i + 1] for i in range(len(sp) - 1)), sp
    assert r["splits"].get(10.0, 0) < 2.5              # 10 m in well under 2.5 s


def test_faster_athlete_faster_splits():
    fast = S.analyze(*S.synth_sprint(vmax=10.5, tau=1.0, fps=120, dist=30)[:2], fps=120)
    slow = S.analyze(*S.synth_sprint(vmax=8.0, tau=1.6, fps=120, dist=30)[:2], fps=120)
    assert fast["splits"][20.0] < slow["splits"][20.0]


def test_low_fps_still_recovers_via_model():
    # even at 60 fps the model fit (not raw diff) recovers Vmax within tolerance
    t, x, gt = S.synth_sprint(vmax=9.6, tau=1.15, fps=60, dist=40, noise_m=0.02)
    r = S.analyze(t, x, fps=60)
    assert abs(r["vmax_model"] - 9.6) < 0.4, r["vmax_model"]


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
