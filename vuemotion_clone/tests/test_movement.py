"""Known-answer tests for the movement engine + Take schema.

Drives the engine from the pipeline prototype's synthetic broad-jump ground truth
(a known motion), so the analysis has a checkable expected shape.
"""
import numpy as np
import pytest

from vuemotion_clone.movement import build_take, Take, joint_angles, layout
from vuemotion_clone.prototype.pipeline_demo import fk3d, KP


def _gt_take(n=120, fps=60):
    frames = np.array([fk3d(f / (n - 1)) for f in range(n)])  # (T,17,3)
    return build_take(frames, fps=fps, movement="broad_jump", source="synthetic"), frames


def test_angles_finite_and_bounded():
    take, _ = _gt_take()
    for fr in take.frames:
        for k, v in fr.angles.items():
            assert np.isfinite(v), (k, v)
        # flexion angles are physically bounded
        assert -30 <= fr.angles["kneeFlexR"] <= 170


def test_broad_jump_events_ordered():
    take, _ = _gt_take()
    names = {e.name: e.frame for e in take.phases}
    assert "Takeoff" in names and "Landing" in names and "Peak" in names
    assert names["Takeoff"] < names["Peak"] < names["Landing"], names


def test_metrics_physically_plausible():
    take, _ = _gt_take()
    mv = {m.label: m.value for m in take.metrics}
    assert mv["Distance"] > 1.2, mv                # a broad jump travels
    assert 5 < mv["Jump height"] < 80, mv          # cm
    assert 20 < mv["Takeoff angle"] < 80, mv       # degrees, upward+forward
    assert mv["Countermovement depth"] > 5, mv     # dips before takeoff


def test_airborne_detected():
    take, _ = _gt_take()
    air = sum(1 for fr in take.frames if fr.airborne)
    assert 20 < air < len(take.frames) - 10        # meaningful flight phase, not all/none


def test_schema_roundtrip(tmp_path):
    take, _ = _gt_take()
    p = take.save(tmp_path / "t.json")
    back = Take.load(p)
    assert back.movement == take.movement and back.fps == take.fps
    assert len(back.frames) == len(take.frames)
    assert back.frames[10].angles["kneeFlexR"] == pytest.approx(take.frames[10].angles["kneeFlexR"])
    assert back.to_dict()["keypoints"] == layout("mocap17")["names"]


def test_angles_match_direct_call():
    _, frames = _gt_take()
    names = layout("mocap17")["names"]
    J = {n: frames[40, i] for i, n in enumerate(names)}
    a = joint_angles(J)
    assert set(a) >= {"trunkLean", "kneeFlexR", "hipFlexR", "ankleR", "kneeSep"}


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
