"""Real single-camera video -> 2D pose -> Take, using a CPU pose backend (MediaPipe
BlazePose, Apache-2.0). This is the auto path behind "upload a video": run it on a
clip and it produces a pose track + a Take the studio overlays on the video.

  python3 -m vuemotion_clone.prototype.analyze_video <video> [--out DIR] [--stride N]

Notes
- Single camera = 2D (monocular). Multi-cam 3D is the lab-grade path; this is the
  accessible tier, and 2D horizontal tracking is exactly what sprint-timing needs.
- MediaPipe/BlazePose is Apache-2.0 and CPU-capable — fine for a prototype. The
  shippable model is RTMPose (also Apache-2.0); this backend is a drop-in stand-in.
"""
from __future__ import annotations

import argparse
import json
import pathlib

import numpy as np

# BlazePose 33-landmark -> our mocap17 (neck/pelvis/toes derived).
BP = {  # names we use from MediaPipe PoseLandmark
    "nose": 0, "left_shoulder": 11, "right_shoulder": 12, "left_elbow": 13, "right_elbow": 14,
    "left_wrist": 15, "right_wrist": 16, "left_hip": 23, "right_hip": 24,
    "left_knee": 25, "right_knee": 26, "left_ankle": 27, "right_ankle": 28,
    "left_foot_index": 31, "right_foot_index": 32,
}
MOCAP = ["head", "neck", "shoulderL", "shoulderR", "elbowL", "elbowR", "wristL", "wristR",
         "hipL", "hipR", "kneeL", "kneeR", "ankleL", "ankleR", "toeL", "toeR", "pelvis"]


def _mid(a, b):
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]


def landmarks_to_mocap(lm):
    """lm: (33,3) normalized [x,y,visibility]. -> {name:[x,y], ...} normalized + mean vis."""
    def g(n):
        i = BP[n]; return [float(lm[i][0]), float(lm[i][1])]
    neck = _mid(g("left_shoulder"), g("right_shoulder"))
    pelvis = _mid(g("left_hip"), g("right_hip"))
    j = {
        "head": g("nose"), "neck": neck, "pelvis": pelvis,
        "shoulderL": g("left_shoulder"), "shoulderR": g("right_shoulder"),
        "elbowL": g("left_elbow"), "elbowR": g("right_elbow"),
        "wristL": g("left_wrist"), "wristR": g("right_wrist"),
        "hipL": g("left_hip"), "hipR": g("right_hip"),
        "kneeL": g("left_knee"), "kneeR": g("right_knee"),
        "ankleL": g("left_ankle"), "ankleR": g("right_ankle"),
        "toeL": g("left_foot_index"), "toeR": g("right_foot_index"),
    }
    vis = float(np.mean([lm[i][2] for i in BP.values()]))
    return j, vis


def run(video_path, out_dir=None, stride=1, save_overlay=True):
    import cv2  # opencv-python(-headless)
    import mediapipe as mp
    from mediapipe.tasks.python import vision, BaseOptions

    # MediaPipe Tasks API needs the pose model file. Download once (Apache-2.0):
    #   pose_landmarker_lite.task  from
    #   https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task
    # Set MP_POSE_MODEL to its path (or place it beside this file).
    import os
    model = os.environ.get("MP_POSE_MODEL") or str(pathlib.Path(__file__).parent / "pose_landmarker_lite.task")
    if not pathlib.Path(model).exists():
        raise FileNotFoundError(
            "MediaPipe pose model not found at %r. Download pose_landmarker_lite.task (see the "
            "URL in this file) and set MP_POSE_MODEL, then re-run. The shippable backend is "
            "RTMPose; this is the accessible CPU stand-in." % model)

    video_path = pathlib.Path(video_path)
    out_dir = pathlib.Path(out_dir) if out_dir else video_path.parent
    out_dir.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(str(video_path))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)); H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    opts = vision.PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=model),
        running_mode=vision.RunningMode.VIDEO)
    landmarker = vision.PoseLandmarker.create_from_options(opts)

    frames, overlays, fi, kept = [], [], 0, 0
    while True:
        ok, img = cap.read()
        if not ok:
            break
        if fi % stride == 0:
            mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
            res = landmarker.detect_for_video(mp_img, int(fi / fps * 1000))
            if res.pose_landmarks:
                lm = np.array([[p.x, p.y, p.visibility] for p in res.pose_landmarks[0]])
                j, vis = landmarks_to_mocap(lm)
                frames.append({"f": kept, "joints": [j[n] for n in MOCAP], "vis": round(vis, 3)})
                if save_overlay and kept in (0, 1):
                    overlays.append(_overlay(img, j, W, H))
                kept += 1
        fi += 1
    cap.release(); landmarker.close()

    track = {"source": video_path.name, "fps": fps / max(1, stride), "videoW": W, "videoH": H,
             "layout": "video2d_norm", "keypoints": MOCAP, "frames": frames}
    (out_dir / "pose_track.json").write_text(json.dumps(track))
    return track, overlays, out_dir


def _overlay(img, j, W, H):
    """Return a base64 PNG data URI of the frame with the detected skeleton drawn."""
    import cv2
    import base64
    EDGES = [("pelvis", "neck"), ("neck", "head"), ("neck", "shoulderL"), ("neck", "shoulderR"),
             ("shoulderL", "elbowL"), ("elbowL", "wristL"), ("shoulderR", "elbowR"), ("elbowR", "wristR"),
             ("pelvis", "hipL"), ("hipL", "kneeL"), ("kneeL", "ankleL"), ("ankleL", "toeL"),
             ("pelvis", "hipR"), ("hipR", "kneeR"), ("kneeR", "ankleR"), ("ankleR", "toeR")]
    im = img.copy()
    def P(n): return (int(j[n][0] * W), int(j[n][1] * H))
    for a, b in EDGES:
        cv2.line(im, P(a), P(b), (60, 120, 255), 3)
    for n in j:
        cv2.circle(im, P(n), 4, (255, 255, 255), -1)
    scale = 640.0 / max(1, W)
    im = cv2.resize(im, (int(W * scale), int(H * scale)))
    ok, buf = cv2.imencode(".jpg", im, [cv2.IMWRITE_JPEG_QUALITY, 80])
    return "data:image/jpeg;base64," + base64.b64encode(buf).decode()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--out", default=None)
    ap.add_argument("--stride", type=int, default=1)
    a = ap.parse_args()
    track, _, out = run(a.video, a.out, a.stride)
    vis = np.mean([f["vis"] for f in track["frames"]]) if track["frames"] else 0
    print("Analyzed %s: %d frames pose-detected @ %.1f fps (%dx%d), mean visibility %.2f"
          % (track["source"], len(track["frames"]), track["fps"], track["videoW"], track["videoH"], vis))
    print("wrote", out / "pose_track.json")


if __name__ == "__main__":
    main()
