"""data/ — dataset adapters + license/provenance tracking.

Every model artifact must carry a "data bill of materials": which datasets touched
its training lineage, and each dataset's commercial-use status. This is how we keep
non-commercial research data (AthletePose3D, AMASS, BEDLAM, SMPL, Human3.6M) OUT of
any shipped model. See docs/vuemotion-clone/LICENSE-CLEARANCE.md.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class DatasetLicense:
    name: str
    license: str
    commercial_ok: bool          # may a SHIPPED model be trained on this?
    notes: str = ""


# Registry seeded from LICENSE-CLEARANCE.md (verify at build; licenses drift).
REGISTRY: dict[str, DatasetLicense] = {
    "COCO":          DatasetLicense("COCO Keypoints", "CC-BY-4.0", True,  "Attribution required; base pretraining OK."),
    "AthletePose3D": DatasetLicense("AthletePose3D", "Non-commercial", False, "R&D/benchmark only."),
    "AMASS":         DatasetLicense("AMASS", "MPI non-commercial", False, "Explicitly bans commercial NN training."),
    "BEDLAM":        DatasetLicense("BEDLAM", "PS-License 1.0", False, "Commercial by request (MPI)."),
    "SMPL":          DatasetLicense("SMPL/SMPL-X", "MPI research", False, "Commercial via Meshcapade."),
    "Human3.6M":     DatasetLicense("Human3.6M", "Academic", False, "Restrictive."),
    "FITS_OWNED":    DatasetLicense("FITS athletic video", "Owned + consent", True, "Requires athlete consent clause."),
}


def assert_shippable(dataset_keys: list[str]) -> None:
    """Raise if any dataset in a SHIPPED model's lineage isn't commercial-cleared."""
    bad = [k for k in dataset_keys if not REGISTRY.get(k, DatasetLicense(k, "?", False)).commercial_ok]
    if bad:
        raise ValueError(f"Non-commercial data in shipping lineage: {bad} (see LICENSE-CLEARANCE.md)")
