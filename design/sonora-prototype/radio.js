(() => {
  const radio = FekaRadioCore.createRadioQueue();
  let pending = Promise.resolve(),
    request = null,
    enabled = true,
    message = "Elige una canción para crear su radio.";
  const info = document.createElement("div");
  info.className = "radio-info";
  info.innerHTML =
    '<label><input type="checkbox" id="radio-enabled" checked> Continuación automática</label><p id="radio-status" role="status"></p><button class="text-button" id="sound-settings">Ajustes de sonido</button>';
  document.querySelector(".queue-heading").before(info);
  const sound = document.createElement("dialog");
  sound.id = "sound-dialog";
  sound.setAttribute("aria-labelledby", "sound-title");
  sound.innerHTML =
    '<button class="dialog-close icon-button" aria-label="Cerrar ajustes de sonido">' +
    icon("close") +
    '</button><h2 id="sound-title">Tu sonido.</h2><label for="sound-volume">Volumen <output id="sound-volume-value">70 %</output></label><input id="sound-volume" type="range" min="0" max="100" value="70"><label><input type="checkbox" id="sound-radio-enabled" checked> Continuación automática</label><h3>Ecualizador</h3><p>YouTube no permite ajustar graves, medios o agudos desde su reproductor integrado. Puedes usar el ecualizador de tu dispositivo si dispone de uno.</p><p class="feature-note">El volumen sí controla este reproductor. La radio usa la temática que identifica YouTube; puede no coincidir con un género exacto.</p>';
  document.body.append(sound);
  function render() {
    $("#radio-status").textContent = enabled
      ? message
      : "Continuación automática desactivada.";
    $("#radio-enabled").checked = enabled;
    $("#sound-radio-enabled").checked = enabled;
    renderQueue();
  }
  function localCandidates(seed) {
    return songs.filter(
      (s) =>
        seed.genre !== "Sin clasificar" &&
        s.genre === seed.genre &&
        s.id !== seed.id,
    );
  }
  function start(seed) {
    request?.abort();
    request = new AbortController();
    const ticket = radio.start(seed);
    radio.install(localCandidates(seed), ticket);
    message = "Preparando radio de " + seed.artist + "…";
    render();
    const endpoint =
      ["localhost", "127.0.0.1"].includes(location.hostname) &&
      location.port === "5500"
        ? "http://localhost:4186/.netlify/functions/youtube-search"
        : "/api/music";
    pending = (async () => {
      try {
        const response = await fetch(
          endpoint + "?mode=radio&seed=" + encodeURIComponent(seed.id),
          { headers: { "X-Feka-Search": "1" }, signal: request.signal },
        );
        const data = await response.json();
        if (ticket !== radio.revision) return;
        if (!response.ok || response.status === 202)
          throw new Error("Unavailable");
        const indices = rememberTracks(data.items || []);
        const merged = [
          ...indices.map((i) => songs[i]),
          ...localCandidates(seed),
        ];
        // Shuffle candidates once per station, preserving its original reference.
        for (let i = merged.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [merged[i], merged[j]] = [merged[j], merged[i]];
        }
        radio.install(merged, ticket);
        message =
          "Radio de " +
          seed.artist +
          " · " +
          (data.items?.[0]?.radioTopic || seed.genre) +
          ". Se priorizan otros canales/artistas.";
        if (!radio.peek(seed, 1).length)
          message =
            "No hay otros temas compatibles disponibles para esta canción. Elige otra para cambiar de radio.";
      } catch (error) {
        if (ticket !== radio.revision) return;
        message = radio.peek(seed, 1).length
          ? "Radio de " + seed.artist + " · selección compatible guardada."
          : "No pudimos preparar temas similares. Elige otra canción o vuelve a intentarlo.";
      } finally {
        if (ticket === radio.revision) render();
      }
    })();
  }
  for (const id of ["radio-enabled", "sound-radio-enabled"])
    $("#" + id).addEventListener("change", (e) => {
      enabled = e.target.checked;
      render();
    });
  const openSound = () => {
    const value = $("#volume").value;
    $("#sound-volume").value = value;
    $("#sound-volume-value").value = value + " %";
    sound.showModal();
  };
  $("#sound-settings").addEventListener("click", openSound);
  const soundButton = document.createElement("button");
  soundButton.className = "icon-button";
  soundButton.setAttribute("aria-label", "Abrir ajustes de sonido");
  soundButton.innerHTML =
    '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 3v18m7-18v18m7-18v18M2 8h6m1 8h6m1-10h6"/></svg>';
  document.querySelector(".top-actions").prepend(soundButton);
  soundButton.addEventListener("click", openSound);
  $("#sound-volume").addEventListener("input", (e) => {
    $("#volume").value = e.target.value;
    $("#volume").dispatchEvent(new Event("input", { bubbles: true }));
    $("#sound-volume-value").value = e.target.value + " %";
  });
  window.FekaRadio = {
    start,
    record: (track) => {
      radio.record(track);
      render();
    },
    indices: () =>
      radio.seed
        ? radio.peek(songs[current], 3).map((track) => songIndex(track.id))
        : null,
    ready: () => pending,
    next: () => {
      if (!radio.seed) return null;
      const pool = radio.peek(songs[current], shuffled ? 100 : 1);
      return shuffled ? pool[Math.floor(Math.random() * pool.length)] : pool[0];
    },
    get active() {
      return Boolean(radio.seed);
    },
    get enabled() {
      return enabled;
    },
  };
  render();
})();
