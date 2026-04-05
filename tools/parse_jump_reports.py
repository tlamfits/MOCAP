#!/usr/bin/env python3
"""
Parse Flight School individual Jump Report HTML files and emit athlete records
for the Coach Team Jump Metric Dashboard (JSON to stdout).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


def _strip(html: str) -> str:
    t = re.sub(r"<[^>]+>", "", html)
    return re.sub(r"\s+", " ", t).strip()


def parse_feature_section(html: str) -> dict[str, Any]:
    m = re.search(
        r"Vertical Jump Performance.*?</div>\s*</div>\s*</div>\s*<!--",
        html,
        re.DOTALL,
    )
    if not m:
        return {}
    sec = m.group(0)
    stats = re.findall(
        r'<span class="feature-stat-label">([^<]+)</span><span class="feature-stat-val">(.*?)</span>\s*</div>',
        sec,
        re.DOTALL,
    )
    out: dict[str, Any] = {}
    for label, val_html in stats:
        v = _strip(val_html)
        if "Approach Jump Vert" in label:
            m2 = re.search(r"([\d.]+)\"", v)
            if m2:
                out["aj"] = float(m2.group(1))
        elif "CMJ Jump Height" in label:
            m2 = re.search(r"([\d.]+)\"", v)
            if m2:
                out["cmj"] = float(m2.group(1))
        elif "DJ Jump Height" in label:
            m2 = re.search(r"([\d.]+)\"", v)
            if m2:
                out["dj"] = float(m2.group(1))
        elif "Max Touch Height" in label:
            out["touch"] = v
        elif "Standing Reach" in label:
            out["reach"] = v
        elif "Takeoff Velocity" in label:
            m2 = re.search(r"([\d.]+)", v)
            if m2:
                out["tov"] = float(m2.group(1))
        elif "mRSI (CMJ)" in label:
            m2 = re.search(r"([\d.]+)", v)
            if m2:
                out["mrsi"] = float(m2.group(1))
        elif "RSI (DJ)" in label:
            m2 = re.search(r"([\d.]+)", v)
            if m2:
                out["rsi"] = float(m2.group(1))
    return out


def parse_feature_vertical(html: str) -> tuple[str | None, float | None]:
    """Returns (label, inches) from the hero vertical block."""
    m = re.search(
        r'<div class="feature-vertical-label">([^<]+)</div>\s*'
        r'<div class="feature-vertical-num">([\d.]+)<span class="feature-vertical-unit">"',
        html,
    )
    if not m:
        return None, None
    return m.group(1).strip(), float(m.group(2))


def parse_engines(html: str) -> dict[str, int | None]:
    cards = re.findall(
        r'<span class="engine-score-num">(\d+)</span>.*?<div class="engine-quality-name">([^<]+)</div>',
        html,
        re.DOTALL,
    )
    d: dict[str, int | None] = {
        "maxStr": None,
        "react": None,
        "ecc": None,
        "prop": None,
    }
    for score, name in cards:
        name = name.strip()
        s = int(score)
        if "MAX STRENGTH" in name:
            d["maxStr"] = s
        elif "REACTIVITY" in name:
            d["react"] = s
        elif "ECCENTRIC" in name:
            d["ecc"] = s
        elif "PROPULSION" in name:
            d["prop"] = s
    return d


def parse_symmetry(html: str) -> list[int]:
    return [int(x) for x in re.findall(r'<div class="sym-score"[^>]*>(\d+)</div>', html)]


def parse_timing_composite(html: str) -> int | None:
    m = re.search(r'<div class="timing-composite-score">(\d+)</div>', html)
    return int(m.group(1)) if m else None


def parse_banner(html: str) -> dict[str, str]:
    name = re.search(r'<div class="athlete-name">([^<]+)</div>', html)
    date_m = re.search(r"<span>Date:\s*([^<]+)</span>", html)
    tests_m = re.search(r"<span>Tests:\s*([^<]+)</span>", html)
    team_m = re.search(r"<span>Team:\s*([^<]+)</span>", html)
    return {
        "name": name.group(1).strip() if name else "",
        "testDate": date_m.group(1).strip() if date_m else "",
        "tests": tests_m.group(1).strip() if tests_m else "",
        "team": team_m.group(1).strip() if team_m else "—",
    }


def parse_file(path: Path) -> dict[str, Any]:
    html = path.read_text(encoding="utf-8", errors="replace")
    banner = parse_banner(html)
    feat = parse_feature_section(html)
    vlabel, vnum = parse_feature_vertical(html)
    eng = parse_engines(html)
    sym = parse_symmetry(html)
    tc = parse_timing_composite(html)

    # AJ: explicit stat > hero only when label says Approach
    aj = feat.get("aj")
    if aj is None and vlabel and "approach" in vlabel.lower():
        aj = vnum

    # Pad symmetry to 4 slots (eccentric, reactive, propulsion, landing) for UI
    sym4: list[int | None] = [None, None, None, None]
    for i, v in enumerate(sym[:4]):
        sym4[i] = v

    rec: dict[str, Any] = {
        "name": banner["name"],
        "team": banner["team"],
        "testDate": banner["testDate"],
        "tests": banner["tests"],
        "sourceFile": path.name,
        "aj": aj,
        "touch": feat.get("touch"),
        "reach": feat.get("reach"),
        "cmj": feat.get("cmj"),
        "dj": feat.get("dj"),
        "tov": feat.get("tov"),
        "mrsi": feat.get("mrsi"),
        "rsi": feat.get("rsi"),
        "maxStr": eng["maxStr"],
        "react": eng["react"],
        "ecc": eng["ecc"],
        "prop": eng["prop"],
        "sym": sym4,
        "timingComp": tc,
        "featureVerticalLabel": vlabel,
        "featureVerticalIn": vnum,
    }
    return rec


def _parse_us_date(s: str) -> datetime | None:
    try:
        return datetime.strptime(s.strip(), "%m/%d/%Y")
    except Exception:
        return None


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "reports_dir",
        type=Path,
        help="Folder containing *_Jump_Report_*.html files",
    )
    ap.add_argument(
        "--exclude-sample",
        action="store_true",
        help="Skip Sample_Athlete_* files",
    )
    args = ap.parse_args()
    paths = sorted(args.reports_dir.glob("*_Jump_Report_*.html"))
    if args.exclude_sample:
        paths = [p for p in paths if not p.name.startswith("Sample_")]
    if not paths:
        print("No jump reports found.", file=sys.stderr)
        sys.exit(1)

    athletes = [parse_file(p) for p in paths]
    athletes.sort(key=lambda a: (a["name"].lower()))

    parsed_dates = [_parse_us_date(a["testDate"]) for a in athletes if a.get("testDate")]
    parsed_dates = [d for d in parsed_dates if d]

    def fmt_day(d: datetime) -> str:
        return f"{d.strftime('%b')} {d.day}, {d.year}"

    if parsed_dates:
        lo = min(parsed_dates)
        hi = max(parsed_dates)
        if lo.date() == hi.date():
            dr = fmt_day(lo)
        elif lo.year == hi.year and lo.month == hi.month:
            dr = f"{lo.strftime('%b')} {lo.day}–{hi.day}, {lo.year}"
        else:
            dr = f"{fmt_day(lo)} – {fmt_day(hi)}"
    else:
        dr = ""
    meta = {
        "generated": datetime.now().strftime("%Y-%m-%d"),
        "reportCount": len(athletes),
        "dateRange": dr,
    }
    out = {"meta": meta, "athletes": athletes}
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
