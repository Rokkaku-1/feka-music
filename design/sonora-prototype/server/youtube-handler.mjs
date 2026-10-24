import { createHash } from "node:crypto";
const respond = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  },
  body: JSON.stringify(body),
});
export async function handler(event, context = {}) {
  if (event.httpMethod !== "GET")
    return respond(405, { error: "Método no permitido." });
  const parameters = event.queryStringParameters || {};
  if (parameters.mode && !["radio", "trending"].includes(parameters.mode))
    return respond(400, { error: "Modo no válido." });
  if (parameters.q !== undefined && typeof parameters.q !== "string")
    return respond(400, { error: "Consulta no válida." });
  const radio = event.queryStringParameters?.mode === "radio";
  const seed = event.queryStringParameters?.seed || "";
  if (radio && !/^[\w-]{11}$/.test(seed))
    return respond(400, { error: "Canción inicial no válida." });
  const trending = event.queryStringParameters?.mode === "trending";
  const query = (
    radio
      ? "feka-radio-v2-" + seed
      : trending
        ? "feka-trending-pe-us-kr-v1"
        : event.queryStringParameters?.q || ""
  )
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es");
  if (query.length < 2 || query.length > 120)
    return respond(400, { error: "Escribe entre 2 y 120 caracteres." });
  const { YOUTUBE_API_KEY, SUPABASE_URL } = process.env;
  const serverKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (
    SUPABASE_URL &&
    !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(SUPABASE_URL)
  )
    return respond(503, { error: "Configuración de servidor no válida." });
  const localStore = context.searchStore;
  if (!YOUTUBE_API_KEY || (!localStore && (!SUPABASE_URL || !serverKey)))
    return respond(503, {
      code: "SEARCH_NOT_CONFIGURED",
      error: "La búsqueda de YouTube todavía no está configurada.",
    });
  const limit = Number(process.env.YOUTUBE_DAILY_SEARCH_LIMIT || 100);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100000)
    return respond(503, { error: "Configuración de cuota no válida." });
  const key = createHash("sha256")
    .update(
      JSON.stringify({
        mode: radio ? "radio" : trending ? "trending" : "search",
        q: query,
        type: "video",
        embeddable: true,
        maxResults: 20,
        version: 1,
      }),
    )
    .digest("hex");
  const db = async (path, options = {}) => {
    const authHeaders = serverKey.startsWith("sb_secret_")
      ? { apikey: serverKey }
      : { apikey: serverKey, Authorization: `Bearer ${serverKey}` };
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...options,
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Database unavailable");
    return response.status === 204 ? null : response.json();
  };
  const providerSignal = AbortSignal.timeout(8000);
  let claimed = false;
  try {
    const slot = localStore
      ? await localStore.claim(key, limit)
      : await db("rpc/claim_music_search", {
          method: "POST",
          body: JSON.stringify({ p_key: key, p_limit: limit }),
        });
    if (slot.status === "hit")
      return respond(200, { items: slot.results, cached: true });
    if (slot.status === "pending")
      return respond(202, {
        code: "SEARCH_PENDING",
        error:
          "Esta búsqueda ya se está procesando. Vuelve a intentarlo en unos segundos.",
      });
    if (slot.status === "quota")
      return respond(429, {
        code: "SEARCH_QUOTA",
        error:
          "Se alcanzó el límite de búsquedas de hoy. Puedes seguir reproduciendo las canciones disponibles.",
      });
    if (slot.status !== "claimed") throw new Error("Invalid claim");
    claimed = true;
    if (radio) {
      const getVideos = async (ids) => {
        const r = await fetch(
          "https://www.googleapis.com/youtube/v3/videos?" +
            new URLSearchParams({
              part: "snippet,status,topicDetails",
              id: ids,
              key: YOUTUBE_API_KEY,
            }),
          { signal: providerSignal },
        );
        if (!r.ok) throw new Error("Metadata unavailable");
        return (await r.json()).items || [];
      };
      const initial = (await getVideos(seed))[0];
      if (!initial) throw new Error("Missing seed");
      const allowed = [
        "Rock_music",
        "Hip_hop_music",
        "Pop_music",
        "Electronic_music",
        "Jazz",
        "Blues",
        "Classical_music",
        "Country_music",
        "Reggae",
        "Rhythm_and_blues",
        "Soul_music",
        "Christian_music",
        "Heavy_metal_music",
        "Music_of_Latin_America",
        "Independent_music",
      ];
      const topics = (initial.topicDetails?.topicCategories || []).filter((t) =>
        allowed.includes(t.split("/").pop()),
      );
      const topic = allowed.find((name) =>
        topics.some((t) => t.split("/").pop() === name),
      );
      const label = topic ? topic.replaceAll("_", " ") : "";
      let items = [];
      if (label) {
        const r = await fetch(
          "https://www.googleapis.com/youtube/v3/search?" +
            new URLSearchParams({
              part: "snippet",
              q: label + " songs",
              type: "video",
              videoCategoryId: "10",
              videoEmbeddable: "true",
              maxResults: "50",
              key: YOUTUBE_API_KEY,
            }),
          { signal: providerSignal },
        );
        if (!r.ok) throw new Error("Radio search unavailable");
        const candidates = (await r.json()).items || [];
        const ids = candidates
          .map((i) => i.id?.videoId)
          .filter((id) => /^[\w-]{11}$/.test(id) && id !== seed);
        const details = ids.length ? await getVideos(ids.join(",")) : [];
        items = details
          .filter(
            (i) =>
              i.id !== seed &&
              i.status?.embeddable &&
              i.snippet.channelId !== initial.snippet.channelId &&
              (i.topicDetails?.topicCategories || []).some(
                (t) => t.split("/").pop() === topic,
              ),
          )
          .map((i) => ({
            id: i.id,
            title: i.snippet.title,
            artist: i.snippet.channelTitle,
            genre: "Sin clasificar",
            radioTopic: label,
            seedArtist: initial.snippet.channelTitle,
          }));
      }
      if (localStore) await localStore.complete(key, items);
      else
        await db(`music_search_cache?cache_key=eq.${key}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            results: items,
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            lease_until: null,
          }),
        });
      claimed = false;
      return respond(200, { items, cached: false, usage: slot.used, limit });
    }
    if (trending) {
      const regions = ["PE", "US", "KR"];
      const responses = await Promise.all(
        regions.map((region) =>
          fetch(
            "https://www.googleapis.com/youtube/v3/videos?" +
              new URLSearchParams({
                part: "snippet,status,topicDetails",
                chart: "mostPopular",
                videoCategoryId: "10",
                regionCode: region,
                maxResults: "50",
                key: YOUTUBE_API_KEY,
              }),
            { signal: providerSignal },
          ),
        ),
      );
      if (responses.some((r) => !r.ok)) throw new Error("Trending unavailable");
      const data = await Promise.all(responses.map((r) => r.json()));
      const topics = {
        Pop_music: "Pop",
        Rock_music: "Rock",
        Independent_music: "Indie",
        Hip_hop_music: "Hip-hop / Rap",
        Electronic_music: "Electrónica",
        Jazz: "Jazz",
        Blues: "Blues",
        Classical_music: "Clásica",
        Country_music: "Country",
        Reggae: "Reggae",
        Rhythm_and_blues: "R&B / Soul",
        Soul_music: "R&B / Soul",
        Christian_music: "Cristiana / Góspel",
        Heavy_metal_music: "Metal",
      };
      const seen = new Set(),
        items = [];
      data.forEach((batch, n) =>
        (batch.items || []).forEach((i) => {
          if (
            !/^[\w-]{11}$/.test(i.id) ||
            seen.has(i.id) ||
            !i.status?.embeddable
          )
            return;
          seen.add(i.id);
          const genres = (i.topicDetails?.topicCategories || [])
            .map((t) => topics[t.split("/").pop()])
            .filter(Boolean);
          items.push({
            id: i.id,
            title: i.snippet.title,
            artist: i.snippet.channelTitle,
            genre: genres[0] || "Sin clasificar",
            regions: [regions[n]],
            source: "mostPopular",
          });
        }),
      );
      if (!items.length) throw new Error("No trending videos");
      if (localStore) await localStore.complete(key, items);
      else
        await db(`music_search_cache?cache_key=eq.${key}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            results: items,
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            lease_until: null,
          }),
        });
      claimed = false;
      return respond(200, { items, cached: false, usage: slot.used, limit });
    }
    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      videoEmbeddable: "true",
      maxResults: "20",
      key: YOUTUBE_API_KEY,
    });
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`,
      { signal: providerSignal },
    );
    if (!response.ok) {
      const failure = await response.json().catch(() => ({}));
      const reason = failure.error?.errors?.[0]?.reason;
      const quota = ["quotaExceeded", "dailyLimitExceeded"].includes(reason);
      return respond(quota ? 429 : 502, {
        code: quota ? "YOUTUBE_QUOTA" : "YOUTUBE_UNAVAILABLE",
        error: quota
          ? "Se agotó la cuota de búsquedas de YouTube de hoy."
          : "YouTube rechazó la búsqueda. Comprueba que la clave está habilitada para YouTube Data API v3 y permite llamadas de servidor.",
      });
    }
    const data = await response.json();
    const items = (data.items || [])
      .filter((i) => /^[\w-]{11}$/.test(i.id?.videoId || ""))
      .map((i) => ({
        id: i.id.videoId,
        title: i.snippet.title,
        artist: i.snippet.channelTitle,
        genre: "Sin clasificar",
        cover:
          i.snippet.thumbnails?.medium?.url ||
          i.snippet.thumbnails?.default?.url,
      }));
    if (localStore) await localStore.complete(key, items);
    else
      await db(`music_search_cache?cache_key=eq.${key}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          results: items,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          lease_until: null,
        }),
      });
    claimed = false;
    return respond(200, { items, cached: false, usage: slot.used, limit });
  } catch {
    return respond(502, {
      error: "No pudimos completar la búsqueda. Inténtalo más tarde.",
    });
  } finally {
    if (claimed)
      try {
        if (localStore) await localStore.release(key);
        else
          await db(`music_search_cache?cache_key=eq.${key}`, {
            method: "PATCH",
            headers: { Prefer: "return=minimal" },
            body: JSON.stringify({ lease_until: null }),
          });
      } catch {
        /* Lease expires automatically. */
      }
  }
}
