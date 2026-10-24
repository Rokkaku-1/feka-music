(() => {
  let request = null,
    version = 0;
  function cancel() {
    version++;
    request?.abort();
    request = null;
  }
  async function submit() {
    const typed = $("#search").value.trim();
    if (typed.length < 2) {
      toast("Escribe al menos dos caracteres para buscar.");
      return;
    }
    if (typed.length > 120) {
      toast("La búsqueda admite hasta 120 caracteres.");
      return;
    }
    if (remoteBusy) return;
    searchCatalog();
    cancel();
    const ticket = version;
    remoteQuery = typed.toLocaleLowerCase("es");
    remoteSearchResults = [];
    remoteError = "";
    remoteBusy = true;
    renderSongs();
    request = new AbortController();
    const timer = setTimeout(() => request?.abort(), 18000);
    const local = ["localhost", "127.0.0.1"].includes(location.hostname);
    const endpoint =
      local && location.port === "5500"
        ? "http://localhost:4186/.netlify/functions/youtube-search"
        : "/api/music";
    try {
      const response = await fetch(
        endpoint + "?q=" + encodeURIComponent(typed),
        { headers: { "X-Feka-Search": "1" }, signal: request.signal },
      );
      const data = await response.json();
      if (ticket !== version) return;
      if (!response.ok || response.status === 202)
        throw new Error(data.error || "No pudimos completar la búsqueda.");
      if (!Array.isArray(data.items))
        throw new Error("El servicio devolvió una respuesta no válida.");
      remoteSearchResults = rememberTracks(data.items);
      $("#catalog-title").textContent = "Resultados de YouTube";
      if (data.usage && data.limit && data.usage / data.limit >= 0.8)
        console.info("Feka Music: consumo de búsqueda por encima del 80 %.");
    } catch (error) {
      if (ticket === version) {
        remoteSearchResults = [];
        remoteError =
          error.name === "AbortError"
            ? "La búsqueda tardó demasiado. Puedes volver a intentarlo."
            : error instanceof TypeError
              ? "El servicio de búsqueda no está disponible. Inténtalo de nuevo más tarde."
              : error.message;
      }
    } finally {
      clearTimeout(timer);
      if (ticket === version) {
        remoteBusy = false;
        request = null;
        renderSongs();
      }
    }
  }
  window.FekaSearch = { submit, cancel };
})();
