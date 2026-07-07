"""Versioned Take container + keypoint-layout registry — the shared data spine.

One schema flows through the whole system: the pipeline emits a Take, the movement
engine fills in angles/events/metrics, and the studio renders it unchanged. Freeze
this contract early (schema_version + migration shims) so downstream stages never
guess at joint order, units, or world frame.

World frame convention (locked): metres, Y-up, floor at Y=0, X = primary progression.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field, asdict

SCHEMA_VERSION = "1.0"

# Keypoint-layout registry. Every Take names its layout so consumers resolve joint
# order + skeleton edges without hard-coding indices.
LAYOUTS = {
    "mocap17": {
        "names": ["head", "neck", "shoulderL", "shoulderR", "elbowL", "elbowR",
                  "wristL", "wristR", "hipL", "hipR", "kneeL", "kneeR",
                  "ankleL", "ankleR", "toeL", "toeR", "pelvis"],
        "edges": [["pelvis", "neck"], ["neck", "head"], ["neck", "shoulderL"], ["neck", "shoulderR"],
                  ["shoulderL", "elbowL"], ["elbowL", "wristL"], ["shoulderR", "elbowR"], ["elbowR", "wristR"],
                  ["pelvis", "hipL"], ["hipL", "kneeL"], ["kneeL", "ankleL"], ["ankleL", "toeL"],
                  ["pelvis", "hipR"], ["hipR", "kneeR"], ["kneeR", "ankleR"], ["ankleR", "toeR"]],
    },
}
# COCO-17 -> mocap17 name map (for adapting pose-estimator output). COCO lacks toes/neck/pelvis;
# those are derived (neck = shoulder midpoint, pelvis = hip midpoint, toe extrapolated).
COCO17_TO_MOCAP = {
    "left_shoulder": "shoulderL", "right_shoulder": "shoulderR",
    "left_elbow": "elbowL", "right_elbow": "elbowR",
    "left_wrist": "wristL", "right_wrist": "wristR",
    "left_hip": "hipL", "right_hip": "hipR",
    "left_knee": "kneeL", "right_knee": "kneeR",
    "left_ankle": "ankleL", "right_ankle": "ankleR", "nose": "head",
}


def layout(name):
    if name not in LAYOUTS:
        raise ValueError("unknown layout %r (known: %s)" % (name, ", ".join(LAYOUTS)))
    return LAYOUTS[name]


@dataclass
class Frame:
    f: int
    t: float
    joints3d: list           # (K,3) world metres, order per layout
    angles: dict = field(default_factory=dict)
    airborne: bool = False


@dataclass
class Event:
    frame: int
    name: str
    cat: str


@dataclass
class Metric:
    label: str
    value: float
    unit: str = ""
    caveat: bool = False


@dataclass
class Take:
    movement: str
    fps: float
    frames: list                       # list[Frame]
    layout: str = "mocap17"
    source: str = "pipeline"           # pipeline | synthetic
    units: str = "m"
    phases: list = field(default_factory=list)      # list[Event]
    keyframes: list = field(default_factory=list)   # list[Event]
    metrics: list = field(default_factory=list)     # list[Metric]
    schema_version: str = SCHEMA_VERSION

    def to_dict(self):
        d = asdict(self)
        d["keypoints"] = layout(self.layout)["names"]
        d["edges"] = layout(self.layout)["edges"]
        return d

    def save(self, path):
        import pathlib
        pathlib.Path(path).write_text(json.dumps(self.to_dict()))
        return path

    @staticmethod
    def from_dict(d):
        migrate(d)
        return Take(
            movement=d["movement"], fps=d["fps"], layout=d.get("layout", "mocap17"),
            source=d.get("source", "pipeline"), units=d.get("units", "m"),
            frames=[Frame(**{k: fr[k] for k in ("f", "t", "joints3d", "angles", "airborne") if k in fr}) for fr in d["frames"]],
            phases=[Event(**e) for e in d.get("phases", [])],
            keyframes=[Event(**e) for e in d.get("keyframes", [])],
            metrics=[Metric(**m) for m in d.get("metrics", [])],
            schema_version=d.get("schema_version", SCHEMA_VERSION),
        )

    @staticmethod
    def load(path):
        import pathlib
        return Take.from_dict(json.loads(pathlib.Path(path).read_text()))


def migrate(d):
    """Bring an older Take dict up to the current schema in place. Add shims here as
    the schema evolves so old captures keep loading."""
    v = d.get("schema_version", "0")
    if v == SCHEMA_VERSION:
        return d
    # (no breaking versions yet) — future: if v == "0.9": ...
    d["schema_version"] = SCHEMA_VERSION
    return d
