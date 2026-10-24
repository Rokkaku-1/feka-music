(() => {
  const dialog = document.querySelector("#install-dialog");
  const button = document.querySelector("#install-confirm");
  const status = document.querySelector("#install-status");
  const standalone = matchMedia("(display-mode: standalone)");
  let deferred = null,
    installed = false;
  function render() {
    const isInstalled =
      installed || standalone.matches || navigator.standalone === true;
    button.hidden = isInstalled || !deferred;
    document.querySelector("#install-help").hidden = isInstalled;
    status.textContent = isInstalled
      ? "Ya estás usando Feka Music como app."
      : deferred
        ? "Tu navegador está listo. Pulsa Instalar ahora para continuar."
        : "Si no aparece el botón de instalación, sigue los pasos de tu navegador.";
    document.querySelectorAll("[data-install-open]").forEach((el) => {
      if (isInstalled) el.textContent = "App instalada";
    });
  }
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event;
    render();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    render();
  });
  standalone.addEventListener("change", render);
  document.querySelectorAll("[data-install-open]").forEach((el) =>
    el.addEventListener("click", () => {
      render();
      dialog.showModal();
    }),
  );
  button.addEventListener("click", async () => {
    if (!deferred) return;
    const prompt = deferred;
    deferred = null;
    button.disabled = true;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      render();
      status.textContent =
        choice.outcome === "accepted"
          ? "Instalación solicitada. Tu navegador completará el proceso."
          : "Puedes instalarla después desde el menú de tu navegador.";
    } catch {
      render();
      status.textContent =
        "No se pudo abrir la instalación. Usa el menú de tu navegador.";
    } finally {
      button.disabled = false;
    }
  });
  render();
  if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", () =>
      navigator.serviceWorker.register("./sw.js").catch(() => {
        status.textContent =
          "No se pudo preparar la app. Recarga la página o usa el menú de tu navegador.";
      }),
    );
  }
})();
