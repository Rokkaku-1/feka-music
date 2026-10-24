export default async function () {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url || ""))
    return new Response(null, { status: 503 });
  const now = new Date().toISOString();
  const headers = {
    apikey: key,
    ...(key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` }),
    Prefer: "return=minimal",
  };
  const response = await fetch(
    `${url}/rest/v1/music_search_cache?expires_at=lt.${now}&or=(lease_until.is.null,lease_until.lt.${now})`,
    { method: "DELETE", headers, signal: AbortSignal.timeout(10000) },
  );
  return new Response(null, { status: response.ok ? 204 : 502 });
}
// Scheduled functions have no public HTTP invocation route on Netlify.
export const config = { schedule: "0 6 * * *" };
