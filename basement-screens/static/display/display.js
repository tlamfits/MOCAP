(function () {
  "use strict";

  const screenId = parseInt(new URLSearchParams(location.search).get("screen") ||
    location.pathname.match(/\/display\/(\d)/)?.[1] || "1", 10);

  const els = {
    connecting: document.getElementById("connecting"),
    root: document.getElementById("root"),
    badge: document.getElementById("screenBadge"),
    calmMode: document.getElementById("calmMode"),
    calmVideo: document.getElementById("calmVideo"),
    calmLabel: document.getElementById("calmLabel"),
    calmTime: document.getElementById("calmTime"),
    sportsMode: document.getElementById("sportsMode"),
    sportsHeroBg: document.getElementById("sportsHeroBg"),
    sportsContent: document.getElementById("sportsContent"),
    sportsTicker: document.getElementById("sportsTicker"),
    tickerTrack: document.getElementById("tickerTrack"),
    movieMode: document.getElementById("movieMode"),
    movieContent: document.getElementById("movieContent"),
    movieMarquee: document.getElementById("movieMarquee"),
    marqueeText: document.getElementById("marqueeText"),
  };

  let state = null;
  let scenes = [];
  let refreshTimer = null;
  let athleteTimer = null;
  let ws = null;

  els.badge.textContent = `Screen ${screenId}`;

  function hideAll() {
    els.calmMode.classList.add("hidden");
    els.sportsMode.classList.add("hidden");
    els.movieMode.classList.add("hidden");
  }

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s || "";
    return d.innerHTML;
  }

  function updateClock() {
    const now = new Date();
    els.calmTime.textContent = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  async function loadScenes() {
    const res = await fetch("/api/calm/scenes");
    const data = await res.json();
    scenes = data.scenes || [];
  }

  function renderCalm(config) {
    hideAll();
    els.calmMode.classList.remove("hidden");
    els.root.classList.remove("hidden");

    const sceneIds = config.calm?.scenes || ["mountains", "ocean", "forest"];
    const sceneId = sceneIds[(screenId - 1) % sceneIds.length];
    const scene = scenes.find((s) => s.id === sceneId) || scenes[screenId - 1] || scenes[0];

    if (scene) {
      els.calmLabel.textContent = scene.label;
      els.calmVideo.src = scene.video;
      els.calmVideo.poster = scene.poster;
      els.calmVideo.play().catch(() => {});
    }
    updateClock();
  }

  function renderGameCard(game, i) {
    const live = game.state === "in";
    return `
      <div class="game-card ${live ? "live" : ""} fade-in" style="animation-delay:${i * 0.08}s">
        <div class="game-league">${esc(game.league)}${live ? " · LIVE" : ""}</div>
        <div class="game-teams">
          <div class="game-team">
            <span class="team-name">${esc(game.away.name)}</span>
            <span class="team-score">${esc(game.away.score)}</span>
          </div>
          <div class="game-team">
            <span class="team-name">${esc(game.home.name)}</span>
            <span class="team-score">${esc(game.home.score)}</span>
          </div>
        </div>
        <div class="game-status">${esc(game.status)}${game.clock ? " · " + esc(game.clock) : ""}</div>
      </div>`;
  }

  function renderSportsScreen1(data) {
    const a = data.athlete;
    els.sportsHeroBg.style.backgroundImage = `url('${a.image}')`;
    els.sportsContent.innerHTML = `
      <div class="sports-hero">
        <div class="sports-hero-content fade-in">
          <div class="mode-label">${esc(a.sport)}</div>
          <div class="athlete-name">${esc(a.name)}</div>
          <div class="athlete-meta">${esc(a.team)}</div>
          <div class="athlete-stat">${esc(a.stat)}</div>
        </div>
      </div>`;
  }

  function renderSportsScreen2(data) {
    const liveCount = data.games.filter((g) => g.state === "in").length;
    const cards = data.games.slice(0, 6).map(renderGameCard).join("");
    els.sportsHeroBg.style.backgroundImage = "";
    els.sportsContent.innerHTML = `
      <div class="scoreboard-wrap">
        <div class="scoreboard-header">
          <div class="scoreboard-title">SCORES</div>
          ${liveCount ? `<div class="live-pill"><span class="live-dot"></span>${liveCount} LIVE</div>` : ""}
        </div>
        ${cards || '<div class="game-card"><div class="game-status">No games scheduled right now</div></div>'}
      </div>`;

    if (data.games.length) {
      const items = data.games.map((g) =>
        `<span class="ticker-item"><strong>${esc(g.league)}</strong>${esc(g.away.abbrev || g.away.name)} ${esc(g.away.score)} – ${esc(g.home.score)} ${esc(g.home.abbrev || g.home.name)}</span>`
      ).join("");
      els.tickerTrack.innerHTML = items + items;
      els.sportsTicker.classList.remove("hidden");
    } else {
      els.sportsTicker.classList.add("hidden");
    }
  }

  function renderSportsScreen3(data, config) {
    els.sportsHeroBg.style.backgroundImage = "";
    const parts = [];

    if (config.sports?.show_quotes !== false) {
      parts.push(`
        <div class="quote-block fade-in">
          <div class="quote-text">"${esc(data.quote.text)}"</div>
          <div class="quote-author">— ${esc(data.quote.author)}</div>
        </div>`);
    }

    if (config.sports?.show_facts !== false) {
      parts.push(`
        <div class="fact-block fade-in" style="animation-delay:0.2s">
          <div class="fact-label">Did You Know?</div>
          <div class="fact-text">${esc(data.fact)}</div>
        </div>`);
    }

    const athletes = data.athletes || [];
    if (athletes.length) {
      const roster = athletes.slice(0, 4).map((a) =>
        `<div class="upcoming-item"><span class="upcoming-item-name">${esc(a.name)}</span><span class="upcoming-item-year">${esc(a.sport)}</span></div>`
      ).join("");
      parts.push(`
        <div class="fact-block fade-in" style="animation-delay:0.4s">
          <div class="fact-label">Spotlight Athletes</div>
          <div class="upcoming-list" style="padding:0">${roster}</div>
        </div>`);
    }

    els.sportsContent.innerHTML = `<div class="overlay-panel">${parts.join("")}</div>`;
    els.sportsTicker.classList.add("hidden");
  }

  async function renderSports(config) {
    hideAll();
    els.sportsMode.classList.remove("hidden");
    els.root.classList.remove("hidden");

    try {
      const res = await fetch(`/api/sports/content?screen=${screenId}`);
      const data = await res.json();

      if (screenId === 1) renderSportsScreen1(data);
      else if (screenId === 2) renderSportsScreen2(data);
      else renderSportsScreen3(data, config);

      scheduleAthleteRotation(config, data.athletes);
    } catch {
      els.sportsContent.innerHTML = '<div class="overlay-panel"><div class="fact-block"><div class="fact-text">Unable to load sports data</div></div></div>';
    }
  }

  function scheduleAthleteRotation(config, athletes) {
    clearInterval(athleteTimer);
    if (screenId !== 1 || !athletes?.length) return;

    const interval = (config.sports?.highlight_rotation_seconds || 45) * 1000;
    let idx = 0;
    athleteTimer = setInterval(() => {
      idx = (idx + 1) % athletes.length;
      const a = athletes[idx];
      els.sportsHeroBg.style.backgroundImage = `url('${a.image}')`;
      els.sportsContent.querySelector(".athlete-name").textContent = a.name;
      els.sportsContent.querySelector(".athlete-meta").textContent = a.team;
      els.sportsContent.querySelector(".athlete-stat").textContent = a.stat;
      els.sportsContent.querySelector(".mode-label").textContent = a.sport;
    }, interval);
  }

  function renderMovie(config) {
    hideAll();
    els.movieMode.classList.remove("hidden");
    els.root.classList.remove("hidden");

    const movie = config.movie || {};
    const upcoming = movie.upcoming || [];

    if (screenId === 1) {
      const poster = movie.poster_url ||
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80";
      els.movieContent.innerHTML = `
        <div class="movie-theater fade-in">
          <img class="movie-poster" src="${esc(poster)}" alt="${esc(movie.title)}" />
          <div class="movie-title">${esc(movie.title)}</div>
          <div class="movie-tagline">${esc(movie.tagline || "")}</div>
          <div class="movie-year">${esc(movie.year || "")}</div>
        </div>`;
      els.movieMarquee.classList.add("hidden");
    } else if (screenId === 2) {
      els.movieContent.innerHTML = `
        <div class="now-showing fade-in">
          <div class="now-showing-label">Now Showing</div>
          <div class="movie-title" style="margin-top:24px">${esc(movie.title)}</div>
          <div class="movie-tagline" style="margin-top:16px;max-width:400px;margin-inline:auto">${esc(movie.tagline || "Enjoy the show.")}</div>
          <div class="movie-year" style="margin-top:24px">${esc(movie.year || "")}</div>
        </div>`;
      els.marqueeText.textContent = `★ ${movie.title?.toUpperCase()} ★ NOW PLAYING ★`;
      els.movieMarquee.classList.remove("hidden");
    } else {
      const items = upcoming.map((u) =>
        `<div class="upcoming-item"><span class="upcoming-item-name">${esc(u.title)}</span><span class="upcoming-item-year">${esc(u.year)}</span></div>`
      ).join("");
      els.movieContent.innerHTML = `
        <div class="upcoming-list fade-in">
          <div class="upcoming-title">COMING SOON</div>
          ${items || '<div class="game-status">Add upcoming titles in the control panel</div>'}
        </div>`;
      els.movieMarquee.classList.add("hidden");
    }
  }

  async function render(config) {
    clearInterval(refreshTimer);
    const mode = config.mode || "calm";

    if (mode === "calm" || mode === "ambient") {
      if (!scenes.length) await loadScenes();
      renderCalm(config);
    } else if (mode === "sports") {
      await renderSports(config);
      refreshTimer = setInterval(() => renderSports(config), 60000);
    } else if (mode === "movie") {
      renderMovie(config);
    }
  }

  function connectWs() {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${proto}://${location.host}/ws`);

    ws.onopen = () => {
      els.connecting.classList.add("hidden");
    };

    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === "state") {
        state = msg.data;
        render(state);
      } else if (msg.type === "scores_refresh" && state?.mode === "sports") {
        renderSports(state);
      }
    };

    ws.onclose = () => {
      setTimeout(connectWs, 3000);
    };
  }

  async function init() {
    await loadScenes();
    const res = await fetch("/api/state");
    state = await res.json();
    els.connecting.classList.add("hidden");
    await render(state);
    connectWs();
    setInterval(updateClock, 1000);

    document.addEventListener("keydown", (e) => {
      if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
      }
    });
  }

  init();
})();
