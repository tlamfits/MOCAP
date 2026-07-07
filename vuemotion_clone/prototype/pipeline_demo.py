"""End-to-end pipeline prototype (CPU-only, no hardware).

Proves the REAL system path on synthetic multi-camera data:

  synthetic 3D athlete (ground truth)
    -> project into N virtual calibrated cameras  (stands in for RTMPose 2D)
    -> vuemotion_clone.triangulation.triangulate()  (the committed DLT+RANSAC)
    -> 3D joint angles
    -> accuracy vs ground truth  (the validation story)
    -> data bundle for the reconstruction viewer

Only the 2D-pose stage is faked (that needs a GPU + the RTMPose model). Every
other stage is the actual code that will run in production. One camera view is
deliberately corrupted mid-take to show RANSAC rejecting the bad view.

Run:  python3 -m vuemotion_clone.prototype.pipeline_demo
"""
from __future__ import annotations

import json
import math
import pathlib

import numpy as np

from vuemotion_clone.triangulation import triangulate, project_point
from vuemotion_clone.types import CameraCalibration, Keypoints2D

# ---- synthetic 3D athlete (ground truth) ---------------------------------
SEG = dict(trunk=0.52, head=0.22, thigh=0.44, shank=0.42, foot=0.21, uparm=0.30, forearm=0.28)
Z_HIP, Z_SH = 0.10, 0.18
KP = ["head", "neck", "shoulderL", "shoulderR", "elbowL", "elbowR", "wristL", "wristR",
      "hipL", "hipR", "kneeL", "kneeR", "ankleL", "ankleR", "toeL", "toeR", "pelvis"]
EDGES = [("pelvis", "neck"), ("neck", "head"), ("neck", "shoulderL"), ("neck", "shoulderR"),
         ("shoulderL", "elbowL"), ("elbowL", "wristL"), ("shoulderR", "elbowR"), ("elbowR", "wristR"),
         ("pelvis", "hipL"), ("hipL", "kneeL"), ("kneeL", "ankleL"), ("ankleL", "toeL"),
         ("pelvis", "hipR"), ("hipR", "kneeR"), ("kneeR", "ankleR"), ("ankleR", "toeR")]

# broad-jump keyposes: t, px, py, trunk, thigh, shank, foot, uparm, forearm  (deg / m)
KEYS = [
    (0.00, 0.00, 0.95, 6, 3, 3, 90, 8, 12),
    (0.22, 0.00, 0.66, 34, 34, 44, 70, -80, -30),
    (0.40, 0.25, 1.05, 28, -20, 30, 130, 130, 150),
    (0.55, 0.90, 1.20, 20, -30, 50, 120, 150, 150),
    (0.72, 1.60, 1.10, 12, 55, 35, 110, 60, 20),
    (0.90, 2.05, 0.66, 40, 56, 66, 84, -20, -10),
    (1.00, 2.10, 0.85, 20, 20, 20, 90, 5, 10),
]
PHASES = [(0.00, "Stance", "approach"), (0.22, "Countermovement", "loading"),
          (0.40, "Takeoff", "propulsion"), (0.55, "Flight", "flight"),
          (0.72, "Reach", "flight"), (0.90, "Landing", "landing")]


def _smooth(u): return u * u * (3 - 2 * u)


def pose_at(t):
    ks = KEYS
    if t <= ks[0][0]:
        a = ks[0]
        return a[1:]
    if t >= ks[-1][0]:
        return ks[-1][1:]
    for i in range(len(ks) - 1):
        if ks[i][0] <= t <= ks[i + 1][0]:
            a, b = ks[i], ks[i + 1]
            u = _smooth((t - a[0]) / (b[0] - a[0]))
            return tuple(a[1 + j] + (b[1 + j] - a[1 + j]) * u for j in range(8))
    return ks[-1][1:]


def d(a):  # deg->rad
    return math.radians(a)


def fk3d(t):
    px, py, trunk, thigh, shank, foot, uparm, forearm = pose_at(t)
    pelvis = np.array([px, py, 0.0])
    neck = pelvis + SEG["trunk"] * np.array([math.sin(d(trunk)), math.cos(d(trunk)), 0])
    head = neck + SEG["head"] * np.array([math.sin(d(trunk)), math.cos(d(trunk)), 0])
    J = {"pelvis": pelvis, "neck": neck, "head": head,
         "shoulderL": neck + [0, 0, Z_SH], "shoulderR": neck + [0, 0, -Z_SH]}

    def limb(root, a1, a2, l1, l2):
        p1 = root + l1 * np.array([math.sin(d(a1)), -math.cos(d(a1)), 0])
        p2 = p1 + l2 * np.array([math.sin(d(a2)), -math.cos(d(a2)), 0])
        return p1, p2

    for side, z in (("L", Z_HIP), ("R", -Z_HIP)):
        hip = pelvis + [0, 0, z]
        knee, ankle = limb(hip, thigh, shank, SEG["thigh"], SEG["shank"])
        toe = ankle + SEG["foot"] * np.array([math.sin(d(foot)), -math.cos(d(foot)), 0])
        J["hip" + side], J["knee" + side], J["ankle" + side], J["toe" + side] = hip, knee, ankle, toe
        sh = J["shoulder" + side]
        elbow, wrist = limb(sh, uparm, forearm, SEG["uparm"], SEG["forearm"])
        J["elbow" + side], J["wrist" + side] = elbow, wrist
    return np.array([J[k] for k in KP])


