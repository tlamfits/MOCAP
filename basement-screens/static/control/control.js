(function () {
  "use strict";

  const LEAGUES = [
    { id: "nfl", label: "NFL" },
    { id: "nba", label: "NBA" },
    { id: "mlb", label: "MLB" },
    { id: "nhl", label: "NHL" },
    { id: "ncaaf", label: "NCAAF" },
    { id: "ncaab", label: "NCAAB" },
  ];

  const LAYOUTS = {
    calm: ["Mountains", "Ocean", "Forest"],
    sports: ["Athlete Hero", "Live Scores", "Quotes & Facts"],
    movie: ["Poster", "Now Showing", "Coming Soon"],
    ambient: ["Mountains", "Ocean", "Forest"],
  };

  let state = null;
  let ws = null;

  const els = {
    statusDot: document.getElementById("statusDot"),
    statusText: document.getElementById("statusText"),
    modeBtns: document.querySelectorAll(".mode-btn"),
    layoutPreview: document.getElementById("layoutPreview"),
    screenLinks: document.getElementById("screenLinks"),
    leagueChips: document.getElementById("leagueChips"),
    toggleQuotes: document.getElementById("toggleQuotes"),
    toggleFacts: document.getElementById("toggleFacts"),
    movieTitle: document.getElementById("movieTitle"),
    movieTagline: document.getElementById("movieTagline"),
    movieYear: document.getElementById("movieYear"),
    moviePoster: document.getElementById("moviePoster"),
    saveMovie: document.getElementById("saveMovie"),
    upcomingFeatures: document.getElementById("upcomingFeatures"),
    toast: document.getElementById("toast"),
  };

  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    setTimeout(() => els.toast.classList.remove("show"), 2500);
  }

  function setConnected(on) {
    els.statusDot.classList.toggle("off", !on);
    els.statusText.textContent = on ? "Connected · screens synced" : "Reconnecting…";
  }

  function renderScreenLinks() {
    const roles = LAYOUTS[state?.mode || "calm"] || LAYOUTS.calm;
    els.screenLinks.innerHTML = [1, 2, 3].map((n) => {
      const url = `${location.origin}/display/${n}?screen=${n}`;
      return `
        <a class="screen-link" href="${url}" target="_blank">
          <div>
            <div>Screen ${n}</div>
            <div class="role">${roles[n - 1]}</div>
          </div>
          <span class="arrow">↗</span>
        </a>`;
    }).join("");
  }

  function renderLayoutPreview() {
    const roles = LAYOUTS[state?.mode || "calm"] || LAYOUTS.calm;
    els.layoutPreview.innerHTML = roles.map((r, i) =>
      `<div class="layout-screen active">Screen ${i + 1}<br>${r}</div>`
    ).join("");
  }

  function renderModeButtons() {
    const mode = state?.mode || "calm";
    els.modeBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });
  }

  function renderLeagues() {
    const active = new Set(state?.sports?.leagues || ["nfl", "nba"]);
    els.leagueChips.innerHTML = LEAGUES.map((l) =>
      `<button class="chip ${active.has(l.id) ? "on" : ""}" data-league="${l.id}">${l.label}</button>`
    ).join("");

    els.leagueChips.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", async () => {
        const leagues = new Set(state.sports?.leagues || []);
        const id = chip.dataset.league;
        if (leagues.has(id)) leagues.delete(id);
        else leagues.add(id);
        if (!leagues.size) return;
        state = await patchConfig({ sports: { leagues: [...leagues] } });
        renderLeagues();
        toast("Leagues updated");
      });
    });
  }

  function renderToggles() {
    const sports = state?.sports || {};
    els.toggleQuotes.classList.toggle("on", sports.show_quotes !== false);
    els.toggleFacts.classList.toggle("on", sports.show_facts !== false);
  }

  function renderMovieForm() {
    const m = state?.movie || {};
    els.movieTitle.value = m.title || "";
    els.movieTagline.value = m.tagline || "";
    els.movieYear.value = m.year || "";
    els.moviePoster.value = m.poster_url || "";
  }

  async function patchConfig(patch) {
    const res = await fetch("/api/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return res.json();
  }

  async function setMode(mode) {
    const res = await fetch("/api/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    state = await res.json();
    render();
    toast(`Switched to ${mode} mode`);
  }

  function render() {
    renderModeButtons();
    renderLayoutPreview();
    renderScreenLinks();
    renderLeagues();
    renderToggles();
    renderMovieForm();
  }

  async function loadMeta() {
    const res = await fetch("/api/meta");
    const meta = await res.json();
    els.upcomingFeatures.innerHTML = (meta.upcoming_features || [])
      .map((f) => `<li>${f}</li>`)
      .join("");
  }

  function connectWs() {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${proto}://${location.host}/ws`);

    ws.onopen = () => setConnected(true);

    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === "state") {
        state = msg.data;
        render();
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setTimeout(connectWs, 3000);
    };
  }

  els.modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });

  [els.toggleQuotes, els.toggleFacts].forEach((toggle) => {
    toggle.addEventListener("click", async () => {
      const key = toggle.dataset.key;
      const current = state.sports?.[key] !== false;
      state = await patchConfig({ sports: { [key]: !current } });
      renderToggles();
    });
  });

  els.saveMovie.addEventListener("click", async () => {
    state = await patchConfig({
      movie: {
        title: els.movieTitle.value,
        tagline: els.movieTagline.value,
        year: els.movieYear.value,
        poster_url: els.moviePoster.value,
      },
    });
    toast("Movie night saved");
  });

  async function init() {
    await loadMeta();
    const res = await fetch("/api/state");
    state = await res.json();
    render();
    connectWs();
  }

  init();
})();
