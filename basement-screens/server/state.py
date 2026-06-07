"""Shared application state for basement display screens."""

from __future__ import annotations

import asyncio
import json
from copy import deepcopy
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

DEFAULT_CONFIG: dict[str, Any] = {
    "mode": "calm",
    "sports": {
        "leagues": ["nfl", "nba", "mlb", "nhl"],
        "favorite_teams": [],
        "show_quotes": True,
        "show_facts": True,
        "highlight_rotation_seconds": 45,
    },
    "calm": {
        "scenes": ["mountains", "ocean", "forest"],
        "ambient_text": False,
    },
    "movie": {
        "title": "Dune: Part Two",
        "year": "2024",
        "tagline": "Long live the fighters.",
        "poster_url": "",
        "upcoming": [
            {"title": "Gladiator II", "year": "2024"},
            {"title": "Wicked", "year": "2024"},
            {"title": "Moana 2", "year": "2024"},
        ],
    },
}

MODES = ("calm", "sports", "movie", "ambient")


@dataclass
class AppState:
    config: dict[str, Any] = field(default_factory=lambda: deepcopy(DEFAULT_CONFIG))
    clients: set[Any] = field(default_factory=set)
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock)

    def snapshot(self) -> dict[str, Any]:
        return deepcopy(self.config)

    async def update(self, patch: dict[str, Any]) -> dict[str, Any]:
        async with self._lock:
            _deep_merge(self.config, patch)
            return self.snapshot()

    async def set_mode(self, mode: str) -> dict[str, Any]:
        if mode not in MODES:
            raise ValueError(f"Unknown mode: {mode}")
        async with self._lock:
            self.config["mode"] = mode
            return self.snapshot()

    def load_config_file(self, path: Path) -> None:
        if path.exists():
            with path.open() as f:
                data = json.load(f)
            _deep_merge(self.config, data)


def _deep_merge(base: dict[str, Any], patch: dict[str, Any]) -> None:
    for key, value in patch.items():
        if key in base and isinstance(base[key], dict) and isinstance(value, dict):
            _deep_merge(base[key], value)
        else:
            base[key] = value