# ---- virtual calibrated cameras ------------------------------------------
def look_at(cam_id, center, target, f=1400.0, size=(1920, 1080)):
    center, target = np.array(center, float), np.array(target, float)
    fwd = target - center; fwd /= np.linalg.norm(fwd)
    right = np.cross(fwd, [0, 1, 0]); right /= np.linalg.norm(right)
    down = np.cross(fwd, right)
    R = np.vstack([right, down, fwd])
    t = -R @ center
    K = np.array([[f, 0, size[0] / 2], [0, f, size[1] / 2], [0, 0, 1.0]])
    return CameraCalibration(cam_id, K, np.zeros(5), R, t, size)


def build_rig(n=4, radius=4.0, height=1.3):
    cams, target = [], [1.0, 1.0, 0.0]
    for i in range(n):
        ang = math.radians(40 + i * (280 / max(1, n - 1)) if n > 1 else 90)
        c = [target[0] + radius * math.cos(ang), height, radius * math.sin(ang)]
        cams.append(look_at("cam%d" % i, c, target))
    return cams


def joint_angle(a, b, c):  # interior at b, degrees (3D)
    v1, v2 = a - b, c - b
    cosv = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-9)
    return math.degrees(math.acos(max(-1, min(1, cosv))))


def run(n_frames=120, fps=60, noise_px=2.0, seed=7):
    rng = np.random.default_rng(seed)
    cams = build_rig(4)
    idx = {k: i for i, k in enumerate(KP)}
    kneeR = (idx["hipR"], idx["kneeR"], idx["ankleR"])

    out_frames, errs_mm, knee_gt, knee_re = [], [], [], []
    for f in range(n_frames):
        t = f / (n_frames - 1)
        gt = fk3d(t)  # (17,3) ground truth
        # project into each camera -> 2D (the faked pose stage), with noise
        cam2d, views = [], []
        for ci, cal in enumerate(cams):
            xy = np.array([project_point(cal, gt[k]) for k in range(len(KP))])
            xy = xy + rng.normal(0, noise_px, xy.shape)
            conf = np.ones(len(KP))
            # corrupt camera 1's right knee mid-flight to show RANSAC rejection
            if ci == 1 and 45 <= f <= 60:
                xy[idx["kneeR"]] += np.array([260.0, -180.0])
            cam2d.append(xy.round(1).tolist())
            views.append(Keypoints2D(cal.camera_id, f, xy, conf))
        # REAL triangulation (committed code)
        rec = triangulate(views, cams)
        recon = rec.xyz  # (17,3)
        err = np.linalg.norm(recon - gt, axis=1) * 1000.0  # mm
        errs_mm.append(err)
        knee_gt.append(joint_angle(gt[kneeR[0]], gt[kneeR[1]], gt[kneeR[2]]))
        knee_re.append(joint_angle(recon[kneeR[0]], recon[kneeR[1]], recon[kneeR[2]]))
        airborne = bool(gt[idx["toeR"]][1] > 0.06 and gt[idx["toeL"]][1] > 0.06)
        out_frames.append({
            "f": f, "cams": cam2d,
            "gt": gt.round(4).tolist(), "recon": recon.round(4).tolist(),
            "err_mm": err.round(1).tolist(), "airborne": airborne,
        })

    errs_mm = np.array(errs_mm)
    knee_gt, knee_re = np.array(knee_gt), np.array(knee_re)
    accuracy = {
        "mean_mm": float(np.nanmean(errs_mm)),
        "median_mm": float(np.nanmedian(errs_mm)),
        "p95_mm": float(np.nanpercentile(errs_mm, 95)),
        "knee_rmse_deg": float(np.sqrt(np.nanmean((knee_gt - knee_re) ** 2))),
        "knee_max_deg": float(np.nanmax(np.abs(knee_gt - knee_re))),
    }
    events = [{"frame": round(pt * (n_frames - 1)), "name": nm, "cat": cat} for pt, nm, cat in PHASES]
    bundle = {
        "movement": "broad_jump", "fps": fps, "n_cams": len(cams), "n_frames": n_frames,
        "keypoints": KP, "edges": [[a, b] for a, b in EDGES],
        "phases": events, "accuracy": accuracy, "frames": out_frames,
        "cameras": [{"id": c.camera_id} for c in cams],
    }
    return bundle, accuracy


def main():
    bundle, acc = run()
    here = pathlib.Path(__file__).parent
    (here / "prototype_data.json").write_text(json.dumps(bundle))
    print("Pipeline prototype — broad jump, %d frames, %d virtual cameras" % (bundle["n_frames"], bundle["n_cams"]))
    print("  (2D pose faked; triangulation is the REAL committed code; one camera corrupted f45-60)")
    print("  3D reconstruction error vs ground truth:")
    print("     mean   %5.1f mm" % acc["mean_mm"])
    print("     median %5.1f mm" % acc["median_mm"])
    print("     p95    %5.1f mm" % acc["p95_mm"])
    print("  Knee-angle error (3D):")
    print("     RMSE   %5.2f deg   max %5.2f deg" % (acc["knee_rmse_deg"], acc["knee_max_deg"]))
    print("  wrote prototype_data.json (%d KB)" % ((here / "prototype_data.json").stat().st_size // 1024))
    return acc


if __name__ == "__main__":
    main()
