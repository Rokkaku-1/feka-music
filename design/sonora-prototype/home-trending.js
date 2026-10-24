(() => {
  let status = "Cargando lo que está sonando…",
    groups = [];
  const shuffle = (items) => {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const card = (i) => {
    const s = songs[i];
    return `<button class="trending-track" data-play="${i}"><span class="trending-art"><img src="${escapeHtml(s.cover)}" alt="" loading="lazy"><span>${icon("play")}</span></span><strong>${escapeHtml(s.title)}</strong><small>${escapeHtml(s.artist)}</small></button>`;
  };
  function render() {
    if (view !== "inicio") return;
    $("#moods-section").hidden = true;
    const discovery = $("#discovery");
    if (discovery) discovery.hidden = true;
    $("#catalog-title").textContent = homeTrendingIndices
      ? "En tendencia, a tu manera"
      : "Tu selección disponible";
    $("#catalog-eyebrow").textContent = "UN NUEVO MIX CADA VEZ";
    if (!homeTrendingIndices?.length) {
      $("#home-content").innerHTML =
        `<section class="trending-intro"><p class="eyebrow">DESCUBRE LO QUE SUENA</p><h2>Hoy suena diferente.</h2><p role="status">${escapeHtml(status)}</p>${status.startsWith("No pudimos") ? '<button class="primary-button" id="retry-trending">Volver a intentar</button>' : ""}</section>`;
      $("#retry-trending")?.addEventListener("click", load);
      return;
    }
    const lead = songs[homeTrendingIndices[0]],
      second = songs[homeTrendingIndices[1] || homeTrendingIndices[0]];
    $("#home-content").innerHTML =
      `<section class="trending-hero" aria-label="Tendencias destacadas"><div><p class="eyebrow">EN EL RADAR · YOUTUBE</p><h2>Hoy suena<br><em>diferente.</em></h2><p>Lo más popular en Perú, Estados Unidos y Corea del Sur. Una nueva mezcla al entrar.</p><button class="primary-button" data-play="${homeTrendingIndices[0]}">${icon("play")}Escuchar el mix</button><small>Selección renovada cada 24 horas · Orden aleatorio</small></div><button class="trending-cover" data-play="${homeTrendingIndices[0]}" aria-label="Reproducir ${escapeHtml(lead.title)}"><img src="${escapeHtml(lead.cover)}" alt=""><span><strong>${escapeHtml(lead.title)}</strong><small>${escapeHtml(lead.artist)}</small></span></button><img class="trending-back-cover" src="${escapeHtml(second.cover)}" alt=""></section><div class="trending-source">Popularidad de YouTube · Géneros según temática disponible · La selección cambia al recargar <button class="text-button" data-choose-tastes>Elegir mis géneros</button><button class="text-button" data-open-history>Mi historial</button></div><section class="genre-trending" aria-label="Tendencias por género">${groups.map(([genre, ids]) => `<section class="genre-trending-row"><div class="section-heading"><div><p class="eyebrow">CAMBIA DE FRECUENCIA</p><h2>${escapeHtml(genre === "Sin clasificar" ? "Más sonidos en tendencia" : genre)}</h2></div><span class="genre-count">${ids.length} en el radar</span></div><div class="trending-shelf">${ids.slice(0, 6).map(card).join("")}</div></section>`).join("")}</section>`;
  }
  async function load() {
    status = "Cargando lo que está sonando…";
    render();
    const endpoint =
      ["localhost", "127.0.0.1"].includes(location.hostname) &&
      location.port === "5500"
        ? "http://localhost:4186/.netlify/functions/youtube-search"
        : "/api/music";
    try {
      const response = await fetch(endpoint + "?mode=trending", {
        headers: { "X-Feka-Search": "1" },
        signal: AbortSignal.timeout(18000),
      });
      const data = await response.json();
      if (!response.ok || response.status === 202 || !data.items?.length)
        throw new Error("Unavailable");
      homeTrendingIndices = shuffle(rememberTracks(data.items));
      const previous = readStore("fekamusic.lastHomeLead", "");
      if (
        songs[homeTrendingIndices[0]].id === previous &&
        homeTrendingIndices.length > 1
      )
        homeTrendingIndices.push(homeTrendingIndices.shift());
      save("fekamusic.lastHomeLead", songs[homeTrendingIndices[0]].id);
      const byGenre = new Map();
      homeTrendingIndices.forEach((i) => {
        const genre = songs[i].genre;
        if (!byGenre.has(genre)) byGenre.set(genre, []);
        byGenre.get(genre).push(i);
      });
      groups = shuffle(
        [...byGenre].filter(([g]) => g !== "Sin clasificar"),
      ).slice(0, 5);
      if (byGenre.has("Sin clasificar"))
        groups.push(["Sin clasificar", byGenre.get("Sin clasificar")]);
      if (!player && !apiLoading) {
        current = homeTrendingIndices[0];
        updateTrack();
      }
      render();
      if (view === "inicio") renderSongs();
    } catch {
      status =
        "No pudimos cargar las tendencias. Puedes seguir escuchando tu catálogo disponible.";
      render();
    }
  }
  window.FekaHome = { render };
  load();
})();
