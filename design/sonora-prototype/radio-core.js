(() => {
  const artistKey = (value) =>
    String(value)
      .toLocaleLowerCase("es")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/vevo$/g, "")
      .replace(/\b(topic|vevo|official|oficial|tema)\b/g, "")
      .replace(/[^a-z0-9]/g, "");
  function createRadioQueue() {
    let seed = null,
      candidates = [],
      played = new Set(),
      revision = 0;
    return {
      start(track) {
        seed = track;
        candidates = [];
        played = new Set([track.id]);
        return ++revision;
      },
      install(items, ticket) {
        if (ticket !== revision) return false;
        const unique = new Set();
        candidates = items.filter(
          (track) =>
            track.id !== seed.id &&
            artistKey(track.artist) !== artistKey(seed.artist) &&
            !unique.has(track.id) &&
            unique.add(track.id),
        );
        return true;
      },
      record(track) {
        played.add(track.id);
      },
      peek(current, limit = 3) {
        const available = candidates.filter((track) => !played.has(track.id));
        const different = available.filter(
          (track) => artistKey(track.artist) !== artistKey(current.artist),
        );
        return [
          ...different,
          ...available.filter((track) => !different.includes(track)),
        ].slice(0, limit);
      },
      get seed() {
        return seed;
      },
      get revision() {
        return revision;
      },
    };
  }
  if (typeof module !== "undefined")
    module.exports = { createRadioQueue, artistKey };
  else window.FekaRadioCore = { createRadioQueue, artistKey };
})();
