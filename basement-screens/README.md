# Basement Screens

Control three portrait 4K monitors in your basement with dynamic scenes for sports nights, focused work, and movie theater mode.

## Quick Start

```bash
cd basement-screens
chmod +x run.sh
./run.sh
```

Then open the **control panel** on your phone or laptop, and open each **display URL** on the corresponding TV browser. Press **F** for fullscreen on each screen.

| URL | Purpose |
|-----|---------|
| `http://<server>:8787/` | Control panel — switch modes |
| `http://<server>:8787/display/1` | Left screen |
| `http://<server>:8787/display/2` | Center screen |
| `http://<server>:8787/display/3` | Right screen |

Replace `<server>` with your Mac's local IP (e.g. `192.168.1.50`) so the TVs can reach it.

## Modes

### Calm / Focus (default)
Each screen shows a looping nature video — mountains, ocean, or forest — with a subtle clock overlay. Ideal for working downstairs.

### Sports Lounge
- **Screen 1** — Rotating athlete spotlight with hero imagery
- **Screen 2** — Live scores from ESPN (NFL, NBA, MLB, NHL, NCAA) with ticker
- **Screen 3** — Inspirational quotes, fun facts, and athlete roster

Scores refresh every 60 seconds. Toggle leagues and overlays from the control panel.

### Movie Theater
- **Screen 1** — Feature film poster
- **Screen 2** — "Now Showing" marquee
- **Screen 3** — Coming soon list

Set the movie title, tagline, year, and poster URL from the control panel.

## Configuration

Edit `config.json` for defaults, or use the control panel for live changes. All displays sync instantly via WebSocket.

## Hardware Setup Tips

1. Connect each TV to your network (Apple TV, Fire Stick, or built-in browser).
2. Open the display URL and enter fullscreen (F key, or browser kiosk mode).
3. For always-on kiosk: use [Chrome kiosk mode](https://www.google.com/chrome/browser/desktop/index.html) or an Raspberry Pi per screen.
4. Portrait orientation is handled in CSS — no OS rotation needed if TVs are physically mounted portrait.

## Coming Soon

- Custom highlight video playlists (YouTube/local files)
- Auto-switch to sports when favorite teams go live
- TMDB movie poster search
- Ambient audio sync (Spotify/Apple Music)
- Voice control (HomeKit/Alexa)
- Independent per-screen modes

## Requirements

- Python 3.10+
- Network access for live sports scores and nature videos
