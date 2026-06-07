"""Fetch live scores and athlete content from ESPN public APIs."""

from __future__ import annotations

import random
from typing import Any, Optional

import httpx

LEAGUE_ENDPOINTS: dict[str, str] = {
    "nfl": "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
    "nba": "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
    "mlb": "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard",
    "nhl": "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard",
    "ncaaf": "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard",
    "ncaab": "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard",
}

LEAGUE_LABELS = {
    "nfl": "NFL",
    "nba": "NBA",
    "mlb": "MLB",
    "nhl": "NHL",
    "ncaaf": "NCAA Football",
    "ncaab": "NCAA Basketball",
}

SPORTS_QUOTES = [
    {"text": "Hard work beats talent when talent doesn't work hard.", "author": "Tim Notke"},
    {"text": "The more difficult the victory, the greater the happiness in winning.", "author": "Pelé"},
    {"text": "You miss 100% of the shots you don't take.", "author": "Wayne Gretzky"},
    {"text": "Champions keep playing until they get it right.", "author": "Billie Jean King"},
    {"text": "It's not whether you get knocked down; it's whether you get up.", "author": "Vince Lombardi"},
    {"text": "Pressure is a privilege.", "author": "Billie Jean King"},
    {"text": "The only way to prove you're a good sport is to lose.", "author": "Ernie Banks"},
    {"text": "Excellence is not a singular act, but a habit.", "author": "Aristotle"},
]

SPORTS_FACTS = [
    "The NFL football is made of cowhide — roughly 3,000 cows per season.",
    "A regulation NBA rim is exactly 10 feet high — unchanged since 1891.",
    "MLB balls can travel up to 120 mph off the bat in pro games.",
    "NHL pucks are frozen before games so they don't bounce on the ice.",
    "The longest tennis match lasted 11 hours and 5 minutes.",
    "Olympic gold medals are mostly silver with a gold coating.",
    "A marathon is exactly 26.2 miles — set for the 1908 London Olympics.",
    "The 'Greatest Show on Turf' Rams averaged 32.9 points per game in 1999.",
]

HIGHLIGHT_ATHLETES = [
    {
        "name": "Patrick Mahomes",
        "sport": "NFL",
        "team": "Kansas City Chiefs",
        "stat": "3× Super Bowl Champion",
        "image": "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&q=80",
    },
    {
        "name": "LeBron James",
        "sport": "NBA",
        "team": "Los Angeles Lakers",
        "stat": "All-time scoring leader",
        "image": "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80",
    },
    {
        "name": "Shohei Ohtani",
        "sport": "MLB",
        "team": "Los Angeles Dodgers",
        "stat": "Two-way superstar",
        "image": "https://images.unsplash.com/photo-1566577739112-5180d4bf9350?w=800&q=80",
    },
    {
        "name": "Connor McDavid",
        "sport": "NHL",
        "team": "Edmonton Oilers",
        "stat": "Fastest skater in the league",
        "image": "https://images.unsplash.com/photo-1515705323620-0a1ddff894bb?w=800&q=80",
    },
    {
        "name": "Caitlin Clark",
        "sport": "WNBA",
        "team": "Indiana Fever",
        "stat": "Record-breaking scorer",
        "image": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    },
]


async def fetch_scoreboard(league: str) -> list[dict[str, Any]]:
    url = LEAGUE_ENDPOINTS.get(league)
    if not url:
        return []

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
    except (httpx.HTTPError, ValueError):
        return []

    games: list[dict[str, Any]] = []
    for event in data.get("events", []):
        comp = (event.get("competitions") or [{}])[0]
        competitors = comp.get("competitors") or []
        if len(competitors) < 2:
            continue

        home = next((c for c in competitors if c.get("homeAway") == "home"), competitors[0])
        away = next((c for c in competitors if c.get("homeAway") == "away"), competitors[1])

        status = event.get("status", {}).get("type", {})
        games.append(
            {
                "id": event.get("id"),
                "league": LEAGUE_LABELS.get(league, league.upper()),
                "league_key": league,
                "name": event.get("shortName") or event.get("name", ""),
                "status": status.get("description", ""),
                "state": status.get("state", ""),
                "clock": status.get("detail", ""),
                "home": _team(home),
                "away": _team(away),
                "venue": (comp.get("venue") or {}).get("fullName", ""),
            }
        )
    return games


def _team(competitor: dict[str, Any]) -> dict[str, Any]:
    team = competitor.get("team") or {}
    return {
        "name": team.get("displayName") or team.get("name", ""),
        "abbrev": team.get("abbreviation", ""),
        "logo": team.get("logo"),
        "score": competitor.get("score", "0"),
        "record": (competitor.get("records") or [{}])[0].get("summary", ""),
    }


async def fetch_all_scores(leagues: list[str]) -> list[dict[str, Any]]:
    all_games: list[dict[str, Any]] = []
    for league in leagues:
        games = await fetch_scoreboard(league)
        all_games.extend(games)

    live = [g for g in all_games if g["state"] == "in"]
    scheduled = [g for g in all_games if g["state"] == "pre"]
    final = [g for g in all_games if g["state"] == "post"]
    return live + scheduled + final


def get_quote() -> dict[str, str]:
    return random.choice(SPORTS_QUOTES)


def get_fact() -> str:
    return random.choice(SPORTS_FACTS)


def get_athlete(index: Optional[int] = None) -> dict[str, Any]:
    if index is not None:
        return HIGHLIGHT_ATHLETES[index % len(HIGHLIGHT_ATHLETES)]
    return random.choice(HIGHLIGHT_ATHLETES)


def get_all_athletes() -> list[dict[str, Any]]:
    return HIGHLIGHT_ATHLETES
