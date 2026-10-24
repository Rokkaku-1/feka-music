export function validateRequest(request) {
  if (request.method !== "GET") return 405;
  if (request.url.length > 2048) return 414;
  const url = new URL(request.url);
  const allowed = new Set(["q", "mode", "seed"]);
  for (const key of url.searchParams.keys()) {
    if (!allowed.has(key) || url.searchParams.getAll(key).length !== 1)
      return 400;
  }
  if (request.headers.get("x-feka-search") !== "1") return 403;
  if (request.headers.get("sec-fetch-site") === "cross-site") return 403;
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return 403;
  return null;
}

export function rejected(status) {
  return new Response(
    JSON.stringify({
      error:
        status === 429
          ? "Espera un momento antes de volver a buscar."
          : "Solicitud no permitida.",
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        ...(status === 405 ? { Allow: "GET" } : {}),
      },
    },
  );
}
