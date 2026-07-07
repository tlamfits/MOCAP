"""eval/ — accuracy harness vs gold standard (VICON).

Report MAE/RMSE + waveform agreement (CMC / Pearson r) PER JOINT, PER PLANE, PER
MOVEMENT — never a single headline number. Sagittal plane is strong (2-5 deg);
transverse-plane rotation is the industry-wide weak spot — report it honestly.

Acceptance (v1): <= 5 deg sagittal lower-limb RMSE vs VICON on CMJ + hop.
No force/kinetic metrics — out of scope.

Implemented + unit-tested. See vuemotion_clone/tests/.
"""
from __future__ import annotations

import numpy as np

from vuemotion_clone.types import KinematicResult

# Which OpenSim DOFs live in which anatomical plane (extend as the model grows).
PLANE_OF_DOF = {
    "hip_flexion": "sagittal", "knee_angle": "sagittal", "ankle_angle": "sagittal",
    "hip_adduction": "frontal", "subtalar_angle": "frontal",
    "hip_rotation": "transverse", "knee_rotation": "transverse",
}


def rmse(a: np.ndarray, b: np.ndarray) -> float:
    a, b = np.asarray(a, float), np.asarray(b, float)
    return float(np.sqrt(np.nanmean((a - b) ** 2)))


def mae(a: np.ndarray, b: np.ndarray) -> float:
    a, b = np.asarray(a, float), np.asarray(b, float)
    return float(np.nanmean(np.abs(a - b)))


def pearson_r(a: np.ndarray, b: np.ndarray) -> float:
    a, b = np.asarray(a, float), np.asarray(b, float)
    m = np.isfinite(a) & np.isfinite(b)
    if m.sum() < 2:
        return float("nan")
    a, b = a[m], b[m]
    if np.std(a) == 0 or np.std(b) == 0:
        return float("nan")
    return float(np.corrcoef(a, b)[0, 1])


def cmc(a: np.ndarray, b: np.ndarray) -> float:
    """Coefficient of Multiple Correlation (waveform similarity), 0..1.

    Kadaba/Ferrari form: CMC = sqrt(1 - SS_error / SS_total), where SS_total is
    the total deviation of both curves about their common GRAND mean. Identical
    curves -> 1; a small offset on a high-variance waveform stays near 1; an
    anti-correlated curve floors at 0.
    """
    a, b = np.asarray(a, float), np.asarray(b, float)
    m = np.isfinite(a) & np.isfinite(b)
    if m.sum() < 2:
        return float("nan")
    a, b = a[m], b[m]
    grand_mean = float(np.mean(np.concatenate([a, b])))
    ss_err = np.sum((a - b) ** 2)
    ss_tot = np.sum((a - grand_mean) ** 2) + np.sum((b - grand_mean) ** 2)
    if ss_tot == 0:
        return 1.0
    val = 1.0 - ss_err / ss_tot
    return float(np.sqrt(val)) if val > 0 else 0.0


def _series_matrix(res: KinematicResult) -> tuple[list[str], np.ndarray]:
    """Stack a KinematicResult's joint-angle series into (dof_names, T x D array)."""
    dofs = sorted({d for f in res.joint_angle_series for d in f.angles_deg})
    mat = np.array([[f.angles_deg.get(d, np.nan) for d in dofs] for f in res.joint_angle_series], float)
    return dofs, mat


def compare_to_reference(predicted: KinematicResult, reference: KinematicResult) -> dict:
    """Per-DOF and per-plane MAE / RMSE / CMC / Pearson r vs a reference trial.

    Returns {"per_dof": {...}, "per_plane": {...}, "summary": {...}} with an
    explicit sagittal-plane RMSE against the <=5 deg v1 acceptance target.
    """
    dofs_p, P = _series_matrix(predicted)
    dofs_r, R = _series_matrix(reference)
    common = [d for d in dofs_p if d in dofs_r]
    if not common:
        raise ValueError("no shared DOFs between predicted and reference")
    T = min(P.shape[0], R.shape[0])

    per_dof, plane_bucket = {}, {}
    for d in common:
        pa = P[:T, dofs_p.index(d)]
        ra = R[:T, dofs_r.index(d)]
        stats = {"rmse_deg": rmse(pa, ra), "mae_deg": mae(pa, ra),
                 "cmc": cmc(pa, ra), "pearson_r": pearson_r(pa, ra)}
        per_dof[d] = stats
        plane = PLANE_OF_DOF.get(_base_dof(d), "unknown")
        plane_bucket.setdefault(plane, []).append(stats["rmse_deg"])

    per_plane = {pl: {"rmse_deg_mean": float(np.nanmean(v)), "n_dof": len(v)}
                 for pl, v in plane_bucket.items()}
    sag = per_plane.get("sagittal", {}).get("rmse_deg_mean", float("nan"))
    return {
        "per_dof": per_dof,
        "per_plane": per_plane,
        "summary": {
            "sagittal_rmse_deg": sag,
            "meets_v1_target": bool(np.isfinite(sag) and sag <= 5.0),
            "n_frames": T,
            "n_dof": len(common),
        },
    }


def _base_dof(dof: str) -> str:
    """Strip a side suffix (_r/_l) so 'knee_angle_r' maps to 'knee_angle'."""
    for suf in ("_r", "_l"):
        if dof.endswith(suf):
            return dof[: -len(suf)]
    return dof
