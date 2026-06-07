#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
  .venv/bin/pip install -q -r requirements.txt
fi

HOST="${BASEMENT_HOST:-0.0.0.0}"
PORT="${BASEMENT_PORT:-8787}"

echo ""
echo "  Basement Screens"
echo "  ─────────────────────────────────────"
echo "  Control panel:  http://localhost:${PORT}/"
echo "  Screen 1:       http://localhost:${PORT}/display/1"
echo "  Screen 2:       http://localhost:${PORT}/display/2"
echo "  Screen 3:       http://localhost:${PORT}/display/3"
echo ""
echo "  Press F on each display for fullscreen."
echo ""

exec .venv/bin/uvicorn server.main:app --host "$HOST" --port "$PORT" --reload
