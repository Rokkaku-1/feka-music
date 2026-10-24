import { handler } from "../../server/youtube-handler.mjs";
import { validateRequest, rejected } from "../../server/request-security.mjs";

export default async function (request) {
  const invalid = validateRequest(request);
  if (invalid) return rejected(invalid);
  const url = new URL(request.url);
  const result = await handler({
    httpMethod: "GET",
    queryStringParameters: Object.fromEntries(url.searchParams),
  });
  return new Response(result.body, {
    status: result.statusCode,
    headers: { ...result.headers, "X-Content-Type-Options": "nosniff" },
  });
}

export const config = {
  path: "/api/music",
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
