"""Movement analysis engine (Python port of studio/engine.js, 3D).

Consumes 3D keypoints (Keypoints3D / a Take's joints3d) and produces joint angles,
phase/keyframe events, and take metrics — every value computed FROM the joints, the
same contract the studio uses. This is the real engine the cloud pipeline runs;
studio/engine.js remains the browser twin for the synthetic demo library.
"""
from __future__ import annotations

import math
import numpy as np

from vuemotion_clone.movement.schema import Take, Frame, Event, Metric, layout

GROUND_TOE = 0.06  # toe below this height (m) = ground contact


def _interior(A, B, C):
    v1, v2 = np.asarray(A) - np.asarray(B), np.asarray(C) - np.asarray(B)
    c = float(np.dot(v1, v2)) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-9)
    return math.degrees(math.acos(max(-1.0, min(1.0, c))))


def joint_angles(J):
    """J: dict name -> (3,) world metres."""
    up = np.array([0.0, 1.0, 0.0])
    trunk = np.asarray(J["neck"]) - np.asarray(J["pelvis"])
    lean = math.degrees(math.acos(max(-1, min(1, float(np.dot(trunk, up)) / (np.linalg.norm(trunk) + 1e-9)))))
    lean *= 1.0 if (J["neck"][0] - J["pelvis"][0]) >= 0 else -1.0  # sign by forward (+x)
    horiz = lambda p: np.array([p[0], 0.0, p[2]])
    return {
        "trunkLean": lean,
        "hipFlexR": 180 - _interior(J["neck"], J["hipR"], J["kneeR"]),
        "kneeFlexR": 180 - _interior(J["hipR"], J["kneeR"], J["ankleR"]),
        "ankleR": _interior(J["kneeR"], J["ankleR"], J["toeR"]),
        "hipFlexL": 180 - _interior(J["neck"], J["hipL"], J["kneeL"]),
        "kneeFlexL": 180 - _interior(J["hipL"], J["kneeL"], J["ankleL"]),
        "ankleL": _interior(J["kneeL"], J["ankleL"], J["toeL"]),
        "elbowR": 180 - _interior(J["shoulderR"], J["elbowR"], J["wristR"]),
        "kneeSep": float(np.linalg.norm(horiz(J["kneeR"]) - horiz(J["kneeL"]))),
    }


def _airborne(J):
    return bool(J["toeR"][1] > GROUND_TOE and J["toeL"][1] > GROUND_TOE)


def _as_dicts(joints3d, names):
    return [{n: np.asarray(row[i], float) for i, n in enumerate(names)} for row in [joints3d]][0]


def detect_events(Js, pelvisY):
    """Generic key-event detection from 3D. Js: list of joint-dicts. Returns list[Event]."""
    N = len(Js)
    air = [_airborne(J) for J in Js]
    ev = []
    # takeoff / landing
    to = next((i for i in range(1, N) if air[i] and not air[i - 1]), -1)
    la = next((i for i in range(to + 1, N) if not air[i] and air[i - 1]), -1) if to >= 0 else -1
    # deepest countermovement before takeoff
    if to > 0:
        cm = int(np.argmin(pelvisY[:to]))
        ev.append(Event(0, "Stance", "approach"))
        ev.append(Event(cm, "Countermovement", "loading"))
        ev.append(Event(to, "Takeoff", "propulsion"))
    else:
        ev.append(Event(0, "Start", "approach"))
    # peak COM
    pk = int(np.argmax(pelvisY))
    if to < 0 or pk > to:
        ev.append(Event(pk, "Peak", "flight"))
    if la >= 0:
        ev.append(Event(la, "Landing", "landing"))
    # ground contacts (for hops / cyclic) beyond the first landing
    contacts = [i for i in range(1, N) if not air[i] and air[i - 1]]
    for k, ci in enumerate(contacts[1:], start=2):
        ev.append(Event(ci, "Contact %d" % k, "plant"))
    ev.sort(key=lambda e: e.frame)
    # drop events that collide with an earlier one (within 3 frames) — e.g. a
    # landing transition that also registers as a contact
    dedup, last = [], -99
    for e in ev:
        if e.frame - last > 3:
            dedup.append(e); last = e.frame
    return dedup, air, to, la, pk


def compute_metrics(Js, angles, pelvisY, fps, air, to, la, pk):
    N = len(Js)

    def com_v(i):
        a, b = pelvisY[max(0, i - 1)], pelvisY[min(N - 1, i + 1)]
        ax = Js[max(0, i - 1)]["pelvis"][0]; bx = Js[min(N - 1, i + 1)]["pelvis"][0]
        dt = (min(N - 1, i + 1) - max(0, i - 1)) / fps
        return (bx - ax) / dt, (b - a) / dt

    m = []
    if to >= 0:
        vx, vy = com_v(to)
        m.append(Metric("Takeoff angle", math.degrees(math.atan2(vy, abs(vx) + 1e-3)), "°"))
        base = pelvisY[to]
        m.append(Metric("Jump height", max(0.0, pelvisY[pk] - base) * 100, "cm"))
        if la > to:
            m.append(Metric("Flight time", (la - to) / fps * 1000, "ms"))
            dist = Js[la]["pelvis"][0] - Js[to]["pelvis"][0]
            m.append(Metric("Distance", dist, "m"))
        cm_depth = (pelvisY[0] - float(np.min(pelvisY[:to + 1]))) * 100
        m.append(Metric("Countermovement depth", cm_depth, "cm"))
    ground = [i for i in range(N) if not air[i]]
    if ground:
        m.append(Metric("Peak knee flex", max(angles[i]["kneeFlexR"] for i in ground), "°"))
        m.append(Metric("Knee sep min", min(angles[i]["kneeSep"] for i in ground) * 100, "cm", caveat=True))
    return m


def build_take(joints3d, fps, movement, layout_name="mocap17", source="pipeline"):
    """joints3d: (T,K,3) array (world metres). Returns a fully-analysed Take."""
    names = layout(layout_name)["names"]
    arr = np.asarray(joints3d, float)
    T = arr.shape[0]
    Js = [{n: arr[t, i] for i, n in enumerate(names)} for t in range(T)]
    angles = [joint_angles(J) for J in Js]
    pelvisY = np.array([J["pelvis"][1] for J in Js])
    events, air, to, la, pk = detect_events(Js, pelvisY)
    metrics = compute_metrics(Js, angles, pelvisY, fps, air, to, la, pk)
    frames = [Frame(f=t, t=t / max(1, T - 1), joints3d=arr[t].round(4).tolist(),
                    angles={k: round(v, 2) for k, v in angles[t].items()}, airborne=air[t])
              for t in range(T)]
    return Take(movement=movement, fps=fps, frames=frames, layout=layout_name, source=source,
                phases=events, keyframes=list(events),
                metrics=[Metric(m.label, round(m.value, 2), m.unit, m.caveat) for m in metrics])
