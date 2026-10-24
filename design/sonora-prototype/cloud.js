/* Optional account integration. Guest listening always works without Supabase. */
(() => {
  const config = window.FekaConfig || {};
  const configured = Boolean(
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl) &&
    config.supabasePublishableKey,
  );
  const dialog = document.querySelector("#account-dialog");
  let clientPromise,
    session = null,
    mode = "login",
    busy = false,
    revision = null;
  dialog.innerHTML = `<button class="dialog-close icon-button" aria-label="Cerrar cuenta">${icon("close")}</button><span class="brand dialog-brand">feka music<span class="brand-dot">.</span></span><h2>Tu música.<br>Tu propio espacio.</h2><p>Escuchar es libre. La cuenta es opcional para guardar tu biblioteca en otros dispositivos.</p><div id="account-status" role="status"></div><div id="account-access"><div class="account-tabs"><button type="button" data-account-mode="login" aria-pressed="true">Entrar</button><button type="button" data-account-mode="signup" aria-pressed="false">Crear cuenta</button></div><form class="account-form" id="account-form"><label>Correo electrónico<input type="email" id="account-email" required autocomplete="email"></label><label>Contraseña<input type="password" id="account-password" required minlength="8" autocomplete="current-password"></label><button class="primary-button" type="submit">Iniciar sesión</button></form></div><div id="account-session" class="account-session" hidden><p id="account-identity"></p><p class="feature-note">Guarda esta biblioteca o carga la de tu cuenta. Cargar sustituye la selección de este dispositivo. Puedes descargar una copia antes.</p><div class="feature-tools"><button data-action="upload">Guardar biblioteca en mi cuenta</button><button data-action="download">Cargar biblioteca de mi cuenta</button><button data-action="backup">Descargar copia local</button><button data-action="logout">Cerrar sesión</button></div><p class="feature-note">Al cerrar sesión, la biblioteca local permanece en este dispositivo.</p></div><button class="text-button dialog-close">Seguir escuchando sin cuenta</button>`;
  const status = (message) => {
    document.querySelector("#account-status").textContent = message;
  };
  function render() {
    document.querySelector("#account-access").hidden = !!session;
    document.querySelector("#account-session").hidden = !session;
    document.querySelector("#account-identity").textContent =
      session?.user?.email || "";
    dialog
      .querySelectorAll("input,button:not(.dialog-close)")
      .forEach(
        (b) =>
          (b.disabled =
            busy || (!configured && !b.classList.contains("dialog-close"))),
      );
  }
  async function client() {
    if (!configured)
      throw new Error(
        "La cuenta estará disponible cuando conectemos Supabase. Puedes seguir escuchando sin registrarte.",
      );
    if (!clientPromise)
      clientPromise = Promise.resolve(window.supabase)
        .then(({ createClient }) => {
          const c = createClient(
            config.supabaseUrl,
            config.supabasePublishableKey,
            {
              auth: {
                storageKey: "fekamusic.auth",
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
              },
            },
          );
          c.auth.onAuthStateChange((_event, next) => {
            session = next;
            revision = null;
            render();
          });
          return c;
        })
        .catch(() => {
          clientPromise = null;
          throw new Error(
            "No pudimos cargar la conexión. Revisa tu conexión e inténtalo de nuevo.",
          );
        });
    return clientPromise;
  }
  async function action(fn) {
    if (busy) return;
    busy = true;
    render();
    try {
      await fn();
    } catch (error) {
      status(error.message || "No se pudo completar la operación.");
    } finally {
      busy = false;
      render();
    }
  }
  async function getLibrary(c) {
    if (!session) throw new Error("Inicia sesión de nuevo.");
    const { data, error } = await c
      .from("music_libraries")
      .select("document,revision")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (error)
      throw new Error(
        "No pudimos leer tu biblioteca. Comprueba la conexión y la migración de Supabase.",
      );
    revision = data?.revision || 0;
    return data;
  }
  window.FekaCloud = {
    open: async () => {
      dialog.showModal();
      status(
        configured
          ? "Conectando tu cuenta…"
          : "Supabase todavía no está conectado. Tu música y biblioteca local siguen disponibles.",
      );
      render();
      if (configured)
        await action(async () => {
          const c = await client();
          const { data, error } = await c.auth.getSession();
          if (error) throw error;
          session = data.session;
          status(
            session
              ? "Tu cuenta está disponible."
              : "Entra o crea una cuenta para sincronizar tu biblioteca.",
          );
        });
    },
  };
  dialog.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-account-mode]");
    if (tab) {
      mode = tab.dataset.accountMode;
      dialog
        .querySelectorAll("[data-account-mode]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === tab)));
      document.querySelector("#account-password").autocomplete =
        mode === "signup" ? "new-password" : "current-password";
      document.querySelector("#account-form button").textContent =
        mode === "signup" ? "Crear mi cuenta" : "Iniciar sesión";
    }
    const button = e.target.closest("[data-action]");
    if (!button) return;
    action(async () => {
      if (button.dataset.action === "backup") {
        const blob = new Blob(
          [JSON.stringify(window.FekaLibrary.export(), null, 2)],
          { type: "application/json" },
        );
        const url = URL.createObjectURL(blob),
          a = document.createElement("a");
        a.href = url;
        a.download = "feka-music-biblioteca.json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
      }
      const c = await client();
      if (button.dataset.action === "download") {
        const row = await getLibrary(c);
        if (!row) {
          status("Todavía no hay una biblioteca guardada en tu cuenta.");
          return;
        }
        window.FekaLibrary.import(row.document);
        status("Biblioteca cargada en este dispositivo.");
      }
      if (button.dataset.action === "upload") {
        // Read first to avoid silently overwriting a library from another device.
        if (revision === null) {
          const row = await getLibrary(c);
          if (row) {
            status(
              "Ya existe una biblioteca en tu cuenta. Cárgala antes de editar y guardar para evitar reemplazarla accidentalmente.",
            );
            return;
          }
        }
        const row = {
          user_id: session.user.id,
          document: window.FekaLibrary.export(),
          revision: revision + 1,
          updated_at: new Date().toISOString(),
        };
        const result =
          revision === 0
            ? await c
                .from("music_libraries")
                .insert(row)
                .select("revision")
                .single()
            : await c
                .from("music_libraries")
                .update(row)
                .eq("user_id", session.user.id)
                .eq("revision", revision)
                .select("revision")
                .maybeSingle();
        if (result.error || !result.data) {
          revision = null;
          throw new Error(
            "No se guardó: la biblioteca pudo cambiar en otro dispositivo o hubo un error. Descarga una copia local y vuelve a cargar la de tu cuenta.",
          );
        }
        revision = result.data.revision;
        status("Biblioteca guardada en tu cuenta.");
      }
      if (button.dataset.action === "logout") {
        const { error } = await c.auth.signOut();
        if (error) throw error;
        session = null;
        revision = null;
        status(
          "Sesión cerrada. La biblioteca local permanece en este dispositivo.",
        );
      }
    });
  });
  document.querySelector("#account-form").addEventListener("submit", (e) => {
    e.preventDefault();
    action(async () => {
      const c = await client();
      const credentials = {
        email: document.querySelector("#account-email").value.trim(),
        password: document.querySelector("#account-password").value,
      };
      const { data, error } =
        mode === "signup"
          ? await c.auth.signUp({
              ...credentials,
              options: { emailRedirectTo: location.origin + location.pathname },
            })
          : await c.auth.signInWithPassword(credentials);
      if (error)
        throw new Error(
          mode === "signup"
            ? "No pudimos crear tu cuenta. Revisa los datos o inténtalo más tarde."
            : "No pudimos iniciar sesión. Revisa tu correo, contraseña y confirmación del correo.",
        );
      session = data.session;
      document.querySelector("#account-password").value = "";
      status(
        session
          ? "Ya estás dentro. Puedes guardar o cargar tu biblioteca."
          : "Revisa tu correo para confirmar la cuenta antes de entrar.",
      );
    });
  });
  dialog.addEventListener("close", () => {
    document.querySelector("#account-password").value = "";
  });
  render();
})();
