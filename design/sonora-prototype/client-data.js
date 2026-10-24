(() => {
  const validId = (value) =>
    typeof value === "string" && /^[-_a-zA-Z0-9]{11}$/.test(value);
  const text = (value, max) =>
    String(value)
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .slice(0, max);
  function normalizeTrack(value, genres = [], now = Date.now()) {
    if (
      !value ||
      !validId(value.id) ||
      typeof value.title !== "string" ||
      typeof value.artist !== "string"
    )
      return null;
    const fetchedAt = Number.isFinite(value.fetchedAt)
      ? Math.min(value.fetchedAt, now)
      : now;
    const expired = now - fetchedAt > 30 * 86400000;
    return {
      id: value.id,
      title: expired ? "Canción guardada" : text(value.title, 220),
      artist: expired ? "Metadatos pendientes" : text(value.artist, 160),
      genre:
        !expired && genres.includes(value.genre)
          ? value.genre
          : "Sin clasificar",
      cover: "https://i.ytimg.com/vi/" + value.id + "/hqdefault.jpg",
      fetchedAt,
    };
  }
  function normalizeLibrary(value, genres = []) {
    if (
      !value ||
      value.version !== 1 ||
      !Array.isArray(value.favorites) ||
      !Array.isArray(value.playlists) ||
      JSON.stringify(value).length > 262144
    )
      throw new Error("Biblioteca no compatible o demasiado grande.");
    const ids = (array) =>
      Array.isArray(array)
        ? [...new Set(array.filter(validId))].slice(0, 1000)
        : [];
    return {
      version: 1,
      tracks: Array.isArray(value.tracks)
        ? value.tracks
            .slice(0, 1000)
            .map((v) => normalizeTrack(v, genres))
            .filter(Boolean)
        : [],
      favorites: ids(value.favorites),
      playlists: value.playlists
        .slice(0, 100)
        .filter((p) => p && typeof p.name === "string" && Array.isArray(p.ids))
        .map((p) => ({ name: text(p.name, 48), ids: ids(p.ids) })),
      history: Array.isArray(value.history)
        ? value.history
            .slice(0, 100)
            .filter(
              (h) =>
                h &&
                validId(h.id) &&
                Number.isFinite(h.at) &&
                h.at > 0 &&
                h.at <= Date.now() + 60000,
            )
            .map((h) => ({ id: h.id, at: h.at }))
        : [],
      genres: Array.isArray(value.genres)
        ? [...new Set(value.genres.filter((g) => genres.includes(g)))]
        : [],
    };
  }
  const escapeHtml = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const api = { validId, normalizeTrack, normalizeLibrary, escapeHtml };
  if (typeof module !== "undefined") module.exports = api;
  else window.FekaData = Object.freeze(api);
})();
