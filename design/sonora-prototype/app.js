/* Editorial starter catalog plus secure, server-backed YouTube search. */
// Keep local playback on a hostname: YouTube rejects the music embeds tested
// with a loopback-IP referrer. Navigate to the real local URL, never spoof it.
if (location.hostname === "127.0.0.1") {
  const localUrl = new URL(location.href);
  localUrl.hostname = "localhost";
  location.replace(localUrl.href);
}
const MUSIC_GENRES = [
  "Pop",
  "Rock",
  "Alternativo",
  "Reguetón",
  "Salsa",
  "Cumbia",
  "Bachata",
  "Merengue",
  "Vallenato",
  "Regional mexicano",
  "Urbano latino",
  "Hip-hop / Rap",
  "R&B / Soul",
  "Electrónica",
  "Indie",
  "K-pop",
  "Jazz",
  "Blues",
  "Clásica",
  "Metal",
  "Punk",
  "Reggae",
  "Folk",
  "Country",
  "Música criolla",
  "Andina",
  "Cristiana / Góspel",
  "Infantil",
  "Villancicos",
  "Lo-fi",
  "Instrumental",
];
const songs = [
  {
    title: "vampire",
    artist: "Olivia Rodrigo",
    genre: "Pop",
    id: "RlPNh_PBZb4",
    cover: "https://i.scdn.co/image/ab67616d00001e02e85259a1cae29a8d91f2093d",
  },
  {
    title: "Creep",
    artist: "Radiohead",
    genre: "Alternativo",
    id: "XFkzRNyygfk",
    cover: "https://i.scdn.co/image/ab67616d00001e02ec548c00d3ac2f10be73366d",
  },
  {
    title: "Thriller",
    artist: "Michael Jackson",
    genre: "Pop",
    id: "sOnqjkJTMaA",
    cover: "https://i.scdn.co/image/ab67616d00001e0232a7d87248d1b75463483df5",
  },
  {
    title: "bury a friend",
    artist: "Billie Eilish",
    genre: "Alternativo",
    id: "HUHC9tYz8ik",
    cover: "https://i.scdn.co/image/ab67616d00001e0250a3147b4edd7701a876c6ce",
  },
  {
    title: "Demons",
    artist: "Imagine Dragons",
    genre: "Rock",
    id: "mWRsgZuwf_8",
    cover: "https://i.scdn.co/image/ab67616d00001e02407bd04707c463bbb3410737",
  },
  {
    title: "Disturbia",
    artist: "Rihanna",
    genre: "Pop",
    id: "E1mU6h4Xdxc",
    cover: "https://i.scdn.co/image/ab67616d00001e02f9f27162ab1ed45b8d7a7e98",
  },
];
const $ = (s) => document.querySelector(s);
const icon = (name) =>
  `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const readStore = (key, fallback) => {
  try {
    return (
      JSON.parse(
        localStorage.getItem(key) ??
          localStorage.getItem(key.replace("fekamusic.", "sonora.")),
      ) ?? fallback
    );
  } catch {
    return fallback;
  }
};
const localCatalog = readStore("fekamusic.remoteTracks", []);
if (Array.isArray(localCatalog)) rememberTracks(localCatalog, false);
const songIndex = (value) =>
  typeof value === "string"
    ? songs.findIndex((s) => s.id === value)
    : Number.isInteger(value) && songs[value]
      ? value
      : -1;
const storedFavorites = readStore("fekamusic.favorites", []);
let favorites = new Set(
  (Array.isArray(storedFavorites) ? storedFavorites : [])
    .slice(0, 1000)
    .map(songIndex)
    .filter((i) => i >= 0),
);
const storedPlaylists = readStore("fekamusic.playlists", []);
let playlists = (Array.isArray(storedPlaylists) ? storedPlaylists : [])
  .slice(0, 100)
  .filter((p) => p && typeof p.name === "string" && Array.isArray(p.ids))
  .map((p) => ({
    name: p.name.slice(0, 48),
    ids: p.ids
      .slice(0, 1000)
      .map(songIndex)
      .filter((i) => i >= 0),
  }));
let current = 0,
  view = "inicio",
  filter = "Todas",
  player = null,
  apiLoading = false,
  playing = false,
  shuffled = false,
  selectedPlaylist = null;
let toastTimer,
  radioPlaybackFailures = 0;
let homeTrendingIndices = null;
let remoteSearchResults = null,
  remoteQuery = "",
  remoteError = "",
  remoteBusy = false;
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("feka-library-change"));
  } catch {
    toast("El navegador no permite guardar datos locales.");
  }
}
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 3200);
}
const escapeHtml = FekaData.escapeHtml;
function renderSongs() {
  const query = $("#search").value.trim().toLocaleLowerCase("es");
  document.body.classList.toggle("is-searching", Boolean(query));
  const useRemote =
    view === "explorar" &&
    remoteSearchResults !== null &&
    remoteQuery === query;
  const ids = (
    useRemote
      ? remoteSearchResults
      : view === "inicio" && homeTrendingIndices
        ? homeTrendingIndices.slice(0, 12)
        : songs.map((_, i) => i)
  ).filter((i) => {
    const s = songs[i];
    return (
      (!["biblioteca", "favoritos"].includes(view) || favorites.has(i)) &&
      (view !== "playlist" || selectedPlaylist?.ids.includes(i)) &&
      (filter === "Todas" || s.genre === filter) &&
      (useRemote ||
        `${s.title} ${s.artist}`.toLocaleLowerCase("es").includes(query))
    );
  });
  $("#song-grid").innerHTML = ids
    .map((i) => {
      const s = songs[i];
      return `<article class="song-card ${i === current ? "is-current" : ""}"><button class="song-art" data-play="${i}" aria-label="Reproducir ${escapeHtml(s.title)}, ${escapeHtml(s.artist)}"><img src="${escapeHtml(s.cover)}" alt="Portada de ${escapeHtml(s.title)}" loading="lazy"><span class="song-play">${icon(i === current && playing ? "pause" : "play")}</span></button><div class="song-meta"><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.artist)}</p><button class="icon-button card-favorite ${favorites.has(i) ? "is-saved" : ""}" data-favorite="${i}" aria-pressed="${favorites.has(i)}" aria-label="${favorites.has(i) ? "Quitar" : "Guardar"} ${escapeHtml(s.title)} ${favorites.has(i) ? "de" : "en"} favoritos">${icon("heart")}</button></div></article>`;
    })
    .join("");
  $("#empty-state").hidden = ids.length > 0 || remoteBusy;
  const feedback = $("#remote-search-status");
  feedback.hidden = view !== "explorar" || !query;
  feedback.textContent = remoteBusy
    ? "Buscando en YouTube…"
    : remoteError ||
      (useRemote
        ? `${ids.length} resultados de YouTube.`
        : "Pulsa Enter o Buscar para consultar YouTube.");
  $("#song-grid").setAttribute("aria-busy", String(remoteBusy));
  $("#empty-state h3").textContent =
    filter !== "Todas"
      ? `Aún no hay canciones clasificadas en ${filter}.`
      : query
        ? "No encontramos esa canción."
        : "Tu próxima favorita está por llegar.";
  $("#empty-state p").textContent =
    filter !== "Todas"
      ? "Puedes buscar este género en YouTube. Los resultados dependen de sus títulos y canales."
      : query
        ? "Pulsa Buscar para consultar YouTube o prueba otro título o artista."
        : "Explora el catálogo y guarda una canción con el corazón.";
  const emptyButton = $("#empty-state button");
  emptyButton.dataset.genreSearch = filter !== "Todas" ? filter : "";
  if (filter !== "Todas") emptyButton.removeAttribute("data-view");
  else emptyButton.dataset.view = "explorar";
  emptyButton.textContent =
    filter !== "Todas"
      ? `Buscar ${filter} en YouTube`
      : query
        ? "Ver todas las canciones"
        : "Descubrir música";
  $("#search-status").textContent = query
    ? `${ids.length} ${ids.length === 1 ? "canción encontrada" : "canciones encontradas"}.`
    : "";
  $("#favorite-count").textContent = favorites.size;
  document.querySelectorAll(".favorite-current").forEach((b) => {
    b.classList.toggle("is-saved", favorites.has(current));
    b.setAttribute("aria-pressed", String(favorites.has(current)));
    b.setAttribute(
      "aria-label",
      `${favorites.has(current) ? "Quitar" : "Guardar"} ${songs[current].title} ${favorites.has(current) ? "de" : "en"} favoritos`,
    );
  });
}
function renderQueue() {
  $("#queue").innerHTML = queueIndices()
    .map((i) => {
      const s = songs[i];
      return `<button class="queue-item" data-play="${i}" aria-label="Reproducir ${escapeHtml(s.title)}"><img src="${escapeHtml(s.cover)}" alt=""><span><strong>${escapeHtml(s.title)}</strong><small>${escapeHtml(s.artist)}</small></span>${icon("play")}</button>`;
    })
    .join("");
}
function setView(nextView) {
  window.FekaSearch?.cancel();
  remoteSearchResults = null;
  remoteQuery = "";
  remoteError = "";
  remoteBusy = false;
  view = nextView;
  filter = "Todas";
  $("#search").value = "";
  const titles = {
    inicio: "Escuchar ahora",
    explorar: "Encuentra tu próxima favorita",
    biblioteca: "Mi biblioteca",
    favoritos: "Tus favoritos",
    playlist: selectedPlaylist?.name || "Tu playlist",
  };
  $("#page-title").textContent = titles[view] || titles.inicio;
  $("#home-content").hidden = view !== "inicio";
  $("#moods-section").hidden = view !== "inicio";
  $("#catalog-title").textContent =
    view === "inicio" && homeTrendingIndices
      ? "En tendencia, a tu manera"
      : view === "inicio"
        ? "Siempre vuelves a estas"
        : view === "explorar"
          ? "Explora el catálogo"
          : view === "playlist"
            ? "Las canciones de tu playlist"
            : "Las que van contigo";
  $("#catalog-eyebrow").textContent = [
    "biblioteca",
    "favoritos",
    "playlist",
  ].includes(view)
    ? "TU SELECCIÓN PERSONAL"
    : "DALE PLAY A ALGO BUENO";
  $("#see-all").hidden = view !== "inicio";
  $("#filters").classList.toggle("visible", view === "explorar");
  $("#song-grid").classList.toggle("expanded", view !== "inicio");
  document
    .querySelectorAll("[data-view]")
    .forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  document
    .querySelectorAll("[data-filter]")
    .forEach((b) =>
      b.classList.toggle("selected", b.dataset.filter === "Todas"),
    );
  renderSongs();
  window.scrollTo({
    top: 0,
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
}
function setPlayerCompact(compact) {
  const panel = $("#now-playing");
  panel.classList.toggle("is-minimized", compact);
  document.body.classList.toggle("player-compact", compact);
  $("#minimize-video")?.setAttribute("aria-pressed", String(compact));
  $("#minimize-video")?.setAttribute(
    "aria-label",
    compact ? "Ampliar reproductor" : "Minimizar reproductor",
  );
  if ($("#minimize-video"))
    $("#minimize-video").textContent = compact ? "＋" : "−";
}
function showPlayer() {
  $("#now-playing").classList.remove("is-closed");
  $("#now-playing").classList.add("is-open");
  setPlayerCompact(false);
}
function updateTrack() {
  const s = songs[current];
  document.documentElement.style.setProperty(
    "--player-artwork",
    `url("${s.cover}")`,
  );
  $("#now-song").textContent = $("#bar-title").textContent = s.title;
  $("#now-artist").textContent = $("#bar-artist").textContent = s.artist;
  $("#bar-cover").src = $("#video-poster").src = s.cover;
  $("#video-start").setAttribute(
    "aria-label",
    `Reproducir ${s.title} en YouTube`,
  );
  renderSongs();
  renderQueue();
}
function setPlaying(value) {
  playing = value;
  $("#toggle-play").innerHTML = icon(value ? "pause" : "play");
  $("#toggle-play").setAttribute("aria-label", value ? "Pausar" : "Reproducir");
  renderSongs();
}
function loadApi() {
  if (apiLoading) return;
  apiLoading = true;
  window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player("youtube-player", {
      host: "https://www.youtube-nocookie.com",
      width: "100%",
      height: "100%",
      videoId: songs[current].id,
      playerVars: { playsinline: 1, origin: location.origin, autoplay: 1 },
      events: {
        onReady: (event) => {
          event.target.setVolume(Number($("#volume").value));
          if ($("#now-playing").classList.contains("is-closed"))
            event.target.pauseVideo();
          else event.target.playVideo();
          $("#video-start").hidden = true;
          $("#seek").disabled = false;
        },
        onStateChange: (event) => {
          if (
            event.data === YT.PlayerState.PLAYING &&
            $("#now-playing").classList.contains("is-closed")
          ) {
            event.target.pauseVideo();
            return;
          }
          setPlaying(event.data === YT.PlayerState.PLAYING);
          if (event.data === YT.PlayerState.PLAYING) {
            radioPlaybackFailures = 0;
            $("#playback-status").textContent = "Reproduciendo desde YouTube";
            beginListening();
          }
          if (event.data === YT.PlayerState.PAUSED)
            $("#playback-status").textContent =
              "En pausa. Tu música te espera.";
          if (event.data === YT.PlayerState.ENDED) advanceTrack();
        },
        onError: (event) => {
          console.warn("YouTube player error:", event.data);
          setPlaying(false);
          $("#playback-status").textContent =
            event.data === 153
              ? "YouTube no pudo identificar este sitio. Abre la página desde Live Server, no como archivo."
              : [101, 150].includes(event.data)
                ? "YouTube no permite reproducir este video aquí. Prueba otra canción."
                : "Este video no está disponible aquí. Prueba otra canción.";
          toast("YouTube no pudo reproducir este video.");
          if (
            [100, 101, 150].includes(event.data) &&
            window.FekaRadio?.active &&
            window.FekaRadio.enabled &&
            ++radioPlaybackFailures <= 3
          )
            advanceTrack();
        },
      },
    });
  };
  const script = document.createElement("script");
  script.src = "https://www.youtube.com/iframe_api";
  script.onerror = () => {
    apiLoading = false;
    $("#playback-status").textContent =
      "No se pudo conectar con YouTube. Revisa la conexión.";
    toast("No se pudo cargar YouTube.");
  };
  document.head.append(script);
  setTimeout(() => {
    if (!player) {
      apiLoading = false;
      $("#playback-status").textContent =
        "YouTube tarda en responder. Puedes volver a intentarlo.";
    }
  }, 15000);
}
function playTrack(index, { automatic = false } = {}) {
  if (!songs[index]) return;
  if (automatic) window.FekaRadio?.record(songs[index]);
  else {
    radioPlaybackFailures = 0;
    window.FekaRadio?.start(songs[index]);
  }
  const changed = current !== index;
  current = index;
  updateTrack();
  if (changed) {
    $("#elapsed").textContent = "0:00";
    $("#duration").textContent = "—:—";
    $("#seek").value = 0;
    paintPlayerRange($("#seek"));
  }
  $("#now-playing").classList.add("has-video");
  showPlayer();
  $("#playback-status").textContent = "Conectando con YouTube…";
  if (player?.loadVideoById) {
    if (changed) {
      player.loadVideoById(songs[index].id);
    } else {
      player.playVideo();
    }
  } else loadApi();
}
function togglePlayback() {
  if (!player) {
    playTrack(current);
    return;
  }
  if (playing) {
    player.pauseVideo();
  } else {
    showPlayer();
    player.playVideo();
  }
}
function favorite(index) {
  if (favorites.has(index)) favorites.delete(index);
  else favorites.add(index);
  save(
    "fekamusic.favorites",
    [...favorites].map((i) => songs[i].id),
  );
  renderSongs();
  renderDiscovery();
  toast(
    favorites.has(index)
      ? "Guardada en tu biblioteca de este navegador."
      : "Canción eliminada de tus favoritos.",
  );
}
function renderPlaylists() {
  $("#playlist-links").innerHTML = playlists
    .map(
      (p, i) =>
        `<button class="nav-item" data-playlist="${i}">${icon("music")}${escapeHtml(p.name)}</button>`,
    )
    .join("");
}
document.addEventListener("click", (e) => {
  const play = e.target.closest("[data-play]");
  if (play) {
    playTrack(Number(play.dataset.play));
    return;
  }
  const fav = e.target.closest("[data-favorite]");
  if (fav) {
    favorite(Number(fav.dataset.favorite));
    return;
  }
  const genreSearch = e.target.closest("[data-genre-search]");
  if (genreSearch?.dataset.genreSearch) {
    const genre = genreSearch.dataset.genreSearch;
    setView("explorar");
    $("#search").value = genre + " música";
    window.FekaSearch?.submit();
    return;
  }
  const nav = e.target.closest("[data-view]");
  if (nav) {
    setView(nav.dataset.view);
    return;
  }
  const category = e.target.closest("[data-filter]");
  if (category) {
    filter = category.dataset.filter;
    document
      .querySelectorAll("[data-filter]")
      .forEach((b) => b.classList.toggle("selected", b === category));
    renderSongs();
    return;
  }
  const mix = e.target.closest("[data-mix]");
  if (mix) {
    setView("explorar");
    filter =
      mix.dataset.mix === "energia"
        ? "Rock"
        : mix.dataset.mix === "noche"
          ? "Alternativo"
          : "Pop";
    document
      .querySelectorAll("[data-filter]")
      .forEach((b) =>
        b.classList.toggle("selected", b.dataset.filter === filter),
      );
    $("#catalog-title").textContent =
      mix.dataset.mix === "energia"
        ? "A todo volumen"
        : mix.dataset.mix === "noche"
          ? "Modo noche"
          : "Sin prisa";
    renderSongs();
    return;
  }
  const playlist = e.target.closest("[data-playlist]");
  if (playlist) {
    selectedPlaylist = playlists[Number(playlist.dataset.playlist)];
    setView("playlist");
    return;
  }
  if (e.target.closest(".account-trigger")) {
    window.FekaCloud?.open?.();
    if (!window.FekaCloud) $("#account-dialog").showModal();
  }
  if (e.target.closest(".dialog-close")) e.target.closest("dialog").close();
  if (e.target.closest(".favorite-current")) favorite(current);
});
function searchCatalog() {
  const query = $("#search").value;
  if (view !== "explorar" && query.trim()) {
    setView("explorar");
    $("#search").value = query;
  }
  if (view === "explorar") {
    $("#catalog-title").textContent = query.trim()
      ? "Resultados de búsqueda"
      : "Explora el catálogo";
  }
  renderSongs();
}
$("#search").addEventListener("input", () => {
  window.FekaSearch?.cancel();
  remoteSearchResults = null;
  remoteQuery = "";
  remoteError = "";
  remoteBusy = false;
  searchCatalog();
});
$("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  window.FekaSearch?.submit();
});
$("#search").addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    $("#search").value = "";
    window.FekaSearch?.cancel();
    remoteSearchResults = null;
    remoteQuery = "";
    remoteError = "";
    remoteBusy = false;
    searchCatalog();
  }
});
$("#see-all").addEventListener("click", () => setView("explorar"));
$("#new-playlist").addEventListener("click", () =>
  $("#playlist-dialog").showModal(),
);
$("#playlist-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#playlist-name").value.trim();
  if (!name) {
    $("#playlist-name").setCustomValidity(
      "Escribe un nombre para la playlist.",
    );
    $("#playlist-name").reportValidity();
    return;
  }
  $("#playlist-name").setCustomValidity("");
  playlists.push({ name, ids: [...favorites] });
  save(
    "fekamusic.playlists",
    playlists.map((p) => ({ ...p, ids: p.ids.map((i) => songs[i].id) })),
  );
  renderPlaylists();
  $("#playlist-dialog").close();
  $("#playlist-name").value = "";
  selectedPlaylist = playlists.at(-1);
  setView("playlist");
  toast("Playlist creada en este navegador.");
});
$("#playlist-name").addEventListener("input", () =>
  $("#playlist-name").setCustomValidity(""),
);
$("#toggle-play").addEventListener("click", togglePlayback);
$("#video-start").addEventListener("click", () => playTrack(current));
$("#previous").addEventListener("click", () =>
  playTrack((current + songs.length - 1) % songs.length),
);
$("#next").addEventListener("click", () => advanceTrack({ automatic: false }));
$("#shuffle").addEventListener("click", () => {
  shuffled = !shuffled;
  $("#shuffle").setAttribute("aria-pressed", String(shuffled));
  $("#shuffle").classList.toggle("is-saved", shuffled);
  toast(
    shuffled
      ? "Reproducción aleatoria activada."
      : "Reproducción en orden activada.",
  );
});
$("#show-player").addEventListener("click", showPlayer);
$("#queue-toggle").addEventListener("click", showPlayer);
function paintPlayerRange(input) {
  input.style.setProperty("--range-fill", `${Number(input.value)}%`);
}
$("#volume").addEventListener("input", (e) => {
  paintPlayerRange(e.target);
  player?.setVolume?.(Number(e.target.value));
});
$("#seek").addEventListener("input", (e) => {
  paintPlayerRange(e.target);
  const duration = player?.getDuration?.();
  if (duration) player.seekTo((Number(e.target.value) / 100) * duration, true);
});
function formatTime(seconds) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}
setInterval(() => {
  if (!player?.getCurrentTime) return;
  const position = player.getCurrentTime() || 0,
    duration = player.getDuration() || 0;
  $("#elapsed").textContent = formatTime(position);
  $("#duration").textContent = duration ? formatTime(duration) : "—:—";
  $("#seek").value = duration ? (position / duration) * 100 : 0;
  paintPlayerRange($("#seek"));
}, 1000);
$("#theme-toggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  save("fekamusic.dark", document.body.classList.contains("dark"));
});
document.addEventListener("keydown", (e) => {
  if (
    e.key === "/" &&
    !/INPUT|TEXTAREA/.test(document.activeElement.tagName) &&
    !document.querySelector("dialog[open]")
  ) {
    e.preventDefault();
    $("#search").focus();
  }
});
document.querySelectorAll('a[href="#inicio"]').forEach((a) =>
  a.addEventListener("click", (e) => {
    e.preventDefault();
    setView("inicio");
  }),
);
document.querySelectorAll("dialog").forEach((dialog) =>
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        dialog.close();
    }
  }),
);
if (readStore("fekamusic.dark", false)) document.body.classList.add("dark");
renderSongs();
renderQueue();
renderPlaylists();
renderDiscovery();
// Only remove the prototype's duplicate badge, never the official iframe branding.
$(".youtube-label")?.remove();
const playerActions = document.createElement("div");
playerActions.className = "player-window-actions";
$(".now-header").append(playerActions);
const minimizeVideo = document.createElement("button");
minimizeVideo.className = "icon-button minimize-video";
minimizeVideo.id = "minimize-video";
minimizeVideo.type = "button";
minimizeVideo.setAttribute("aria-label", "Minimizar reproductor");
minimizeVideo.setAttribute("aria-controls", "now-playing");
minimizeVideo.setAttribute("aria-pressed", "false");
minimizeVideo.textContent = "−";
playerActions.append(minimizeVideo);
minimizeVideo.addEventListener("click", () =>
  setPlayerCompact(!$("#now-playing").classList.contains("is-minimized")),
);
const closeVideo = document.createElement("button");
closeVideo.className = "icon-button close-video";
closeVideo.id = "close-video";
closeVideo.type = "button";
closeVideo.setAttribute("aria-label", "Cerrar video y pausar");
closeVideo.innerHTML = icon("close");
playerActions.append(closeVideo);
closeVideo.addEventListener("click", () => {
  player?.pauseVideo?.();
  setPlaying(false);
  setPlayerCompact(false);
  $("#now-playing").classList.remove("is-open", "has-video");
  $("#now-playing").classList.add("is-closed");
  $("#show-player").focus();
});

// Local discovery uses listening time and private favorites, never public popularity.
function listeningHistory() {
  const data = readStore("fekamusic.history", []);
  return Array.isArray(data)
    ? data
        .filter(
          (h) => h && songs.some((s) => s.id === h.id) && Number.isFinite(h.at),
        )
        .slice(0, 100)
    : [];
}
function preferredGenres() {
  const data = readStore("fekamusic.genres", []);
  return Array.isArray(data)
    ? data.filter((g) => MUSIC_GENRES.includes(g))
    : [];
}
function recommendationIndices(exclude = current) {
  const weights = new Map(preferredGenres().map((g) => [g, 4]));
  favorites.forEach((i) => {
    if (songs[i].genre !== "Sin clasificar")
      weights.set(songs[i].genre, (weights.get(songs[i].genre) || 0) + 2);
  });
  listeningHistory()
    .slice(0, 20)
    .forEach((h) => {
      const s = songs.find((s) => s.id === h.id);
      if (s && s.genre !== "Sin clasificar")
        weights.set(s.genre, (weights.get(s.genre) || 0) + 1);
    });
  return songs
    .map((s, i) => ({
      i,
      score:
        (weights.get(s.genre) || 0) +
        (s.genre !== "Sin clasificar" && s.genre === songs[current].genre
          ? 1
          : 0) -
        (s.artist === songs[current].artist ? 2 : 0),
    }))
    .filter((s) => s.i !== exclude)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((s) => s.i);
}
function queueIndices() {
  const radioIndices = window.FekaRadio?.indices();
  if (radioIndices !== null && radioIndices !== undefined) return radioIndices;
  if (homeTrendingIndices?.includes(current)) {
    const pos = homeTrendingIndices.indexOf(current);
    return [1, 2, 3]
      .map((n) => homeTrendingIndices[(pos + n) % homeTrendingIndices.length])
      .filter((i) => i !== current);
  }
  return recommendationIndices().slice(0, 3);
}
async function advanceTrack({ automatic = true } = {}) {
  const origin = current;
  await window.FekaRadio?.ready();
  if (current !== origin || $("#now-playing").classList.contains("is-closed"))
    return;
  if (window.FekaRadio?.active) {
    const next =
      automatic && !window.FekaRadio.enabled ? null : window.FekaRadio.next();
    if (next) playTrack(songIndex(next.id), { automatic: true });
    else {
      setPlaying(false);
      player?.pauseVideo?.();
      $("#playback-status").textContent = window.FekaRadio.enabled
        ? "La radio llegó al final. Elige otra canción para continuar."
        : "Continuación automática desactivada.";
    }
    return;
  }
  playTrack(nextTrackIndex(), { automatic: true });
}
function nextTrackIndex() {
  return shuffled
    ? (current + 1 + Math.floor(Math.random() * (songs.length - 1))) %
        songs.length
    : (queueIndices()[0] ?? (current + 1) % songs.length);
}
function renderDiscovery() {
  let section = $("#discovery");
  if (!section) {
    section = document.createElement("section");
    section.id = "discovery";
    section.className = "discovery-section";
    $("#moods-section").before(section);
  }
  section.hidden = view !== "inicio" || Boolean(window.FekaHome);
  section.innerHTML = `<div class="section-heading"><div><p class="eyebrow">TU PRÓXIMA CONEXIÓN</p><h2>Descubre a tu ritmo</h2></div></div><p class="feature-note">Afinidad por género y variedad de artistas, dentro de esta selección de muestra.</p><div class="discovery-list">${recommendationIndices(
    -1,
  )
    .slice(0, 3)
    .map(
      (i) =>
        `<button class="discovery-track" data-play="${i}"><img src="${escapeHtml(songs[i].cover)}" alt=""><span><strong>${escapeHtml(songs[i].title)}</strong><small>${escapeHtml(songs[i].artist)} · ${escapeHtml(songs[i].genre)}</small></span></button>`,
    )
    .join(
      "",
    )}</div><div class="feature-tools"><button data-choose-tastes>Elegir mis géneros</button><button data-open-history>Mi historial</button></div>`;
}
function beginListening() {
  const panel = $("#now-playing");
  if (panel.dataset.listening === songs[current].id) return;
  panel.dataset.listening = songs[current].id;
  // Count 30 seconds actually playing. Seeking or one accidental click is insufficient.
  let elapsed = 0;
  const id = songs[current].id;
  const timer = setInterval(() => {
    if (songs[current].id !== id) {
      clearInterval(timer);
      return;
    }
    if (playing) elapsed++;
    if (elapsed >= 30) {
      clearInterval(timer);
      const entries = listeningHistory();
      entries.unshift({ id, at: Date.now() });
      save("fekamusic.history", entries.slice(0, 100));
      renderDiscovery();
      renderQueue();
    }
  }, 1000);
}
function exportLibrary() {
  return {
    version: 1,
    tracks: songs
      .slice(6)
      .filter(
        (s) =>
          favorites.has(songs.indexOf(s)) ||
          playlists.some((p) => p.ids.includes(songs.indexOf(s))) ||
          listeningHistory().some((h) => h.id === s.id),
      ),
    favorites: [...favorites].map((i) => songs[i].id),
    playlists: playlists.map((p) => ({
      name: p.name,
      ids: p.ids.map((i) => songs[i]?.id).filter(Boolean),
    })),
    history: listeningHistory(),
    genres: preferredGenres(),
  };
}
function importLibrary(data) {
  data = FekaData.normalizeLibrary(data, MUSIC_GENRES);
  if (Array.isArray(data.tracks)) rememberTracks(data.tracks);
  const index = (id) => songs.findIndex((s) => s.id === id);
  favorites = new Set(data.favorites.map(index).filter((i) => i >= 0));
  playlists = data.playlists
    .filter((p) => p && typeof p.name === "string" && Array.isArray(p.ids))
    .slice(0, 100)
    .map((p) => ({
      name: p.name.slice(0, 48),
      ids: [...new Set(p.ids.map(index).filter((i) => i >= 0))],
    }));
  save(
    "fekamusic.favorites",
    [...favorites].map((i) => songs[i].id),
  );
  save(
    "fekamusic.playlists",
    playlists.map((p) => ({ ...p, ids: p.ids.map((i) => songs[i].id) })),
  );
  save(
    "fekamusic.history",
    Array.isArray(data.history) ? data.history.slice(0, 100) : [],
  );
  save("fekamusic.genres", Array.isArray(data.genres) ? data.genres : []);
  selectedPlaylist = null;
  setView("biblioteca");
  renderPlaylists();
  renderDiscovery();
  renderQueue();
}
window.FekaLibrary = { export: exportLibrary, import: importLibrary };
$("#filters").innerHTML =
  '<button class="chip selected" data-filter="Todas">Para ti</button>' +
  MUSIC_GENRES.map(
    (g) =>
      `<button class="chip" data-filter="${escapeHtml(g)}">${escapeHtml(g)}</button>`,
  ).join("");
const tasteDialog = document.createElement("dialog");
tasteDialog.id = "taste-dialog";
tasteDialog.innerHTML = `<button class="dialog-close icon-button" aria-label="Cerrar preferencias">${icon("close")}</button><h2>Encuentra tu frecuencia.</h2><p>Elige varios géneros. Puedes cambiarlos cuando quieras.</p><form id="taste-form"><div class="taste-options">${MUSIC_GENRES.map((g) => `<label><input type="checkbox" name="genre" value="${g}">${g}</label>`).join("")}</div><div class="feature-tools"><button class="primary-button" type="submit">Guardar mis gustos</button></div></form>`;
document.body.append(tasteDialog);
const historyDialog = document.createElement("dialog");
historyDialog.id = "history-dialog";
historyDialog.innerHTML = `<button class="dialog-close icon-button" aria-label="Cerrar historial">${icon("close")}</button><h2>Lo que va contigo.</h2><p class="feature-note">Guardamos una escucha tras 30 segundos de reproducción. Hasta 100 escuchas en este dispositivo.</p><div id="history-list"></div><div class="feature-tools"><button id="clear-history">Borrar historial y reiniciar gustos</button></div>`;
document.body.append(historyDialog);
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-choose-tastes]")) {
    tasteDialog
      .querySelectorAll("input")
      .forEach((i) => (i.checked = preferredGenres().includes(i.value)));
    tasteDialog.showModal();
  }
  if (e.target.closest("[data-open-history]")) {
    const entries = listeningHistory();
    $("#history-list").innerHTML = entries.length
      ? entries
          .slice(0, 15)
          .map((h) => {
            const s = songs.find((s) => s.id === h.id);
            return `<p>${escapeHtml(s.title)} · ${escapeHtml(s.artist)}</p>`;
          })
          .join("")
      : "<p>Aquí aparecerán tus próximas escuchas.</p>";
    historyDialog.showModal();
  }
  if (e.target.closest("#clear-history")) {
    save("fekamusic.history", []);
    save("fekamusic.genres", []);
    $("#history-list").textContent =
      "Historial y géneros reiniciados. Tus favoritos se conservan.";
    renderDiscovery();
    renderQueue();
  }
});
$("#taste-form").addEventListener("submit", (e) => {
  e.preventDefault();
  save(
    "fekamusic.genres",
    [...tasteDialog.querySelectorAll("input:checked")].map((i) => i.value),
  );
  renderDiscovery();
  renderQueue();
  tasteDialog.close();
  toast("Tus gustos ya forman parte de la selección.");
});
const originalSetView = setView;
setView = function (next) {
  originalSetView(next);
  renderDiscovery();
  window.FekaHome?.render();
};

function rememberTracks(items, persist = true) {
  if (!Array.isArray(items)) return [];
  const indices = [];
  for (const value of items.slice(0, 1000)) {
    const item = FekaData.normalizeTrack(value, MUSIC_GENRES);
    if (!item) continue;
    let i = songs.findIndex((s) => s.id === item.id);
    if (i < 0) {
      i = songs.length;
      songs.push(item);
    } else if (i >= 6) {
      Object.assign(songs[i], item);
    }
    indices.push(i);
  }
  if (persist) save("fekamusic.remoteTracks", songs.slice(6));
  return indices;
}
