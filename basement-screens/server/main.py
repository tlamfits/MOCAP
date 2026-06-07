"""Basement Screens — triple 4K portrait monitor control server."""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import sports_api
from .state import DEFAULT_CONFIG, MODES, AppState

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"
CONFIG_PATH = ROOT / "config.json"

app = FastAPI(title="Basement Screens", version="1.0.0")
state = AppState()
state.load_config_file(CONFIG_PATH)


class ModeRequest(BaseModel):
    mode: str


class ConfigPatch(BaseModel):
    sports: Optional[dict] = None
    calm: Optional[dict] = None
    movie: Optional[dict] = None


async def broadcast(message: dict) -> None:
    dead: set[WebSocket] = set()
    payload = json.dumps(message)
    for ws in list(state.clients):
        try:
            await ws.send_text(payload)
        except Exception:
            dead.add(ws)
    state.clients -= dead


@app.on_event("startup")
async def startup() -> None:
    asyncio.create_task(_score_refresh_loop())


async def _score_refresh_loop() -> None:
    while True:
        await asyncio.sleep(60)
        if state.config.get("mode") == "sports":
            await broadcast({"type": "scores_refresh"})


@app.get("/")
async def control_panel() -> FileResponse:
    return FileResponse(STATIC / "control" / "index.html")


@app.get("/display/{screen_id}")
async def display_screen(screen_id: int) -> FileResponse:
    if screen_id not in (1, 2, 3):
        screen_id = 1
    return FileResponse(STATIC / "display" / "index.html")


@app.get("/api/state")
async def get_state() -> dict:
    return state.snapshot()


@app.post("/api/mode")
async def set_mode(req: ModeRequest) -> dict:
    snapshot = await state.set_mode(req.mode)
    await broadcast({"type": "state", "data": snapshot})
    return snapshot


@app.patch("/api/config")
async def patch_config(req: ConfigPatch) -> dict:
    patch = req.model_dump(exclude_none=True)
    snapshot = await state.update(patch)
    await broadcast({"type": "state", "data": snapshot})
    return snapshot


@app.get("/api/scores")
async def get_scores() -> dict:
    leagues = state.config.get("sports", {}).get("leagues", ["nfl", "nba"])
    games = await sports_api.fetch_all_scores(leagues)
    return {"games": games, "updated": True}


@app.get("/api/sports/content")
async def sports_content(screen: int = 1) -> dict:
    leagues = state.config.get("sports", {}).get("leagues", ["nfl", "nba"])
    games = await sports_api.fetch_all_scores(leagues)
    athlete = sports_api.get_athlete(screen - 1)
    return {
        "games": games[:12],
        "athlete": athlete,
        "quote": sports_api.get_quote(),
        "fact": sports_api.get_fact(),
        "athletes": sports_api.get_all_athletes(),
    }


@app.get("/api/calm/scenes")
async def calm_scenes() -> dict:
    return {
        "scenes": [
            {
                "id": "mountains",
                "label": "Mountains",
                "video": "https://videos.pexels.com/video-files/6981411/6981411-uhd_1440_2732_25fps.mp4",
                "poster": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
            },
            {
                "id": "ocean",
                "label": "Ocean",
                "video": "https://videos.pexels.com/video-files/4763824/4763824-uhd_1440_2732_25fps.mp4",
                "poster": "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&q=80",
            },
            {
                "id": "forest",
                "label": "Forest",
                "video": "https://videos.pexels.com/video-files/3571264/3571264-uhd_1440_2732_25fps.mp4",
                "poster": "https://images.unsplash.com/photo-1448375249986-393bf4bdb949?w=1200&q=80",
            },
        ]
    }


@app.get("/api/meta")
async def meta() -> dict:
    return {
        "modes": list(MODES),
        "screens": 3,
        "defaults": DEFAULT_CONFIG,
        "upcoming_features": [
            "Custom highlight video playlists (YouTube/local)",
            "Team-specific auto-switch when games go live",
            "TMDB movie poster search & auto-fetch",
            "Spotify/Apple Music ambient audio sync",
            "Voice control via HomeKit/Alexa",
            "Per-screen independent modes",
        ],
    }


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    await ws.accept()
    state.clients.add(ws)
    try:
        await ws.send_text(json.dumps({"type": "state", "data": state.snapshot()}))
        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)
            if msg.get("type") == "ping":
                await ws.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        pass
    finally:
        state.clients.discard(ws)


app.mount("/static", StaticFiles(directory=str(STATIC)), name="static")
