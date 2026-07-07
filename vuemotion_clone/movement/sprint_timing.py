"""Sprint acceleration timing — velocity/acceleration profile + split times from a
tracked COM (pelvis) horizontal position trace.

This is the analysis behind "use the system for timing acceleration": once the
pipeline tracks the athlete's COM each frame, differentiate to velocity/accel and
fit the standard mono-exponential sprint model to get Vmax, the acceleration
constant, split times, and max power — the same outputs a radar gun / 1080 Sprint
produces, plus everything is co-registered with the mechanics from the same capture.

Model (Furusawa/Samozino/Morin): v(t) = Vmax * (1 - exp(-t / tau))
    position   x(t) = Vmax * (t - tau*(1 - exp(-t/tau)))
    accel      a(t) = (Vmax/tau) * exp(-t/tau)   ->  a0 = Vmax/tau (initial accel)
"""
from __future__ import annotations

import numpy as np
from scipy.optimize import curve_fit
from scipy.signal import savgol_filter

DEFAULT_SPLITS = [2.0, 5.0, 10.0, 20.0, 30.0, 40.0]  # metres


def _vmodel(t, vmax, tau):
    return vmax * (1.0 - np.exp(-t / tau))


def _xmodel(t, vmax, tau):
    return vmax * (t - tau * (1.0 - np.exp(-t / tau)))


def smoothed_kinematics(t, x, fps, win=None):
    """Savitzky-Golay smoothed velocity + acceleration from position (noise-robust
    vs raw double-differentiation — the derivative sensitivity the high-fps rig
    exists to manage)."""
    x = np.asarray(x, float)
    n = len(x)
    if win is None:
        win = max(5, int(round(fps * 0.10)) | 1)  # ~100 ms odd window
    win = min(win, n - (1 - n % 2));  win = max(5, win | 1)
    v = savgol_filter(x, win, 2, deriv=1, delta=1.0 / fps)
    a = savgol_filter(x, win, 2, deriv=2, delta=1.0 / fps)
    return v, a


def split_times(t, x, dists=DEFAULT_SPLITS):
    """Interpolated time to reach each split distance (virtual timing gates)."""
    t, x = np.asarray(t, float), np.asarray(x, float)
    out = {}
    for d in dists:
        if x[-1] < d:
            continue
        i = int(np.searchsorted(x, d))
        if i == 0:
            out[d] = float(t[0]); continue
        x0, x1, t0, t1 = x[i - 1], x[i], t[i - 1], t[i]
        out[d] = float(t0 + (t1 - t0) * (d - x0) / (x1 - x0 + 1e-9))
    return out


def fit_model(t, x):
    """Fit the mono-exponential sprint model to position-time. Returns Vmax, tau,
    a0 (initial accel), and derived splits/power."""
    t, x = np.asarray(t, float), np.asarray(x, float)
    p0 = [max(x[-1] / max(t[-1], 1e-3) * 1.2, 5.0), 1.2]
    (vmax, tau), _ = curve_fit(_xmodel, t, x, p0=p0, maxfev=20000,
                               bounds=([3.0, 0.2], [15.0, 4.0]))
    a0 = vmax / tau
    tt = np.linspace(t[0], t[-1], 400)
    v = _vmodel(tt, vmax, tau)
    a = (vmax / tau) * np.exp(-tt / tau)
    p = a * v
    return {
        "vmax": float(vmax), "tau": float(tau), "a0": float(a0),
        "t_to_95pct_vmax": float(-tau * np.log(0.05)),   # time to 95% Vmax
        "max_rel_power": float(np.max(p)),               # W/kg (a*v)
        "model_t": tt.tolist(), "model_v": v.tolist(), "model_a": a.tolist(),
    }


def analyze(t, x, fps, dists=DEFAULT_SPLITS):
    """Full sprint timing analysis from a COM position-time trace."""
    t, x = np.asarray(t, float), np.asarray(x, float)
    v, a = smoothed_kinematics(t, x, fps)
    model = fit_model(t, x)
    imax = int(np.argmax(v))
    return {
        "fps": fps, "distance_m": float(x[-1]), "duration_s": float(t[-1]),
        "vmax_measured": float(np.max(v)),
        "vmax_model": model["vmax"],
        "t_to_vmax_s": float(t[imax]),
        "a0_model": model["a0"],
        "max_rel_power": model["max_rel_power"],
        "splits": split_times(t, x, dists),
        "series": {"t": t.tolist(), "x": x.tolist(), "v": v.tolist(), "a": a.tolist()},
        "model": model,
    }


def synth_sprint(vmax=9.6, tau=1.15, fps=120, dist=40.0, noise_m=0.01, seed=3):
    """Ground-truth synthetic 40 m sprint (position from the model + tracking
    noise), standing in for a COM trace recovered from video."""
    rng = np.random.default_rng(seed)
    # time to cover `dist`
    T = 8.0
    t = np.arange(0, T, 1.0 / fps)
    x = _xmodel(t, vmax, tau)
    keep = x <= dist
    t, x = t[keep], x[keep]
    x = x + rng.normal(0, noise_m, x.shape)  # per-frame tracking noise
    return t, x, {"vmax": vmax, "tau": tau}
