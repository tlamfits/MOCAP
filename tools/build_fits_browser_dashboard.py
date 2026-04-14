#!/usr/bin/env python3
"""Build X7 - Brand Materia/FITS-Website/fits-athlete-dashboard.jsx for static HTML + Babel."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(__file__).with_name("fits_dashboard_source.jsx")
OUT = ROOT / "X7 - Brand Materia" / "FITS-Website" / "fits-athlete-dashboard.jsx"


def main() -> None:
    text = SRC.read_text(encoding="utf-8")
    text = text.replace(
        'import { useState, useEffect } from "react";\n\n',
        "const { useState, useEffect } = React;\n\n",
    )
    text = text.replace(
        "export default function FITSDashboard",
        "function FITSDashboard",
    )
    text += """

const mountNode = document.getElementById('fitsDashboardMount');
if (mountNode && window.ReactDOM && window.ReactDOM.createRoot) {
  const root = ReactDOM.createRoot(mountNode);
  root.render(<FITSDashboard />);
}
"""
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text, encoding="utf-8")
    print("Wrote", OUT, OUT.stat().st_size, "bytes")


if __name__ == "__main__":
    main()
