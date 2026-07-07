"""Movement analysis: shared Take schema + 3D analysis engine (cloud-side twin of
the browser studio engine). Consumes 3D keypoints, emits angles/events/metrics."""
from vuemotion_clone.movement.schema import Take, Frame, Event, Metric, LAYOUTS, layout, SCHEMA_VERSION
from vuemotion_clone.movement.analysis import build_take, joint_angles, detect_events, compute_metrics

__all__ = ["Take", "Frame", "Event", "Metric", "LAYOUTS", "layout", "SCHEMA_VERSION",
           "build_take", "joint_angles", "detect_events", "compute_metrics"]
